'use client';

import { Star } from 'lucide-react';
import { useCounter } from '@/hooks/useCounter';

export default function FooterCounter() {
  const { count } = useCounter();

  const isLucky = count > 0 && count % 777 === 0;
  const display = String(count).padStart(6, '0');

  return (
    <footer className="border-t border-edge bg-background px-4 py-10 text-center">
      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-widest text-stone-500">Access Counter</p>
        <div className="inline-flex items-center gap-0.5 rounded-control border-2 border-edge bg-surface px-4 py-2">
          {display.split('').map((digit, i) => (
            <span key={i} className="font-mono text-2xl font-bold text-accent">
              {digit}
            </span>
          ))}
        </div>
      </div>

      {isLucky && (
        <p className="mb-4 flex animate-pulse items-center justify-center gap-1 text-sm font-bold text-yellow-300">
          <Star className="h-4 w-4 fill-yellow-300" />
          LUCKY NUMBER!
          <Star className="h-4 w-4 fill-yellow-300" />
        </p>
      )}

      <p className="text-xs text-stone-600">© 2026 SOSEKI 20th Fan Site. All rights reserved.</p>
    </footer>
  );
}
