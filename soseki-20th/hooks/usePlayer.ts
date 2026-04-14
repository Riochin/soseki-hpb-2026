import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/api';

export interface CollectionItem {
  itemId: number;
  name: string;
  rarity: 'UR' | 'SSR' | 'R' | 'N';
  icon: string;
  acquired: boolean;
}

export interface Player {
  name: string;
  coins: number;
  debt: number;
  collection: CollectionItem[];
}

export interface GachaResult {
  item: CollectionItem;
  isNew: boolean;
  newCoins: number;
}

export interface UsePlayerResult {
  player: Player | null;
  isLoading: boolean;
  error: Error | null;
  spinGacha(): Promise<GachaResult>;
  borrowCoins(): Promise<void>;
}

export function usePlayer(name: string | null): UsePlayerResult {
  const { data, error, isLoading, mutate } = useSWR<Player>(
    name ? `/api/players/${encodeURIComponent(name)}` : null,
    fetcher,
  );

  async function spinGacha(): Promise<GachaResult> {
    if (!name) throw new Error('プレイヤー名が未設定です');

    const result = await apiFetch<GachaResult>('/api/gacha', {
      method: 'POST',
      body: JSON.stringify({ player_name: name }),
    });

    // プレイヤーデータを再取得して状態を更新
    await mutate();
    return result;
  }

  async function borrowCoins(): Promise<void> {
    if (!name) throw new Error('プレイヤー名が未設定です');

    await apiFetch<{ coins: number; debt: number }>(
      `/api/players/${encodeURIComponent(name)}/borrow`,
      { method: 'POST' },
    );

    await mutate();
  }

  return {
    player: data ?? null,
    isLoading,
    error: error ?? null,
    spinGacha,
    borrowCoins,
  };
}
