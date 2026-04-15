export default function VideoSection() {
  return (
    <section className="px-4 py-16 md:px-8 lg:px-16">
      <p className="mb-4 font-mono text-xs tracking-widest text-yellow-400/60">
        — ANNIVERSARY FILM
      </p>
      <h2 className="mb-8 text-2xl font-black tracking-tight text-white md:text-3xl">
        誕生日記念動画
      </h2>

      <div className="overflow-hidden rounded-xl border border-yellow-400/20 bg-zinc-900">
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
            <p className="text-sm text-gray-400">近日公開</p>
          </div>
        </div>
      </div>
    </section>
  )
}
