import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/api';
import { IS_UI_MOCK, MOCK_MESSAGES } from '@/lib/mock';

export type BgColor = 'white' | 'beige' | 'purple';
export type BgStyle = 'normal' | 'line' | 'grid';
export type CardFont = 'noto-sans' | 'tanuki' | 'fude-ji' | 'fude';
export type Stamp =
  | 'dio' | 'joseph' | 'jotaro' | 'kakyoin' | 'DIO'
  | 'josuke' | 'rohan' | 'bucciarati' | 'giorno'
  | 'diavolo' | 'jolyne' | 'anasui';

export interface Message {
  id: number;
  author: string;
  username?: string;
  text: string;
  bgColor: BgColor;
  bgStyle: BgStyle;
  font: CardFont;
  stamp?: Stamp;
  createdAt: string;
}

export interface PostMessageInput {
  author: string;
  username?: string;
  text: string;
  bgColor: BgColor;
  bgStyle: BgStyle;
  font: CardFont;
  stamp?: Stamp;
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
    { fallbackData: [] },
  );

  async function postMessage(input: PostMessageInput): Promise<void> {
    if (IS_UI_MOCK) return;

    const newMessage = await apiFetch<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(input),
    });

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
