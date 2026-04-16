import Image from 'next/image'
import QuoteOverlay from './QuoteOverlay'

export default function HeroSection() {
  return (
    <section className="section-reveal relative flex min-h-screen flex-col items-center justify-center px-4 md:px-8 lg:px-16">
      <QuoteOverlay />

      {/* 日付 */}
      <p className="mb-3 font-mono text-sm tracking-widest text-yellow-400/70 text-center">
        2026年4月23日（木）— BIRTHDAY
      </p>

      {/* 大見出し */}
      <h1
        className="mb-8 text-center text-3xl leading-relaxed tracking-wider text-white sm:text-4xl md:text-6xl lg:text-7xl"
        style={{ fontFamily: "var(--font-yuji-syuku), serif" }}
      >
        アクメ漱石
        <br />
        誕生日おめでとう
      </h1>

      {/* hpb画像 */}
      <div className="mb-6 mt-2">
        <Image
          src="/hpb.png"
          alt="Happy Birthday"
          width={160}
          height={160}
          className="object-contain"
          priority
        />
      </div>

      {/* スクロール誘導 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-yellow-400/50">
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
