import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BorrowModal from '../BorrowModal';

// next/image をシンプルな img タグに差し替える
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next-eslint/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockOnBorrow = vi.fn();
const mockOnClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // sugarmoActive は Math.random() < 0.15 で発動。デフォルトは非発動にする。
  vi.spyOn(Math, 'random').mockReturnValue(0.9);
});

describe('BorrowModal: 通常モード', () => {
  it('debt=0 のとき「しゃあねえな」が表示される', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={0} />);
    expect(screen.getByText('「しゃあねえな」')).toBeInTheDocument();
  });

  it('debt=1000 のとき「またぁ？」が表示される', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={1000} />);
    expect(screen.getByText('「またぁ？」')).toBeInTheDocument();
  });

  it('debt=5000 のとき「もう俺も金ないて❗️」が表示される', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={5000} />);
    expect(screen.getByText('「もう俺も金ないて❗️」')).toBeInTheDocument();
  });

  it('debt=10000 のとき「殺す。」が表示される', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={10000} />);
    expect(screen.getByText('「殺す。」')).toBeInTheDocument();
  });

  it('初期金額は 1クレ と表示される', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('「＋」をクリックすると金額が 2クレ に増える', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: '＋' }));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('「−」を連続クリックしても 1クレ 未満にはならない', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: '−' }));
    fireEvent.click(screen.getByRole('button', { name: '−' }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('10クレまで増やすと「＋」ボタンが disabled になる', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} />);
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getByRole('button', { name: '＋' }));
    }
    expect(screen.getByRole('button', { name: '＋' })).toBeDisabled();
  });

  it('「借りる」ボタンをクリックすると onBorrow が呼ばれる', async () => {
    mockOnBorrow.mockResolvedValueOnce(undefined);
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /借りる/ }));
    await waitFor(() => {
      expect(mockOnBorrow).toHaveBeenCalledWith(1);
    });
  });

  it('borrowが成功するとonCloseが呼ばれる', async () => {
    mockOnBorrow.mockResolvedValueOnce(undefined);
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /借りる/ }));
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });

  it('onBorrow がエラーをスローするとエラーメッセージを表示する', async () => {
    mockOnBorrow.mockRejectedValueOnce(new Error('借金上限です'));
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /借りる/ }));
    await waitFor(() => {
      expect(screen.getByText('借金上限です')).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('「キャンセル」ボタンをクリックすると onClose が呼ばれる', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /キャンセル/ }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });
});

describe('BorrowModal: extreme モード (debt >= 50000)', () => {
  it('debt=50000 のとき「お前の内臓売った方が早くね❓」が表示される', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={50000} />);
    expect(screen.getByText('「お前の内臓売った方が早くね❓」')).toBeInTheDocument();
  });

  it('extreme モードにも「借りる」ボタンがある', () => {
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={50000} />);
    expect(screen.getByRole('button', { name: /借りる/ })).toBeInTheDocument();
  });

  it('extreme モードでも onBorrow が呼ばれる', async () => {
    mockOnBorrow.mockResolvedValueOnce(undefined);
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={50000} />);
    fireEvent.click(screen.getByRole('button', { name: /借りる/ }));
    await waitFor(() => {
      expect(mockOnBorrow).toHaveBeenCalledWith(1);
    });
  });
});

describe('BorrowModal: 巣鴨モード (sugamo)', () => {
  it('Math.random が 0 のとき（debt >= 10000）巣鴨モードになり「また巣鴨？」が表示される', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={10000} />);
    expect(screen.getByText(/また巣鴨/)).toBeInTheDocument();
  });

  it('debt < 10000 のとき Math.random が 0 でも巣鴨モードにならない', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<BorrowModal onBorrow={mockOnBorrow} onClose={mockOnClose} debt={9999} />);
    expect(screen.queryByText(/また巣鴨/)).not.toBeInTheDocument();
  });
});
