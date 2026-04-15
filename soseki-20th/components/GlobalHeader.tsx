'use client';

import { Star, AlertTriangle, Coins } from 'lucide-react';

interface Props {
  coins: number;
  debt: number;
}

export default function GlobalHeader({ coins, debt }: Props) {
  const tickerContent = (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Star className="inline h-3 w-3" /> HAPPY 20th BIRTHDAY AKUME SOSEKI <Star className="inline h-3 w-3" />{' '}
      <AlertTriangle className="inline h-3 w-3" /> 警告: このサイトは漱石への愛に満ちています <AlertTriangle className="inline h-3 w-3" />{' '}
      <Star className="inline h-3 w-3" /> 2026年4月23日、伝説の誕生日 <Star className="inline h-3 w-3" />{' '}
      <AlertTriangle className="inline h-3 w-3" /> 課金注意: ガチャには依存性があります <AlertTriangle className="inline h-3 w-3" />{' '}
      <Star className="inline h-3 w-3" /> HAPPY 20th BIRTHDAY AKUME SOSEKI <Star className="inline h-3 w-3" />
    </span>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-yellow-400/20 bg-black/90 backdrop-blur">
      {/* ニュースティッカー */}
      <div className="overflow-hidden border-b border-yellow-400/10 bg-zinc-950 py-1 text-xs text-yellow-400">
        <div className="animate-ticker" role="marquee">
          {tickerContent}
        </div>
      </div>

      {/* メインヘッダー */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-mono text-sm font-bold tracking-widest text-yellow-400">
          SOSEKI 20th
        </div>

        <div className="flex items-center gap-4">
          {/* コイン残高 */}
          <div className="flex items-center gap-1 rounded border border-yellow-400/30 px-3 py-1 text-sm">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="font-mono font-bold text-yellow-300">{coins}</span>
            <span className="text-xs text-gray-400">C</span>
          </div>

          {/* 借金警告（debt > 0 のときのみ） */}
          {debt > 0 && (
            <div className="flex items-center gap-1 rounded border border-red-500/50 px-3 py-1 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="font-mono font-bold text-red-400">借金 {debt}C</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
