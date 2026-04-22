'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Props {
  onDone: () => void;
}

// タイムライン:
//   50ms  → Phase1: 黒+画像 フェードイン(500ms)
// 2200ms  → Phase1: 黒レイヤー フェードアウト開始(800ms) → 下の黄色が現れる
// 3000ms  → 黄色一面 (ため: 600ms)
// 3600ms  → Phase2: 「20」彫り込みアニメーション開始(900ms)
// 5400ms  → Phase2: 下へスライドアウト開始(800ms)
// 6200ms  → 完了

export default function IntroOverlay({ onDone }: Props) {
  const [imageVisible, setImageVisible] = useState(false);
  const [imageFaded, setImageFaded] = useState(false);
  const [carveStarted, setCarveStarted] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setImageVisible(true), 50),
      setTimeout(() => setImageFaded(true), 2200),
      setTimeout(() => setCarveStarted(true), 3600),
      setTimeout(() => setSlideOut(true), 5400),
      setTimeout(() => { setDone(true); onDone(); }, 6200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden pointer-events-none bg-black"
      style={{
        transform: slideOut ? 'translateY(100%)' : 'translateY(0)',
        transition: slideOut ? 'transform 800ms ease-in' : undefined,
      }}
    >
      {/* Layer 1 (底面): 黄色 + 「20」SVGマスク切り抜き
          imageFaded 後に初めて描画 → フェードイン中に黄色が透けるのを防ぐ
          carveStarted 前はマスク内テキストなし = 黄色一面
          carveStarted 後は twenty-carve アニメーションで「20」が彫り込まれる */}
      {imageFaded && <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="twenty-cutout">
            {/* 白=黄色表示, 黒=透明(切り抜き) */}
            <rect width="100%" height="100%" fill="white" />
            {carveStarted && (
              <g
                className="twenty-carve"
                style={{ transformBox: 'view-box', transformOrigin: 'center' } as React.CSSProperties}
              >
                {/* 「20」: スクリーン中央から -6vmax 上 */}
                <text
                  x="50%" y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="black"
                  style={{
                    fontSize: '36vmax',
                    fontFamily: 'var(--font-reggae-one), serif',
                    transform: 'translateY(-6vmax)',
                  }}
                >
                  20
                </text>
                {/* 「歳」: スクリーン中央から +14vmax 下 */}
                <text
                  x="50%" y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="black"
                  style={{
                    fontSize: '14vmax',
                    fontFamily: 'var(--font-yuji-syuku), serif',
                    transform: 'translateY(14vmax)',
                  }}
                >
                  歳
                </text>
              </g>
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="#facc15" mask="url(#twenty-cutout)" />
      </svg>}

      {/* Layer 2 (上面): 黒背景 + 画像 → フェードアウトして黄色を露出 */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black"
        style={{
          opacity: imageFaded ? 0 : imageVisible ? 1 : 0,
          transition: imageFaded
            ? 'opacity 800ms ease-in'
            : 'opacity 500ms ease-out',
        }}
      >
        <div className="relative w-64 sm:w-80 md:w-96">
          <Image
            src="/yoyu2024.png"
            alt="yoyu2024"
            width={400}
            height={400}
            unoptimized
            className="h-auto w-full object-contain"
            priority
          />
        </div>
        <p
          className="text-4xl tracking-widest text-amber-100 sm:text-5xl md:text-6xl"
          style={{ fontFamily: 'var(--font-yuji-syuku), serif' }}
        >
          まあ、余裕っすね
        </p>
      </div>
    </div>
  );
}
