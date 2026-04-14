import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NameInputModal from '../NameInputModal';

const mockOnInit = vi.fn();

describe('NameInputModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // グローバル fetch をモック
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('localStorage に playerName がない場合はモーダルを表示する', () => {
    render(<NameInputModal onInit={mockOnInit} />);
    expect(screen.getByText('お名前を入力してください')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('localStorage に playerName がある場合はモーダルをスキップして onInit を呼ぶ', async () => {
    const player = { name: 'テスト太郎', coins: 100, debt: 0, collection: [] };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => player,
    });
    localStorage.setItem('playerName', 'テスト太郎');

    render(<NameInputModal onInit={mockOnInit} />);

    expect(screen.queryByText('お名前を入力してください')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockOnInit).toHaveBeenCalledWith(player);
    });
  });

  it('空文字で送信するとエラーメッセージを表示し API を呼ばない', async () => {
    render(<NameInputModal onInit={mockOnInit} />);

    fireEvent.click(screen.getByRole('button', { name: /決定/i }));

    expect(await screen.findByText('名前を入力してください')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('名前を入力して送信すると POST /api/players を呼び onInit を実行する', async () => {
    const player = { name: 'テスト太郎', coins: 100, debt: 0, collection: [] };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => player,
    });

    render(<NameInputModal onInit={mockOnInit} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'テスト太郎' },
    });
    fireEvent.click(screen.getByRole('button', { name: /決定/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/players'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockOnInit).toHaveBeenCalledWith(player);
    });

    expect(localStorage.getItem('playerName')).toBe('テスト太郎');
  });

  it('API エラー時はエラーメッセージを表示する', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    render(<NameInputModal onInit={mockOnInit} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'エラーテスト' },
    });
    fireEvent.click(screen.getByRole('button', { name: /決定/i }));

    expect(await screen.findByText(/エラー/i)).toBeInTheDocument();
    expect(mockOnInit).not.toHaveBeenCalled();
  });
});
