export default function HeroSection() {
  return (
    <section className="px-4 py-16 md:px-8 lg:px-16">
      {/* 日付 */}
      <p className="mb-3 font-mono text-sm tracking-widest text-yellow-400/70">
        2026年4月23日（木）— BIRTHDAY
      </p>

      {/* 大見出し */}
      <h1 className="mb-8 text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
        <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
          HAPPY 20th
        </span>
        <br />
        <span className="text-white">BIRTHDAY</span>
        <br />
        <span className="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
          AKUME SOSEKI
        </span>
      </h1>

      {/* 動画プレースホルダー（16:9） */}
      <div className="mb-10 overflow-hidden rounded-xl border border-yellow-400/20 bg-zinc-900">
        <div className="relative aspect-video w-full cursor-pointer group">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800 transition-colors group-hover:bg-zinc-700">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-yellow-400 text-yellow-400 transition-transform group-hover:scale-110">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 translate-x-0.5"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">誕生日記念動画（近日公開）</p>
          </div>
        </div>
      </div>

      {/* 引用文カード */}
      <div className="rounded-r-lg border-l-4 border-yellow-400 bg-zinc-900 p-6">
        <blockquote className="mb-2 text-lg italic text-gray-200">
          「智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。
          とかくに人の世は住みにくい。」
        </blockquote>
        <cite className="text-sm text-yellow-400">— 夏目漱石『草枕』</cite>
      </div>
    </section>
  );
}
