/**
 * GET /api/game-results の ListLeaderboard（btrim + プレイヤー別最高スコア）と同じ規則で集約する。
 * モックの生データに同一プレイヤーが複数行あっても、表示は1行に揃える。
 */

export interface LeaderboardEntryLike {
  rank: number;
  playerName: string;
  score: number;
  gradeRank: string;
  createdAt: string;
}

function pickBest(a: LeaderboardEntryLike, b: LeaderboardEntryLike): LeaderboardEntryLike {
  if (b.score !== a.score) {
    return b.score > a.score ? b : a;
  }
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  return ta <= tb ? a : b;
}

/**
 * playerName は trim してキーにし、勝ち行の playerName も trim 済みで返す。
 * 並びはスコア降順、同点は createdAt 昇順（API の外側 ORDER BY に合わせる）。
 */
export function dedupeLeaderboardBestPerPlayer(
  entries: readonly LeaderboardEntryLike[],
  limit: number,
): LeaderboardEntryLike[] {
  const byPlayer = new Map<string, LeaderboardEntryLike>();

  for (const e of entries) {
    const key = e.playerName.trim();
    if (key === '') continue;
    const prev = byPlayer.get(key);
    const next = prev ? pickBest(prev, { ...e, playerName: key }) : { ...e, playerName: key };
    byPlayer.set(key, next);
  }

  const sorted = [...byPlayer.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return sorted.slice(0, Math.max(0, limit)).map((e, i) => ({
    ...e,
    rank: i + 1,
  }));
}
