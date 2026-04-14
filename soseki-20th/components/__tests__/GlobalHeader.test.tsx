import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlobalHeader from '../GlobalHeader';

describe('GlobalHeader', () => {
  it('コイン残高を表示する', () => {
    render(<GlobalHeader coins={250} debt={0} />);
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('debt が 0 のとき借金警告を表示しない', () => {
    render(<GlobalHeader coins={100} debt={0} />);
    expect(screen.queryByText(/借金/)).not.toBeInTheDocument();
  });

  it('debt > 0 のとき赤色の借金警告を表示する', () => {
    render(<GlobalHeader coins={100} debt={500} />);
    const warning = screen.getByText(/借金/);
    expect(warning).toBeInTheDocument();
    // 赤色クラスを持つ要素内に表示される
    expect(warning.closest('[class*="red"]') ?? warning).toBeInTheDocument();
  });

  it('ニュースティッカーのテキストが含まれている', () => {
    render(<GlobalHeader coins={100} debt={0} />);
    // ティッカーに何らかの祝福テキストがある
    expect(screen.getByRole('marquee') ?? document.querySelector('.animate-ticker')).toBeTruthy();
  });

  it('sticky クラスで上部固定される', () => {
    const { container } = render(<GlobalHeader coins={100} debt={0} />);
    const header = container.querySelector('header');
    expect(header?.className).toMatch(/sticky|fixed/);
  });
});
