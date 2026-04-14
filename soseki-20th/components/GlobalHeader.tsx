'use client';

const TICKER_TEXT =
  '★ HAPPY 20th BIRTHDAY AKUME SOSEKI ★ ' +
  '⚠ 警告: このサイトは漱石への愛に満ちています ⚠ ' +
  '★ 2026年4月23日、伝説の誕生日 ★ ' +
  '⚠ 課金注意: ガチャには依存性があります ⚠ ' +
  '★ HAPPY 20th BIRTHDAY AKUME SOSEKI ★';

interface Props {
  coins: number;
  debt: number;
}

export default function GlobalHeader({ coins, debt }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-yellow-400/20 bg-black/90 backdrop-blur">
      {/* ニュースティッカー */}
      <div className="overflow-hidden border-b border-yellow-400/10 bg-zinc-950 py-1 text-xs text-yellow-400">
        <div className="animate-ticker" role="marquee">
          {TICKER_TEXT}
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
            <span className="text-yellow-400">🪙</span>
            <span className="font-mono font-bold text-yellow-300">{coins}</span>
            <span className="text-xs text-gray-400">C</span>
          </div>

          {/* 借金警告（debt > 0 のときのみ） */}
          {debt > 0 && (
            <div className="flex items-center gap-1 rounded border border-red-500/50 px-3 py-1 text-sm">
              <span className="text-red-400">⚠</span>
              <span className="font-mono font-bold text-red-400">借金 {debt}C</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
