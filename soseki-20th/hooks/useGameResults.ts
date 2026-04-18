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

export function useGameResults(
  gameType: MiniGameType,
  limit = 10,
): UseGameResultsResult {
  const path = `/api/game-results?gameType=${encodeURIComponent(gameType)}&limit=${limit}`;

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
