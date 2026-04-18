'use client';

import { CSSProperties, useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';

// SVGノイズで紙のグレイン感を再現（外部画像不要）
const paperStyle: CSSProperties = {
  backgroundImage: [
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
    'linear-gradient(160deg, #fef9f0 0%, #fdf3e3 60%, #fcefd8 100%)',
  ].join(', '),
  backgroundColor: '#fef9f0',
};

const AUTO_PLAY_INTERVAL = 4000;

export default function MessageSection() {
  const { messages, isLoading, error, postMessage } = useMessages();
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // messages + 追加カード 1枚
  const totalSlides = messages.length + 1;

  const goTo = useCallback(
    (index: number) => setCurrentIndex((index + totalSlides) % totalSlides),
    [totalSlides],
  );

  // 自動再生
  useEffect(() => {
    if (paused || totalSlides <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % totalSlides);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paused, totalSlides]);

  // メッセージ追加後は追加カードのインデックスをリセット
  useEffect(() => {
    setCurrentIndex(0);
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setFormError('本文を入力してください');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await postMessage({ author: author.trim() || '匿名', text: text.trim() });
      setAuthor('');
      setText('');
      setShowForm(false);
    } catch (err) {
      setFormError(`エラー: ${err instanceof Error ? err.message : '送信に失敗しました'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section-reveal section-padding">
      <p className="mb-4 font-mono text-xs tracking-widest text-accent/60">
        — MESSAGES
      </p>
      <h2 className="mb-8 text-xl font-black tracking-tight text-white md:text-3xl" style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}>
        みんなからのメッセージ
      </h2>

      {isLoading && <p className="text-stone-400">読み込み中...</p>}
      {error && <p className="text-red-400">メッセージの取得に失敗しました</p>}

      {/* カルーセル */}
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
          {/* スライドトラック */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {messages.map((msg) => (
                <div key={msg.id} className="min-w-full px-10">
                  <div
                    className="min-h-[140px] border border-amber-200/60 p-6 shadow-[2px_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.6)]"
                    style={paperStyle}
                  >
                    <p className="mb-3 text-sm leading-relaxed text-stone-700">{msg.text}</p>
                    <p className="text-xs text-amber-700">— {msg.author}</p>
                  </div>
                </div>
              ))}

              {/* 追加カード（右端） */}
              <div className="min-w-full px-10">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex min-h-[140px] w-full flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed border-accent/50 bg-transparent text-accent transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-sm font-medium">追加する</span>
                </button>
              </div>
            </div>
          </div>

          {/* 前へ */}
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-control border-2 border-edge bg-surface/80 p-1.5 text-accent backdrop-blur transition-colors hover:border-accent hover:bg-video-back"
            aria-label="前のメッセージ"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* 次へ */}
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-control border-2 border-edge bg-surface/80 p-1.5 text-accent backdrop-blur transition-colors hover:border-accent hover:bg-video-back"
            aria-label="次のメッセージ"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* ドットインジケーター */}
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`スライド ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 bg-accent'
                    : 'w-2 bg-stone-600 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 投稿フォーム */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 rounded-panel border-2 border-edge bg-surface p-6"
        >
          <h3 className="mb-4 font-bold text-white">メッセージを投稿する</h3>

          <label className="mb-1 block text-sm text-stone-400" htmlFor="msg-author">
            お名前（任意）
          </label>
          <input
            id="msg-author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="お名前（省略可）"
            maxLength={50}
            className="mb-3 w-full rounded-control border-b-2 border-edge bg-transparent px-2 py-2 text-white placeholder-stone-500 focus:border-accent focus:outline-none"
          />

          <label className="mb-1 block text-sm text-stone-400" htmlFor="msg-text">
            本文
          </label>
          <textarea
            id="msg-text"
            aria-label="本文"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="漱石へのメッセージを書いてください"
            maxLength={500}
            rows={4}
            className="mb-3 w-full rounded-control border-b-2 border-edge bg-transparent px-2 py-2 text-white placeholder-stone-500 focus:border-accent focus:outline-none"
          />

          {formError && <p className="mb-3 text-sm text-red-400">{formError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-control bg-accent px-6 py-2 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? '送信中...' : '送信'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
              className="rounded-control border-2 border-stone-600 px-6 py-2 text-stone-400 transition-colors hover:bg-video-back"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
