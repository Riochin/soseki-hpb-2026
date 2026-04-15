'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { IS_UI_MOCK, MOCK_COUNTER_COUNT } from '@/lib/mock';

export interface UseCounterResult {
  count: number;
  incrementCounter(): Promise<void>;
}

export function useCounter(): UseCounterResult {
  const [count, setCount] = useState(IS_UI_MOCK ? MOCK_COUNTER_COUNT : 0);

  async function incrementCounter(): Promise<void> {
    if (IS_UI_MOCK) return;

    const result = await apiFetch<{ count: number }>('/api/counter', {
      method: 'POST',
    });
    setCount(result.count);
  }

  // ページ表示時に 1 回インクリメント
  useEffect(() => {
    if (IS_UI_MOCK) return;
    incrementCounter().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { count, incrementCounter };
}
