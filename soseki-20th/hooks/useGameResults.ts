import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import {
  IS_UI_MOCK,
  MOCK_GAME_RESULTS_SHOOTING,
  MOCK_GAME_RESULTS_TYPING,
} from '@/lib/mock';

export type MiniGameType = 'typing' | 'shooting';

export interface GameResultLeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  gradeRank: string;
  createdAt: string;
}

export interface UseGameResultsResult {
  entries: GameResultLeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
}

function buildGameResultsPath(
  gameType: MiniGameType,
  limit: number,
  timeLimitForTyping?: number | null,
): string {
  const params = new URLSearchParams({
    gameType,
    limit: String(limit),
  });
  if (
    gameType === 'typing' &&
    timeLimitForTyping != null &&
    timeLimitForTyping > 0
  ) {
    params.set('timeLimit', String(timeLimitForTyping));
  }
  return `/api/game-results?${params.toString()}`;
}

/**
 * @param timeLimitForTyping 漱石タイピングのみ。秒数（例: 30, 60, 120）。API の `timeLimit` クエリに対応。
 */
export function useGameResults(
  gameType: MiniGameType,
  limit = 10,
  timeLimitForTyping?: number | null,
): UseGameResultsResult {
  const path = buildGameResultsPath(gameType, limit, timeLimitForTyping);

  const { data, error, isLoading } = useSWR<{ entries: GameResultLeaderboardEntry[] }>(
    IS_UI_MOCK ? null : path,
    fetcher,
  );

  const mockEntries =
    gameType === 'typing' ? MOCK_GAME_RESULTS_TYPING : MOCK_GAME_RESULTS_SHOOTING;

  return {
    entries: IS_UI_MOCK ? mockEntries : (data?.entries ?? []),
    isLoading: IS_UI_MOCK ? false : isLoading,
    error: IS_UI_MOCK ? null : (error ?? null),
  };
}
