'use client';

import Image from 'next/image';
import { Star, AlertTriangle } from 'lucide-react';
import { toCredit } from '@/lib/currency';
import { useSosekiName } from '@/hooks/useU18Mode';

interface Props {
  coins: number;
  debt: number;
  visible: boolean;
}

export default function GlobalHeader({ coins, debt, visible }: Props) {
  const sosekiName = useSosekiName();
  const tickerContent = (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Star className="inline h-3 w-3" /> HAPPY 20th BIRTHDAY ACME SOSEKI <Star className="inline h-3 w-3" />{' '}
      <AlertTriangle className="inline h-3 w-3" /> このサイトは{sosekiName}ッズ数名によって合作されました <AlertTriangle className="inline h-3 w-3" />{' '}
      <Star className="inline h-3 w-3" /> 2026年4月23日、伝説の誕生日 <Star className="inline h-3 w-3" />{' '}
      <Star className="inline h-3 w-3" /> 祝！酒・タバコ解禁 <Star className="inline h-3 w-3" />{' '}
      <AlertTriangle className="inline h-3 w-3" /> 連コ注意: ガチャには依存性があります <AlertTriangle className="inline h-3 w-3" />{' '}
      <Star className="inline h-3 w-3" /> HAPPY 20th BIRTHDAY ACME SOSEKI <Star className="inline h-3 w-3" />
    </span>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 border-b border-edge bg-background/90 backdrop-blur transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="overflow-hidden border-b border-edge-faint bg-surface-muted py-1 text-xs text-accent">
        <div className="animate-ticker" role="marquee">
          {tickerContent}
          {tickerContent}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-mono text-sm font-bold tracking-widest text-accent">SOSEKI 20th</div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-control border border-edge-strong px-3 py-1 text-sm">
            <Image src="/1credit.png" alt="Credit" width={16} height={16} unoptimized className="h-4 w-4" />
            <span className="font-mono font-bold text-yellow-300">{toCredit(coins)}ｸﾚ</span>
          </div>

          {debt > 0 && (
            <div className="flex items-center gap-1 rounded-control border border-red-500/50 px-3 py-1 text-sm">
              <span className="text-xs text-red-300">借金</span>
              <span className="font-mono font-bold text-red-400">{toCredit(debt)}ｸﾚ</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
