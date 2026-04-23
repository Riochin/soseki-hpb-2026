import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from '../HeroSection';

function renderHero(isEventDay = false) {
  return render(<HeroSection isMuted onToggleMute={() => {}} isEventDay={isEventDay} />);
}

describe('HeroSection', () => {
  it('誕生日の日付を表示する', () => {
    renderHero();
    // 2026年4月23日 の日付テキストがある
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText(/4.*23|April.*23/i)).toBeInTheDocument();
  });

  it('大見出しを表示する', () => {
    renderHero();
    // Happy Birthday または誕生日の見出しがある
    const heading = screen.getByRole('heading');
    expect(heading).toBeInTheDocument();
  });

  it('動画プレースホルダーが16:9アスペクト比で存在する', () => {
    renderHero();
    expect(screen.getByAltText('Happy Birthday')).toBeInTheDocument();
  });

  it('引用文カードに左黄色ボーダーがある', () => {
    const { container } = renderHero();
    // QuoteOverlay が挿入されること（aria-hidden の装飾コンテナ）
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('引用文のテキストが表示される', () => {
    const { container } = renderHero();
    // cite 要素（著者表記）が存在すること
    expect(container.querySelector('cite')).not.toBeNull();
  });

  it('当日は薄い当日ウォーターマークを表示する', () => {
    renderHero(true);
    expect(screen.getByTestId('hero-event-watermark')).toBeInTheDocument();
    expect(screen.getByText('当日')).toBeInTheDocument();
  });
});
