'use client';

import { useState } from 'react';
import { Keyboard, Crosshair, Trophy } from 'lucide-react';
import GameModal from './GameModal';
import {
  useGameResults,
  type GameResultLeaderboardEntry,
  type MiniGameType,
} from '@/hooks/useGameResults';

interface Props {
  playerName: string | null;
}

/** タイピングゲームの制限時間（秒）— `games/typing-game.html` の diff-btn と一致 */
const TYPING_TIME_OPTIONS = [30, 60, 120] as const;
type TypingTimeSeconds = (typeof TYPING_TIME_OPTIONS)[number];

function formatLeaderboardDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '—';
  }
}

function isSelfRow(
  playerName: string | null,
  row: GameResultLeaderboardEntry,
): boolean {
  if (playerName == null || playerName.trim() === '') return false;
  return row.playerName.trim() === playerName.trim();
}

function LeaderboardLoadingSkeleton() {
  return (
    <div
      className="space-y-2 py-1"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">ランキングを読み込み中です</span>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded bg-zinc-800/80"
          aria-hidden
        />
      ))}
    </div>
  );
}

interface LeaderboardRowsProps {
  entries: GameResultLeaderboardEntry[];
  playerName: string | null;
}

function LeaderboardTable({ entries, playerName }: LeaderboardRowsProps) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[360px] text-left text-sm text-gray-300">
        <caption className="sr-only">
          スコア順のランキング。順位、プレイヤー名、スコア、グレード、記録日時。
        </caption>
        <thead>
          <tr className="border-b border-yellow-400/20 text-xs uppercase tracking-wider text-yellow-400/70">
            <th scope="col" className="py-2 pr-2 font-semibold">
              #
            </th>
            <th scope="col" className="py-2 pr-2 font-semibold">
              名前
            </th>
            <th scope="col" className="py-2 pr-2 font-semibold">
              スコア
            </th>
            <th scope="col" className="py-2 pr-2 font-semibold">
              ランク
            </th>
            <th scope="col" className="py-2 font-semibold">
              記録
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row) => {
            const self = isSelfRow(playerName, row);
            return (
              <tr
                key={`${row.rank}-${row.playerName}-${row.createdAt}`}
                className={`border-b border-zinc-800/80 last:border-0 ${
                  self
                    ? 'bg-yellow-400/[0.08] ring-1 ring-inset ring-yellow-400/25'
                    : ''
                }`}
              >
                <td className="py-2 pr-2 font-mono text-yellow-400/90">
                  {row.rank}
                </td>
                <td className="py-2 pr-2 text-white">
                  {row.playerName}
                  {self && (
                    <span className="ml-2 rounded border border-yellow-400/40 bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                      自分
                    </span>
                  )}
                </td>
                <td className="py-2 pr-2 font-mono tabular-nums">
                  {row.score.toLocaleString()}
                </td>
                <td className="py-2 pr-2 font-bold text-yellow-400/90">
                  {row.gradeRank}
                </td>
                <td className="py-2 text-xs text-gray-500 tabular-nums">
                  <time dateTime={row.createdAt}>
                    {formatLeaderboardDate(row.createdAt)}
                  </time>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LeaderboardCards({ entries, playerName }: LeaderboardRowsProps) {
  return (
    <ul className="divide-y divide-zinc-800/90 border border-yellow-400/15 sm:hidden">
      {entries.map((row) => {
        const self = isSelfRow(playerName, row);
        return (
          <li key={`${row.rank}-${row.playerName}-${row.createdAt}`}>
            <div
              className={`flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-3 ${
                self ? 'bg-yellow-400/[0.08]' : ''
              }`}
            >
              <span className="w-8 shrink-0 pt-1 font-mono text-sm text-yellow-400/90">
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-white">{row.playerName}</span>
                  {self && (
                    <span className="rounded border border-yellow-400/40 bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                      自分
                    </span>
                  )}
                </div>
                <time
                  className="mt-0.5 text-xs text-gray-500 tabular-nums"
                  dateTime={row.createdAt}
                >
                  {formatLeaderboardDate(row.createdAt)}
                </time>
              </div>
              <div className="ml-auto shrink-0 text-right">
                <div className="font-mono text-xl font-black tabular-nums leading-none tracking-tight text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.12)]">
                  {row.score.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] font-bold tabular-nums text-gray-400">
                  ランク{' '}
                  <span className="text-yellow-400/90">{row.gradeRank}</span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function MiniGameSection({ playerName }: Props) {
  const [typingOpen, setTypingOpen] = useState(false);
  const [shootingOpen, setShootingOpen] = useState(false);
  const [rankTab, setRankTab] = useState<MiniGameType>('typing');
  const [typingTimeSec, setTypingTimeSec] = useState<TypingTimeSeconds>(30);

  const timeLimitArg = rankTab === 'typing' ? typingTimeSec : null;
  const { entries, isLoading, error } = useGameResults(
    rankTab,
    15,
    timeLimitArg,
  );

  const rankingRegionId = 'minigame-leaderboard-panel';

  return (
    <>
      <section
        className="section-reveal px-4 py-12 md:px-8 lg:px-16"
        aria-labelledby="minigame-section-heading"
      >
        <p className="mb-4 font-mono text-xs tracking-widest text-yellow-400/60">
          — MINI GAME
        </p>
        <h2
          id="minigame-section-heading"
          className="mb-8 text-xl font-black tracking-tight text-white md:text-3xl"
          style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
        >
          ミニゲーム
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 漱石タイピングカード */}
          <div className="border-2 border-yellow-400/20 bg-[#141008] p-6 transition-colors hover:border-yellow-400/50">
            <div className="mb-3 flex items-start justify-between">
              <Keyboard className="h-8 w-8 text-yellow-400" aria-hidden />
              <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400">
                +1 ~ 30 Credit
              </span>
            </div>

            <h3 className="mb-1 text-lg font-bold text-white">
              漱石タイピング
            </h3>
            <p className="mb-5 text-sm text-gray-400">
              名言をタイピングしてCreditをゲット！漱石の言葉をマスターしよう。
            </p>

            <button
              type="button"
              onClick={() => setTypingOpen(true)}
              className="w-full bg-yellow-400 py-2 text-center font-bold text-black transition-opacity hover:opacity-90"
            >
              PLAY NOW
            </button>
          </div>

          {/* 漱石シューターカード */}
          <div className="border-2 border-yellow-400/20 bg-[#141008] p-6 transition-colors hover:border-yellow-400/50">
            <div className="mb-3 flex items-start justify-between">
              <Crosshair className="h-8 w-8 text-yellow-400" aria-hidden />
              <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400">
                +1 ~ 15 Credit
              </span>
            </div>

            <h3 className="mb-1 text-lg font-bold text-white">
              インファイト花京院
            </h3>
            <p className="mb-5 text-sm text-gray-400">
              いける‼️いける‼️いける‼️ロー‼️ロー‼️ロー‼️ロー‼️
            </p>

            <button
              type="button"
              onClick={() => setShootingOpen(true)}
              className="w-full bg-yellow-400 py-2 text-center font-bold text-black transition-opacity hover:opacity-90"
            >
              PLAY NOW
            </button>
          </div>
        </div>

        <div
          id={rankingRegionId}
          className="mt-10 border-2 border-yellow-400/20 bg-[#0c0a06] p-4 sm:p-6"
          role="region"
          aria-labelledby="minigame-ranking-heading"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 shrink-0 text-yellow-400" aria-hidden />
              <h3
                id="minigame-ranking-heading"
                className="text-lg font-bold text-white"
              >
                ランキング
              </h3>
            </div>
            <div
              className="flex flex-wrap gap-1 rounded border border-yellow-400/30 p-0.5 sm:ml-auto"
              role="group"
              aria-label="ミニゲームの種類"
            >
              <button
                type="button"
                onClick={() => setRankTab('typing')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                  rankTab === 'typing'
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-400/80 hover:bg-yellow-400/10'
                }`}
                aria-pressed={rankTab === 'typing'}
              >
                漱石タイピング
              </button>
              <button
                type="button"
                onClick={() => setRankTab('shooting')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                  rankTab === 'shooting'
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-400/80 hover:bg-yellow-400/10'
                }`}
                aria-pressed={rankTab === 'shooting'}
              >
                インファイト花京院
              </button>
            </div>
          </div>

          {rankTab === 'typing' && (
            <div
              className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
              role="group"
              aria-label="漱石タイピングの制限時間別ランキング"
            >
              <span className="text-xs font-medium text-gray-500">
                制限時間
              </span>
              <div className="flex flex-wrap gap-1">
                {TYPING_TIME_OPTIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTypingTimeSec(sec)}
                    className={`rounded border px-2.5 py-1 text-xs font-bold transition-colors ${
                      typingTimeSec === sec
                        ? 'border-yellow-400 bg-yellow-400/15 text-yellow-400'
                        : 'border-yellow-400/25 text-yellow-400/70 hover:border-yellow-400/50 hover:text-yellow-400'
                    }`}
                    aria-pressed={typingTimeSec === sec}
                  >
                    {sec}秒
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400" role="alert">
              ランキングを読み込めませんでした。しばらくしてから再度お試しください。
            </p>
          )}
          {isLoading && !error && <LeaderboardLoadingSkeleton />}
          {!isLoading && !error && entries.length === 0 && (
            <p className="rounded border border-dashed border-yellow-400/20 bg-black/20 px-4 py-6 text-center text-sm text-gray-500">
              {rankTab === 'typing' ? (
                <>
                  {typingTimeSec}秒モードの記録はまだありません。
                  <span className="mt-1 block text-xs text-gray-600">
                    PLAY NOW から挑戦するとここに表示されます。
                  </span>
                </>
              ) : (
                <>
                  まだ記録がありません。
                  <span className="mt-1 block text-xs text-gray-600">
                    PLAY NOW から挑戦してください。
                  </span>
                </>
              )}
            </p>
          )}
          {!isLoading && !error && entries.length > 0 && (
            <>
              <LeaderboardTable entries={entries} playerName={playerName} />
              <LeaderboardCards entries={entries} playerName={playerName} />
            </>
          )}
        </div>
      </section>

      <GameModal
        isOpen={typingOpen}
        onClose={() => setTypingOpen(false)}
        title="漱石タイピング"
        gameUrl="/games/typing-game.html"
        playerName={playerName}
      />
      <GameModal
        isOpen={shootingOpen}
        onClose={() => setShootingOpen(false)}
        title="インファイト花京院"
        gameUrl="/games/shooting-game.html"
        playerName={playerName}
        mobileSupported
      />
    </>
  );
}
