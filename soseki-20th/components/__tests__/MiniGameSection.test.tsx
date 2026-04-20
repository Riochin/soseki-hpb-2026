import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiniGameSection from '../MiniGameSection';

vi.mock('@/hooks/useGameResults', () => ({
  useGameResults: () => ({
    entries: [],
    isLoading: false,
    error: null,
  }),
}));

describe('MiniGameSection', () => {
  it('「名言タイピング」のゲームカード見出しが表示される', () => {
    render(<MiniGameSection playerName={null} />);
    expect(
      screen.getByRole('heading', { name: /名言タイピング/ }),
    ).toBeInTheDocument();
  });

  it('+1 Credit バッジがゲームカードに表示される', () => {
    render(<MiniGameSection playerName={null} />);
    const badges = screen.getAllByText(/\+1.*Credit|Credit.*\+1/i);
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });

  it('PLAY NOW ボタンが4つ表示される', () => {
    render(<MiniGameSection playerName={null} />);
    const buttons = screen.getAllByRole('button', { name: /^PLAY NOW$/i });
    expect(buttons).toHaveLength(4);
    buttons.forEach((b) => expect(b).toBeEnabled());
  });

  it('ゲームモーダルが閉じた状態で初期表示される', () => {
    render(<MiniGameSection playerName={null} />);
    expect(screen.queryByTitle('漱石タイピング')).not.toBeInTheDocument();
  });
});
