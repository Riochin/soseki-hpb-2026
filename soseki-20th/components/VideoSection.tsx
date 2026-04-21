const SHOW_VIDEO = process.env.NEXT_PUBLIC_SHOW_VIDEO === 'true';

export default function VideoSection() {
  return (
    <section className="section-reveal section-padding">
      <p className="mb-4 font-mono text-xs tracking-widest text-accent/60">— ANNIVERSARY FILM</p>
      <h2
        className="mb-8 text-xl font-black tracking-tight text-white md:text-3xl"
        style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
      >
        誕生日記念動画
      </h2>

      <div className="overflow-hidden rounded-panel border-2 border-edge bg-surface">
        {SHOW_VIDEO ? (
          <div className="relative aspect-video w-full">
            <iframe
              src="https://www.youtube.com/embed/mo3hTwe37Yo"
              title="誕生日記念動画"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : (
          <div className="group relative aspect-video w-full cursor-pointer">
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-video-back">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent text-accent">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 translate-x-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm text-stone-400">近日公開</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
