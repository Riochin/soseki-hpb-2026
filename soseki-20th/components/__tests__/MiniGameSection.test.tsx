import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiniGameSection from '../MiniGameSection';

describe('MiniGameSection', () => {
  it('「漱石タイピング」のゲームカードタイトルが表示される', () => {
    render(<MiniGameSection playerName={null} />);
    expect(screen.getByText(/漱石タイピング/)).toBeInTheDocument();
  });

  it('+1 Credit バッジが表示される', () => {
    render(<MiniGameSection playerName={null} />);
    expect(screen.getByText(/\+1.*Credit|Credit.*\+1/i)).toBeInTheDocument();
  });

  it('PLAY NOW ボタンが表示される', () => {
    render(<MiniGameSection playerName={null} />);
    expect(screen.getByRole('button', { name: /play now/i })).toBeInTheDocument();
  });

  it('PLAY NOW ボタンをクリックできる', () => {
    render(<MiniGameSection playerName={null} />);
    const button = screen.getByRole('button', { name: /play now/i });
    expect(button).toBeEnabled();
  });

  it('ゲームモーダルが閉じた状態で初期表示される', () => {
    render(<MiniGameSection playerName={null} />);
    expect(screen.queryByTitle('漱石タイピング')).not.toBeInTheDocument();
  });
});
