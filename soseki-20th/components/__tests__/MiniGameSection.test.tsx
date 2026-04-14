import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiniGameSection from '../MiniGameSection';

describe('MiniGameSection', () => {
  it('「漱石タイピング」のゲームカードタイトルが表示される', () => {
    render(<MiniGameSection />);
    expect(screen.getByText(/漱石タイピング/)).toBeInTheDocument();
  });

  it('+100 Coins バッジが表示される', () => {
    render(<MiniGameSection />);
    expect(screen.getByText(/\+100.*Coins?|Coins?.*\+100/i)).toBeInTheDocument();
  });

  it('PLAY NOW リンクが games/typing-game.html を指す', () => {
    render(<MiniGameSection />);
    const link = screen.getByRole('link', { name: /play now/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('typing-game.html'));
  });

  it('PLAY NOW リンクが target="_blank" で開く', () => {
    render(<MiniGameSection />);
    const link = screen.getByRole('link', { name: /play now/i });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('rel="noopener noreferrer" が設定されている', () => {
    render(<MiniGameSection />);
    const link = screen.getByRole('link', { name: /play now/i });
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
