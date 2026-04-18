'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';

type Props = { visible: boolean };

export default function ScrollToTopButton({ visible }: Props) {
  const [showText, setShowText] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      setAtBottom(isBottom);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowText(true);
    setTimeout(() => setShowText(false), 1800);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-30 flex flex-col items-center gap-2 transition-all duration-300 ${
      visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
    }`}>
      <span
        className={`text-white text-xl tracking-widest whitespace-nowrap transition-all duration-300 [font-family:var(--font-yuji-syuku)] ${
          showText ? 'opacity-100 -translate-y-2' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
      >
        \ じゃ、また /
      </span>
      <button
        onClick={handleClick}
        className={`drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] hover:drop-shadow-[0_6px_18px_rgba(0,0,0,0.9)] hover:scale-110 transition-all duration-300 ${
          atBottom ? 'animate-bounce' : ''
        }`}
        aria-label="ページ上部へ戻る"
      >
        <Image src="/up.png" alt="上へ戻る" width={96} height={96} />
      </button>
    </div>
  );
}
