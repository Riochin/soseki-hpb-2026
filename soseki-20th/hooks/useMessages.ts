import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/api';
import { IS_UI_MOCK, MOCK_MESSAGES } from '@/lib/mock';

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
    IS_UI_MOCK ? null : '/api/messages',
    fetcher,
  );

  async function postMessage(input: PostMessageInput): Promise<void> {
    if (IS_UI_MOCK) return;

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
    messages: IS_UI_MOCK ? MOCK_MESSAGES : (data ?? []),
    isLoading: IS_UI_MOCK ? false : isLoading,
    error: IS_UI_MOCK ? null : (error ?? null),
    postMessage,
  };
}
