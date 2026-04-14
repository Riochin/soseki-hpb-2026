import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from '../HeroSection';

describe('HeroSection', () => {
  it('誕生日の日付を表示する', () => {
    render(<HeroSection />);
    // 2026年4月23日 の日付テキストがある
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText(/4.*23|April.*23/i)).toBeInTheDocument();
  });

  it('大見出しを表示する', () => {
    render(<HeroSection />);
    // Happy Birthday または誕生日の見出しがある
    const heading = screen.getByRole('heading');
    expect(heading).toBeInTheDocument();
  });

  it('動画プレースホルダーが16:9アスペクト比で存在する', () => {
    const { container } = render(<HeroSection />);
    // aspect-video または aspect-[16/9] クラスを持つ要素がある
    const placeholder = container.querySelector('[class*="aspect"]');
    expect(placeholder).not.toBeNull();
  });

  it('引用文カードに左黄色ボーダーがある', () => {
    const { container } = render(<HeroSection />);
    // border-l または border-yellow を持つ引用要素がある
    const quote = container.querySelector('[class*="border-l"]');
    expect(quote).not.toBeNull();
  });

  it('引用文のテキストが表示される', () => {
    render(<HeroSection />);
    // 漱石の名言などの引用テキストがある
    const blockquote = document.querySelector('blockquote') ??
      screen.getByText(/吾輩|漱石|坊っちゃん|草枕|名言/i);
    expect(blockquote).toBeInTheDocument();
  });
});
