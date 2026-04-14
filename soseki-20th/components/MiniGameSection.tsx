'use client';

import { useState } from 'react';
import GameModal from './GameModal';

export default function MiniGameSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className="px-4 py-12 md:px-8 lg:px-16">
        <h2 className="mb-6 text-2xl font-bold text-yellow-400">🎮 ミニゲーム</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 漱石タイピングカード */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 transition-colors hover:border-yellow-400/50">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-3xl">⌨️</span>
              <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400 border border-yellow-400/30">
                +100 Coins
              </span>
            </div>

            <h3 className="mb-1 text-lg font-bold text-white">漱石タイピング</h3>
            <p className="mb-5 text-sm text-gray-400">
              名言をタイピングしてコインをゲット！漱石の言葉をマスターしよう。
            </p>

            <button
              onClick={() => setIsOpen(true)}
              className="w-full rounded-lg bg-yellow-400 py-2 text-center font-bold text-black transition-opacity hover:opacity-90"
            >
              PLAY NOW
            </button>
          </div>
        </div>
      </section>

      <GameModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="漱石タイピング"
        gameUrl="/games/typing-game.html"
      />
    </>
  );
}
