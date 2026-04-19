import Image from 'next/image';

const ALL_IMAGES = Array.from({ length: 26 }, (_, i) =>
  `/games/face-memory/easy/${String(i + 1).padStart(2, '0')}.png`
);
const ROW_IMAGES = [
  ALL_IMAGES.slice(0, 9),   // 01–09
  ALL_IMAGES.slice(9, 18),  // 10–18
  ALL_IMAGES.slice(18),     // 19–26
];

type RowProps = {
  images: string[];
  reverse?: boolean;
  duration: number;
  offset?: number;
};

function ImageRow({ images, reverse = false, duration, offset = 0 }: RowProps) {
  const doubled = [...images, ...images];
  return (
    <div className="overflow-hidden flex-1">
      <div
        className={reverse ? 'animate-ticker-reverse' : 'animate-ticker'}
        style={{
          animationDuration: `${duration}s`,
          animationDelay: `-${offset}s`,
          display: 'flex',
          gap: '8px',
          height: '100%',
        }}
      >
        {doubled.map((src, i) => (
          <div
            key={i}
            className="relative flex-shrink-0"
            style={{ aspectRatio: '16/9', height: '100%' }}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="auto"
              className="object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverviewSection() {
  return (
    <section className="relative overflow-hidden" style={{ height: "80vh" }}>
      {/* 背景: 3行スライドショー */}
      <div className="absolute inset-0 flex flex-col gap-2">
        <ImageRow images={ROW_IMAGES[0]} duration={60} />
        <ImageRow images={ROW_IMAGES[1]} reverse duration={75} offset={20} />
        <ImageRow images={ROW_IMAGES[2]} duration={90} offset={40} />
      </div>

      {/* 中央ディム（文字背景をボワっと暗く） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)",
        }}
      />

      {/* テキストオーバーレイ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h2
          className="text-3xl md:text-7xl font-bold text-white"
          style={{
            fontFamily: "var(--font-yuji-syuku), serif",
            textShadow:
              "0 0 40px rgba(0,0,0,0.95), 0 0 80px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.95)",
          }}
        >
          巣鴨の大黒柱
        </h2>
        <p
          className="mt-3 text-sm md:text-2xl leading-relaxed text-white max-w-xl"
          style={{
            fontFamily: "var(--font-yuji-syuku), serif",
            textShadow:
              "0 0 30px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.95)",
          }}
        >
          <span className="md:whitespace-nowrap">
            2006年4月23日、
            <br className="md:hidden" />
            この世に生を受けたアクメ漱石は、
          </span>
          <br />
          巣鴨を根城にその存在感を放ち続けてきた。
          <br />
          <br className="md:hidden" />
          笑顔で場を温め、
          <br className="md:hidden" />
          時に頼もしく、時に愛おしい——
          <br />
          <br className="md:hidden" />
          そんな唯一無二の
          二十年を、ここに祝う。
        </p>
      </div>
    </section>
  );
}
