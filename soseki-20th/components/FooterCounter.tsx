'use client';

import { Star } from 'lucide-react';
import { useCounter } from '@/hooks/useCounter';

export default function FooterCounter() {
  const { count } = useCounter();

  const isLucky = count > 0 && count % 777 === 0;
  const display = String(count).padStart(6, '0');

  return (
    <footer className="border-t border-zinc-800 bg-black px-4 py-10 text-center">
      {/* カウンター */}
      <div className="mb-4">
        <p className="mb-2 text-xs tracking-widest text-gray-500 uppercase">
          Access Counter
        </p>
        <div className="inline-flex items-center gap-0.5 rounded border border-zinc-700 bg-zinc-900 px-4 py-2">
          {display.split('').map((digit, i) => (
            <span
              key={i}
              className="font-mono text-2xl font-bold text-yellow-400"
            >
              {digit}
            </span>
          ))}
        </div>
      </div>

      {/* ラッキーナンバー演出 */}
      {isLucky && (
        <p className="mb-4 flex items-center justify-center gap-1 animate-pulse text-sm font-bold text-yellow-300">
          <Star className="h-4 w-4 fill-yellow-300" />
          LUCKY NUMBER!
          <Star className="h-4 w-4 fill-yellow-300" />
        </p>
      )}

      {/* 著作権 */}
      <p className="text-xs text-gray-600">
        © 2026 SOSEKI 20th Fan Site. All rights reserved.
      </p>
    </footer>
  );
}
