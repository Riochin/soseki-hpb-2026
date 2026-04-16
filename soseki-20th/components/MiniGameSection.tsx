'use client';

import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import GameModal from './GameModal';

interface Props {
  playerName: string | null;
}

export default function MiniGameSection({ playerName }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className="section-reveal px-4 py-12 md:px-8 lg:px-16">
        <p className="mb-4 font-mono text-xs tracking-widest text-yellow-400/60">
          — MINI GAME
        </p>
        <h2 className="mb-8 text-xl font-black tracking-tight text-white md:text-3xl" style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}>
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

            <h3 className="mb-1 text-lg font-bold text-white">漱石タイピング</h3>
            <p className="mb-5 text-sm text-gray-400">
              名言をタイピングしてCreditをゲット！漱石の言葉をマスターしよう。
            </p>

            <button
              onClick={() => setIsOpen(true)}
              className="w-full bg-yellow-400 py-2 text-center font-bold text-black transition-opacity hover:opacity-90"
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
        playerName={playerName}
      />
    </>
  );
}
