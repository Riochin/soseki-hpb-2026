'use client';
import Image from 'next/image';

type Props = { visible: boolean };

export default function ScrollToTopButton({ visible }: Props) {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-30 transition-all duration-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] hover:drop-shadow-[0_6px_18px_rgba(0,0,0,0.9)] hover:scale-110 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
      }`}
      aria-label="ページ上部へ戻る"
    >
      <Image src="/up.png" alt="上へ戻る" width={72} height={72} />
    </button>
  );
}
