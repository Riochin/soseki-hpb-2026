'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import type { BgColor, BgStyle, CardFont, Message } from '@/hooks/useMessages';
import YosegakiModal from '@/components/YosegakiModal';

const AUTO_PLAY_INTERVAL = 4000;

const FONT_FAMILY: Record<CardFont, string> = {
  'noto-sans': 'var(--font-noto-sans-jp), sans-serif',
  'tanuki':    'var(--font-tanuki), sans-serif',
  'fude-ji':   'var(--font-fude-ji), sans-serif',
  'fude':      'var(--font-yuji-syuku), serif',
};

const TEXT_COLOR: Record<BgColor, string> = {
  white:  'text-stone-800',
  beige:  'text-stone-700',
  purple: 'text-stone-800',
};

const AUTHOR_COLOR: Record<BgColor, string> = {
  white:  'text-stone-500',
  beige:  'text-amber-700',
  purple: 'text-purple-700',
};

const STAMP_LABEL: Record<string, string> = {
  dio: 'ディオ', joseph: 'ジョセフ', jotaro: '承太郎', kakyoin: '花京院', DIO: 'DIO',
  josuke: '仗助', rohan: '露伴', bucciarati: 'ブチャラティ', giorno: 'ジョルノ',
  diavolo: 'ディアボロ', jolyne: '徐倫', anasui: 'アナスイ',
};

function bgImagePath(color: BgColor, style: BgStyle): string {
  return `/yosegaki/${color}${style === 'normal' ? '' : `-${style}`}.png`;
}

function getTextSizeClass(len: number): string {
  if (len <= 15) return 'text-3xl leading-snug';
  if (len <= 30) return 'text-2xl leading-snug';
  if (len <= 50) return 'text-xl leading-relaxed';
  if (len <= 80) return 'text-base leading-relaxed';
  if (len <= 120) return 'text-sm leading-relaxed';
  return 'text-xs leading-relaxed';
}

function MessageCard({ msg }: { msg: Message }) {
  return (
    <div
      className="relative aspect-square w-full rounded-sm border border-stone-300/30 p-4 shadow-[2px_4px_12px_rgba(0,0,0,0.35)] overflow-hidden"
      style={{
        backgroundImage: `url(${bgImagePath(msg.bgColor, msg.bgStyle)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: FONT_FAMILY[msg.font],
      }}
    >
      <p className={`whitespace-pre-wrap ${getTextSizeClass(msg.text.length)} ${TEXT_COLOR[msg.bgColor]}`}>{msg.text}</p>
      <p className={`absolute bottom-3 left-4 text-[10px] ${AUTHOR_COLOR[msg.bgColor]}`}>— {msg.author}</p>
      {msg.stamp && (
        <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[8px] text-stone-700 shadow-sm backdrop-blur-sm leading-tight text-center">
          {STAMP_LABEL[msg.stamp] ?? msg.stamp}
        </div>
      )}
    </div>
  );
}

export default function MessageSection() {
  const { messages, isLoading, error, postMessage } = useMessages();
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const update = () => setVisibleCount(window.innerWidth >= 640 ? 3 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const totalItems = messages.length + 1;
  const maxIndex = Math.max(0, totalItems - visibleCount);

  const goTo = useCallback(
    (index: number) => setCurrentIndex(Math.max(0, Math.min(index, maxIndex))),
    [maxIndex],
  );

  useEffect(() => {
    if (paused || maxIndex === 0) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paused, maxIndex]);

  const slidePercent = 100 / visibleCount;

  return (
    <section className="section-reveal section-padding">
      <p className="mb-4 font-mono text-xs tracking-widest text-accent/60">— MESSAGES</p>
      <h2
        className="mb-8 text-xl font-black tracking-tight text-white md:text-3xl"
        style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
      >
        みんなからのメッセージ
      </h2>

      {isLoading && <p className="text-stone-400">読み込み中...</p>}
      {error && <p className="text-red-400">メッセージの取得に失敗しました</p>}

      {!isLoading && (
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            setPaused(true);
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            setPaused(false);
            if (Math.abs(delta) < 50) return;
            goTo(currentIndex + (delta < 0 ? 1 : -1));
          }}
        >
          <div className="overflow-hidden px-8">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * slidePercent}%)` }}
            >
              {messages.map((msg) => (
                <div key={msg.id} className="min-w-full sm:min-w-[33.333%] px-2">
                  <MessageCard msg={msg} />
                </div>
              ))}

              {/* 追加カード */}
              <div className="min-w-full sm:min-w-[33.333%] px-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed border-accent/50 bg-transparent text-accent transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-xs font-medium">追加する</span>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => goTo(currentIndex - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-control border-2 border-edge bg-surface/80 p-1.5 text-accent backdrop-blur transition-colors hover:border-accent hover:bg-video-back disabled:opacity-30"
            aria-label="前のメッセージ"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-control border-2 border-edge bg-surface/80 p-1.5 text-accent backdrop-blur transition-colors hover:border-accent hover:bg-video-back disabled:opacity-30"
            aria-label="次のメッセージ"
            disabled={currentIndex >= maxIndex}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {maxIndex > 0 && (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`スライド ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-6 bg-accent' : 'w-2 bg-stone-600 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <YosegakiModal
          onClose={() => setShowModal(false)}
          onSubmit={postMessage}
        />
      )}
    </section>
  );
}
