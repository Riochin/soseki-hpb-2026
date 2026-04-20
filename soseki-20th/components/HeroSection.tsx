'use client'

import Image from 'next/image'
import QuoteOverlay from './QuoteOverlay'
import { useSosekiName } from '@/hooks/useU18Mode'

type Props = {
  isMuted: boolean
  onToggleMute: () => void
}

export default function HeroSection({ isMuted, onToggleMute }: Props) {
  const sosekiName = useSosekiName()
  return (
    <section className="section-reveal relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-20 sm:min-h-screen sm:pb-24 md:px-8 lg:px-16">
      <QuoteOverlay />

      {/* 日付 */}
      <p className="mb-3 mt-4 text-center font-mono text-sm tracking-widest text-accent/70 sm:mt-0">
        2026年4月23日（木）— BIRTHDAY
      </p>

      {/* 大見出し */}
      <h1
        className="mb-8 text-center text-3xl leading-relaxed tracking-wider text-white sm:text-4xl md:text-6xl lg:text-7xl"
        style={{ fontFamily: "var(--font-yuji-syuku), serif" }}
      >
        {sosekiName}
        <br />
        誕生日おめでとう
      </h1>

      {/* hpb画像 */}
      <div className="mb-6 -mt-4">
        <Image
          src="/hpb.png"
          alt="Happy Birthday"
          width={320}
          height={320}
          className="h-[252px] w-[252px] object-contain sm:h-[320px] sm:w-[320px]"
          priority
        />
      </div>

      {/* 音量トグル */}
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? '音をオンにする' : '音をオフにする'}
        className="absolute right-4 top-4 rounded-full p-2 text-accent/60 transition-colors hover:text-accent sm:right-6 sm:top-6"
      >
        {isMuted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
            <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="17" y1="7" x2="23" y2="13" strokeLinecap="round" />
            <line x1="23" y1="7" x2="17" y2="13" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
            <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.536 8.464a5 5 0 010 7.072" strokeLinecap="round" />
            <path d="M18.364 5.636a9 9 0 010 12.728" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* スクロール誘導 */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-accent/50">
        <span className="font-mono text-xs tracking-widest">SCROLL</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5 animate-bounce"
        >
          <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}
