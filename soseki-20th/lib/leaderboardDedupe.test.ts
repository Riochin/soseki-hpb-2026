import { describe, it, expect } from 'vitest';
import { dedupeLeaderboardBestPerPlayer } from './leaderboardDedupe';

describe('dedupeLeaderboardBestPerPlayer', () => {
  it('同一プレイヤーは最高スコア1行にまとめ、順位を振り直す', () => {
    const out = dedupeLeaderboardBestPerPlayer(
      [
        {
          rank: 1,
          playerName: 'A',
          score: 100,
          gradeRank: 'S',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          rank: 2,
          playerName: 'A',
          score: 50,
          gradeRank: 'B',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
        {
          rank: 3,
          playerName: 'B',
          score: 80,
          gradeRank: 'A',
          createdAt: '2026-01-01T12:00:00.000Z',
        },
      ],
      10,
    );
    expect(out).toHaveLength(2);
    expect(out[0].playerName).toBe('A');
    expect(out[0].score).toBe(100);
    expect(out[0].rank).toBe(1);
    expect(out[1].playerName).toBe('B');
    expect(out[1].rank).toBe(2);
  });

  it('名前の前後空白は同一視する', () => {
    const out = dedupeLeaderboardBestPerPlayer(
      [
        {
          rank: 1,
          playerName: ' 同じ ',
          score: 10,
          gradeRank: 'D',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          rank: 2,
          playerName: '同じ',
          score: 99,
          gradeRank: 'S',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      5,
    );
    expect(out).toHaveLength(1);
    expect(out[0].playerName).toBe('同じ');
    expect(out[0].score).toBe(99);
  });
});
