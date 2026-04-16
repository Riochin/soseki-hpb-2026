import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GachaSection from '../GachaSection';

const mockSpinGacha = vi.fn();
const mockBorrowCoins = vi.fn();

const mockCollection = [
  { itemId: 1, name: '伝説のメガネ', rarity: 'SSR' as const, icon: '👓', acquired: true },
  { itemId: 2, name: '徹夜のコーヒー', rarity: 'N' as const, icon: '☕', acquired: false },
  { itemId: 3, name: '黄金のキーボード', rarity: 'UR' as const, icon: '⌨️', acquired: false },
  { itemId: 4, name: '謎の領収書', rarity: 'R' as const, icon: '🧾', acquired: false },
];

let mockPlayer = { name: 'テスト', coins: 200, debt: 0, collection: mockCollection };

vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: () => ({
    player: mockPlayer,
    isLoading: false,
    error: null,
    spinGacha: mockSpinGacha,
    borrowCoins: mockBorrowCoins,
  }),
}));

describe('GachaSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlayer = { name: 'テスト', coins: 200, debt: 0, collection: mockCollection };
  });

  it('ガチャボタン（1クレ）が表示される', () => {
    render(<GachaSection playerName="テスト" />);
    expect(screen.getByRole('button', { name: /まわす|ガチャ/i })).toBeInTheDocument();
  });

  it('初期状態では借金ボタンは表示されない', () => {
    render(<GachaSection playerName="テスト" />);
    expect(screen.queryByRole('button', { name: /借金|borrow/i })).not.toBeInTheDocument();
  });

  it('コレクションを見るクリックでコレクションモーダルが表示される', () => {
    render(<GachaSection playerName="テスト" />);
    fireEvent.click(screen.getByRole('button', { name: /コレクションを見る/ }));
    expect(screen.getByText('伝説のメガネ')).toBeInTheDocument();
  });

  it('コレクションモーダルで未入手アイテムの ??? が表示される', () => {
    const { container } = render(<GachaSection playerName="テスト" />);
    fireEvent.click(screen.getByRole('button', { name: /コレクションを見る/ }));
    const unknownItems = container.querySelectorAll('p');
    expect(Array.from(unknownItems).some((el) => el.textContent === '???')).toBe(true);
  });

  it('ガチャボタンをクリックすると spinGacha が呼ばれる', async () => {
    mockSpinGacha.mockResolvedValueOnce({
      item: mockCollection[1],
      isNew: true,
      newCoins: 100,
    });
    render(<GachaSection playerName="テスト" />);

    fireEvent.click(screen.getByRole('button', { name: /まわす|ガチャ/i }));

    await waitFor(() => {
      expect(mockSpinGacha).toHaveBeenCalledOnce();
    });
  });

  it('コイン不足時に借金ボタンを押すと borrowCoins が呼ばれる', async () => {
    mockBorrowCoins.mockResolvedValueOnce(undefined);
    mockPlayer = { name: 'テスト', coins: 0, debt: 0, collection: mockCollection };
    render(<GachaSection playerName="テスト" />);

    fireEvent.click(screen.getByRole('button', { name: /まわす|ガチャ/i }));
    fireEvent.click(screen.getByRole('button', { name: /借金|borrow/i }));

    await waitFor(() => {
      expect(mockBorrowCoins).toHaveBeenCalledOnce();
    });
  });
});
