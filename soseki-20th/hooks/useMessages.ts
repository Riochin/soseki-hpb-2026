import { useState } from 'react';
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

export interface UpdateMessageInput {
  author?: string;
  text?: string;
}

export interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  postMessage(input: PostMessageInput): Promise<void>;
  deleteMessage(id: number): Promise<void>;
  updateMessage(id: number, input: UpdateMessageInput): Promise<void>;
}

export function useMessages(playerName?: string | null): UseMessagesResult {
  const [mockMessages, setMockMessages] = useState<Message[]>(MOCK_MESSAGES);

  const { data, error, isLoading, mutate } = useSWR<Message[]>(
    IS_UI_MOCK ? null : '/api/messages',
    fetcher,
    { fallbackData: [] },
  );

  async function postMessage(input: PostMessageInput): Promise<void> {
    if (IS_UI_MOCK) {
      const newMsg: Message = {
        id: Date.now(),
        ...input,
        createdAt: new Date().toISOString(),
      };
      setMockMessages((prev) => [newMsg, ...prev]);
      return;
    }

    const newMessage = await apiFetch<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    await mutate(
      (current) => (current ? [newMessage, ...current] : [newMessage]),
      { revalidate: false },
    );
  }

  async function deleteMessage(id: number): Promise<void> {
    if (!playerName) return;

    if (IS_UI_MOCK) {
      setMockMessages((prev) => prev.filter((m) => m.id !== id));
      return;
    }

    await apiFetch(`/api/messages/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ username: playerName }),
    });

    await mutate(
      (current) => (current ? current.filter((m) => m.id !== id) : []),
      { revalidate: false },
    );
  }

  async function updateMessage(id: number, input: UpdateMessageInput): Promise<void> {
    if (!playerName) return;

    if (IS_UI_MOCK) {
      setMockMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...input } : m)),
      );
      return;
    }

    const updated = await apiFetch<Message>(`/api/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ username: playerName, ...input }),
    });

    await mutate(
      (current) => (current ? current.map((m) => (m.id === updated.id ? updated : m)) : []),
      { revalidate: false },
    );
  }

  return {
    messages: IS_UI_MOCK ? mockMessages : (data ?? []),
    isLoading: IS_UI_MOCK ? false : isLoading,
    error: IS_UI_MOCK ? null : (error ?? null),
    postMessage,
    deleteMessage,
    updateMessage,
  };
}
