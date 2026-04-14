import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/api';

export interface Message {
  id: number;
  author: string;
  text: string;
  createdAt: string;
}

export interface PostMessageInput {
  author: string;
  text: string;
}

export interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  postMessage(input: PostMessageInput): Promise<void>;
}

export function useMessages(): UseMessagesResult {
  const { data, error, isLoading, mutate } = useSWR<Message[]>(
    '/api/messages',
    fetcher,
  );

  async function postMessage(input: PostMessageInput): Promise<void> {
    const newMessage = await apiFetch<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    // オプティミスティック更新: 既存一覧の先頭に追加（降順なので先頭）
    await mutate(
      (current) => (current ? [newMessage, ...current] : [newMessage]),
      { revalidate: false },
    );
  }

  return {
    messages: data ?? [],
    isLoading,
    error: error ?? null,
    postMessage,
  };
}
