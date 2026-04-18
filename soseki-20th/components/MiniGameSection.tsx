'use client';

import { useState } from 'react';
import { Keyboard, Crosshair, Trophy } from 'lucide-react';
import GameModal from './GameModal';
import { useGameResults, type MiniGameType } from '@/hooks/useGameResults';

interface Props {
  playerName: string | null;
}

export default function MiniGameSection({ playerName }: Props) {
  const [typingOpen, setTypingOpen] = useState(false);
  const [shootingOpen, setShootingOpen] = useState(false);
  const [rankTab, setRankTab] = useState<MiniGameType>('typing');
  const { entries, isLoading, error } = useGameResults(rankTab, 15);

  return (
    <>
      <section className="section-reveal px-4 py-12 md:px-8 lg:px-16">
        <p className="mb-4 font-mono text-xs tracking-widest text-yellow-400/60">
          — MINI GAME
        </p>
        <h2
          className="mb-8 text-xl font-black tracking-tight text-white md:text-3xl"
          style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}
        >
          ミニゲーム
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 漱石タイピングカード */}
          <div className="border-2 border-yellow-400/20 bg-[#141008] p-6 transition-colors hover:border-yellow-400/50">
            <div className="mb-3 flex items-start justify-between">
              <Keyboard className="h-8 w-8 text-yellow-400" />
              <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400 border border-yellow-400/30">
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
              onClick={() => setTypingOpen(true)}
              className="w-full bg-yellow-400 py-2 text-center font-bold text-black transition-opacity hover:opacity-90"
            >
              PLAY NOW
            </button>
          </div>

          {/* 漱石シューターカード */}
          <div className="border-2 border-yellow-400/20 bg-[#141008] p-6 transition-colors hover:border-yellow-400/50">
            <div className="mb-3 flex items-start justify-between">
              <Crosshair className="h-8 w-8 text-yellow-400" />
              <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400 border border-yellow-400/30">
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
              onClick={() => setShootingOpen(true)}
              className="w-full bg-yellow-400 py-2 text-center font-bold text-black transition-opacity hover:opacity-90"
            >
              PLAY NOW
            </button>
          </div>
        </div>

        <div className="mt-10 border-2 border-yellow-400/20 bg-[#0c0a06] p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-400" aria-hidden />
            <h3 className="text-lg font-bold text-white">ランキング</h3>
            <div className="ml-auto flex gap-1 rounded border border-yellow-400/30 p-0.5">
              <button
                type="button"
                onClick={() => setRankTab('typing')}
                className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                  rankTab === 'typing'
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-400/80 hover:bg-yellow-400/10'
                }`}
              >
                漱石タイピング
              </button>
              <button
                type="button"
                onClick={() => setRankTab('shooting')}
                className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                  rankTab === 'shooting'
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-400/80 hover:bg-yellow-400/10'
                }`}
              >
                インファイト花京院
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">
              ランキングを読み込めませんでした。
            </p>
          )}
          {isLoading && !error && (
            <p className="text-sm text-gray-500">読み込み中…</p>
          )}
          {!isLoading && !error && entries.length === 0 && (
            <p className="text-sm text-gray-500">
              まだ記録がありません。PLAY NOW から挑戦してください。
            </p>
          )}
          {!isLoading && !error && entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-yellow-400/20 text-xs uppercase tracking-wider text-yellow-400/70">
                    <th className="py-2 pr-2 font-semibold">#</th>
                    <th className="py-2 pr-2 font-semibold">名前</th>
                    <th className="py-2 pr-2 font-semibold">スコア</th>
                    <th className="py-2 font-semibold">ランク</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row) => (
                    <tr
                      key={`${row.rank}-${row.playerName}-${row.createdAt}`}
                      className="border-b border-zinc-800/80 last:border-0"
                    >
                      <td className="py-2 pr-2 font-mono text-yellow-400/90">
                        {row.rank}
                      </td>
                      <td className="py-2 pr-2 text-white">{row.playerName}</td>
                      <td className="py-2 pr-2 font-mono tabular-nums">
                        {row.score.toLocaleString()}
                      </td>
                      <td className="py-2 font-bold text-yellow-400/90">
                        {row.gradeRank}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
