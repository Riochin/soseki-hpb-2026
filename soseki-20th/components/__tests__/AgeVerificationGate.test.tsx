import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AgeVerificationGate from '../AgeVerificationGate';

describe('AgeVerificationGate', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('未確認時はオーバーレイを表示し、子コンテンツを非表示にする', () => {
    render(
      <AgeVerificationGate>
        <div>メインコンテンツ</div>
      </AgeVerificationGate>
    );

    expect(screen.getByText('年齢確認')).toBeInTheDocument();
    expect(screen.queryByText('メインコンテンツ')).not.toBeInTheDocument();
  });

  it('「はい」ボタンをクリックするとグリッチ演出後に子コンテンツを表示する', async () => {
    render(
      <AgeVerificationGate>
        <div>メインコンテンツ</div>
      </AgeVerificationGate>
    );

    fireEvent.click(screen.getByRole('button', { name: /はい/i }));

    // グリッチ中はまだ非表示
    expect(screen.queryByText('メインコンテンツ')).not.toBeInTheDocument();

    // 0.8秒後に表示される
    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText('メインコンテンツ')).toBeInTheDocument();
  });

  it('「はい」クリック後に sessionStorage の age_verified を保存する', async () => {
    render(
      <AgeVerificationGate>
        <div>メインコンテンツ</div>
      </AgeVerificationGate>
    );

    fireEvent.click(screen.getByRole('button', { name: /はい/i }));

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(sessionStorage.getItem('age_verified')).toBe('true');
  });

  it('sessionStorage に age_verified がある場合はオーバーレイをスキップして子コンテンツを表示する', () => {
    sessionStorage.setItem('age_verified', 'true');

    render(
      <AgeVerificationGate>
        <div>メインコンテンツ</div>
      </AgeVerificationGate>
    );

    expect(screen.queryByText('年齢確認')).not.toBeInTheDocument();
    expect(screen.getByText('メインコンテンツ')).toBeInTheDocument();
  });
});
