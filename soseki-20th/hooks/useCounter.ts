'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export interface UseCounterResult {
  count: number;
  incrementCounter(): Promise<void>;
}

export function useCounter(): UseCounterResult {
  const [count, setCount] = useState(0);

  async function incrementCounter(): Promise<void> {
    const result = await apiFetch<{ count: number }>('/api/counter', {
      method: 'POST',
    });
    setCount(result.count);
  }

  // ページ表示時に 1 回インクリメント
  useEffect(() => {
    incrementCounter().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { count, incrementCounter };
}
