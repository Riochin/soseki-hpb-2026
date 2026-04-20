import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { dedupeLeaderboardBestPerPlayer } from '@/lib/leaderboardDedupe';
import {
  IS_UI_MOCK,
  MOCK_GAME_RESULTS_FACE_MEMORY,
  MOCK_GAME_RESULTS_QUIZ,
  MOCK_GAME_RESULTS_SHOOTING,
  MOCK_GAME_RESULTS_TYPING,
} from '@/lib/mock';

export type MiniGameType = 'typing' | 'shooting' | 'face_memory' | 'quiz' | 'animal_tower';

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
  timeLimitFilter?: number | null,
): string {
  const params = new URLSearchParams({
    gameType,
    limit: String(limit),
  });
  if (
    (gameType === 'typing' || gameType === 'face_memory') &&
    timeLimitFilter != null &&
    timeLimitFilter > 0
  ) {
    params.set('timeLimit', String(timeLimitFilter));
  }
  return `/api/game-results?${params.toString()}`;
}

/**
 * @param timeLimitFilter 漱石タイピング: 制限秒数（30|60|120）。名場面神経衰弱: モード（1=EASY, 2=ムズすぎるな）。API の `timeLimit` クエリに対応。
 */
export function useGameResults(
  gameType: MiniGameType,
  limit = 10,
  timeLimitFilter?: number | null,
): UseGameResultsResult {
  const path = buildGameResultsPath(gameType, limit, timeLimitFilter);

  const { data, error, isLoading } = useSWR<{ entries: GameResultLeaderboardEntry[] }>(
    IS_UI_MOCK ? null : path,
    fetcher,
  );

  const rawEntries = useMemo(() => {
    if (IS_UI_MOCK) {
      if (gameType === 'typing') return MOCK_GAME_RESULTS_TYPING;
      if (gameType === 'face_memory') return MOCK_GAME_RESULTS_FACE_MEMORY;
      if (gameType === 'quiz') return MOCK_GAME_RESULTS_QUIZ;
      return MOCK_GAME_RESULTS_SHOOTING;
    }
    return data?.entries ?? [];
  }, [IS_UI_MOCK, gameType, data?.entries]);

  // 本番: POST で game_result に全プレイが残り、GET /api/game-results がプレイヤー別ベストに集約した一覧を返す。
  // モック: 生データに重複行がありうるため、本番APIと同じ規則でここだけ集約する。
  const entries = useMemo(() => {
    if (IS_UI_MOCK) {
      return dedupeLeaderboardBestPerPlayer(rawEntries, limit);
    }
    return rawEntries;
  }, [IS_UI_MOCK, rawEntries, limit]);

  return {
    entries,
    isLoading: IS_UI_MOCK ? false : isLoading,
    error: IS_UI_MOCK ? null : (error ?? null),
  };
}
