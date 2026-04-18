import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/api';
import {
  IS_UI_MOCK,
  MOCK_PLAYER,
  MOCK_GACHA_RESULT,
  MOCK_MULTI_GACHA_RESULT,
  MOCK_EARN_COINS_RESULT,
} from '@/lib/mock';

export interface CollectionItem {
  itemId: number;
  name: string;
  rarity: 'UR' | 'SSR' | 'R' | 'N';
  icon: string;
  acquired: boolean;
  is_giftable: boolean;
  proposed_by: string | null;
  is_consumed: boolean;
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

export interface MultiGachaResult {
  results: GachaResult[];
  newCoins: number;
}

export interface EarnCoinsResult {
  coinsEarned: number;
  newCoins: number;
  /** サーバーが game_result に保存した行の ID（任意） */
  resultId?: number;
}

export interface UsePlayerResult {
  player: Player | null;
  isLoading: boolean;
  error: Error | null;
  spinGacha(): Promise<GachaResult>;
  spinGachaMulti(): Promise<MultiGachaResult>;
  borrowCoins(amount: number): Promise<void>;
  earnCoins(
    gameType: string,
    payload: Record<string, unknown>,
    sessionId: string,
  ): Promise<EarnCoinsResult>;
  consumeItem(itemId: number): Promise<void>;
}

export function usePlayer(name: string | null): UsePlayerResult {
  const { data, error, isLoading, mutate } = useSWR<Player>(
    !IS_UI_MOCK && name ? `/api/players/${encodeURIComponent(name)}` : null,
    fetcher,
  );

  async function spinGacha(): Promise<GachaResult> {
    if (IS_UI_MOCK) return MOCK_GACHA_RESULT;
    if (!name) throw new Error('プレイヤー名が未設定です');

    const result = await apiFetch<GachaResult>('/api/gacha', {
      method: 'POST',
      body: JSON.stringify({ player_name: name }),
    });

    // プレイヤーデータを再取得して状態を更新
    await mutate();
    return result;
  }

  async function spinGachaMulti(): Promise<MultiGachaResult> {
    if (IS_UI_MOCK) return MOCK_MULTI_GACHA_RESULT;
    if (!name) throw new Error('プレイヤー名が未設定です');

    const result = await apiFetch<MultiGachaResult>('/api/gacha/multi', {
      method: 'POST',
      body: JSON.stringify({ player_name: name }),
    });

    await mutate();
    return result;
  }

  async function borrowCoins(amount: number): Promise<void> {
    if (IS_UI_MOCK) return;
    if (!name) throw new Error('プレイヤー名が未設定です');

    await apiFetch<{ coins: number; debt: number }>(
      `/api/players/${encodeURIComponent(name)}/borrow`,
      {
        method: 'POST',
        body: JSON.stringify({ amount }),
      },
    );

    await mutate();
  }

  async function earnCoins(
    gameType: string,
    payload: Record<string, unknown>,
    sessionId: string,
  ): Promise<EarnCoinsResult> {
    if (IS_UI_MOCK) return MOCK_EARN_COINS_RESULT;
    if (!name) throw new Error('プレイヤー名が未設定です');

    const result = await apiFetch<EarnCoinsResult>(
      `/api/players/${encodeURIComponent(name)}/game-reward`,
      {
        method: 'POST',
        body: JSON.stringify({ gameType, ...payload, sessionId }),
      },
    );

    await mutate();
    return result;
  }

  async function consumeItem(itemId: number): Promise<void> {
    if (IS_UI_MOCK) return;
    if (!name) throw new Error('プレイヤー名が未設定です');

    await apiFetch<{ consumed: boolean }>(
      `/api/players/${encodeURIComponent(name)}/items/${itemId}/consume`,
      { method: 'POST' },
    );

    await mutate();
  }

  return {
    player: IS_UI_MOCK ? MOCK_PLAYER : (data ?? null),
    isLoading: IS_UI_MOCK ? false : isLoading,
    error: IS_UI_MOCK ? null : (error ?? null),
    spinGacha,
    spinGachaMulti,
    borrowCoins,
    earnCoins,
    consumeItem,
  };
}
