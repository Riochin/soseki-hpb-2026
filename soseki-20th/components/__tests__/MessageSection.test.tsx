import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageSection from '../MessageSection';

// useMessages フックをモック
const mockPostMessage = vi.fn();
const mockMessages = [
  { id: 1, author: '太郎', text: 'お誕生日おめでとう！', createdAt: '2026-04-23T00:00:00Z' },
  { id: 2, author: '花子', text: '20歳おめでとう！', createdAt: '2026-04-23T01:00:00Z' },
];

vi.mock('@/hooks/useMessages', () => ({
  useMessages: () => ({
    messages: mockMessages,
    isLoading: false,
    error: null,
    postMessage: mockPostMessage,
  }),
}));

describe('MessageSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('メッセージカード一覧を表示する', () => {
    render(<MessageSection />);
    expect(screen.getByText('お誕生日おめでとう！')).toBeInTheDocument();
    expect(screen.getByText('20歳おめでとう！')).toBeInTheDocument();
  });

  it('著者名を表示する', () => {
    render(<MessageSection />);
    expect(screen.getByText(/太郎/)).toBeInTheDocument();
    expect(screen.getByText(/花子/)).toBeInTheDocument();
  });

  it('「+ メッセージを書く」ボタンが一覧末尾にある', () => {
    render(<MessageSection />);
    expect(screen.getByText(/メッセージを書く/)).toBeInTheDocument();
  });

  it('「+ メッセージを書く」クリックで投稿フォームが表示される', () => {
    render(<MessageSection />);
    fireEvent.click(screen.getByText(/メッセージを書く/));
    expect(screen.getByRole('textbox', { name: /本文|メッセージ/ })).toBeInTheDocument();
  });

  it('本文が空のまま送信するとバリデーションエラーを表示する', async () => {
    render(<MessageSection />);
    fireEvent.click(screen.getByText(/メッセージを書く/));
    fireEvent.click(screen.getByRole('button', { name: /送信/ }));
    expect(await screen.findByText(/本文.*入力|メッセージ.*入力/)).toBeInTheDocument();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('投稿フォームを送信すると postMessage が呼ばれる', async () => {
    mockPostMessage.mockResolvedValueOnce(undefined);
    render(<MessageSection />);

    fireEvent.click(screen.getByText(/メッセージを書く/));

    // 著者入力
    const inputs = screen.getAllByRole('textbox');
    // 著者フィールドと本文フィールドを探す
    const authorInput = screen.queryByPlaceholderText(/名前|お名前/) ??
      screen.getByLabelText(/名前|お名前/);
    const textInput = screen.getByRole('textbox', { name: /本文|メッセージ/ });

    fireEvent.change(authorInput, { target: { value: '漱石ファン' } });
    fireEvent.change(textInput, { target: { value: 'すごい！' } });
    fireEvent.click(screen.getByRole('button', { name: /送信/ }));

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({
        author: '漱石ファン',
        text: 'すごい！',
      });
    });
  });
});
