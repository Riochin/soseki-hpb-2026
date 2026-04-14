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

vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: () => ({
    player: { name: 'テスト', coins: 200, debt: 0, collection: mockCollection },
    isLoading: false,
    error: null,
    spinGacha: mockSpinGacha,
    borrowCoins: mockBorrowCoins,
  }),
}));

describe('GachaSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ガチャボタン（100C）が表示される', () => {
    render(<GachaSection playerName="テスト" />);
    expect(screen.getByRole('button', { name: /まわす|ガチャ/i })).toBeInTheDocument();
  });

  it('借金ボタンが表示される', () => {
    render(<GachaSection playerName="テスト" />);
    expect(screen.getByRole('button', { name: /借金|borrow/i })).toBeInTheDocument();
  });

  it('コレクションアイテムが 2 列グリッドで表示される', () => {
    const { container } = render(<GachaSection playerName="テスト" />);
    const grid = container.querySelector('[class*="grid"]');
    expect(grid).not.toBeNull();
    expect(screen.getByText('伝説のメガネ')).toBeInTheDocument();
  });

  it('未入手アイテムはグレースケールで表示される', () => {
    const { container } = render(<GachaSection playerName="テスト" />);
    // acquired:false のアイテムのコンテナに grayscale クラスがある
    const grayscaleItems = container.querySelectorAll('[class*="grayscale"]');
    expect(grayscaleItems.length).toBeGreaterThan(0);
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

  it('借金ボタンをクリックすると borrowCoins が呼ばれる', async () => {
    mockBorrowCoins.mockResolvedValueOnce(undefined);
    render(<GachaSection playerName="テスト" />);

    fireEvent.click(screen.getByRole('button', { name: /借金|borrow/i }));

    await waitFor(() => {
      expect(mockBorrowCoins).toHaveBeenCalledOnce();
    });
  });
});
