'use client';

import { useState, FormEvent, useEffect, useCallback } from 'react';
import { Mail, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';

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
    <section className="px-4 py-12 md:px-8 lg:px-16">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-yellow-400">
        <Mail className="h-7 w-7" /> みんなからのメッセージ
      </h2>

      {isLoading && <p className="text-gray-400">読み込み中...</p>}
      {error && <p className="text-red-400">メッセージの取得に失敗しました</p>}

      {/* カルーセル */}
      {!isLoading && (
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* スライドトラック */}
          <div className="overflow-hidden rounded-xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {messages.map((msg) => (
                <div key={msg.id} className="min-w-full px-10">
                  <div className="min-h-[140px] rounded-lg border border-zinc-700 bg-zinc-900 p-6">
                    <p className="mb-3 text-sm leading-relaxed text-gray-200">{msg.text}</p>
                    <p className="text-xs text-yellow-400">— {msg.author}</p>
                  </div>
                </div>
              ))}

              {/* 追加カード（右端） */}
              <div className="min-w-full px-10">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex min-h-[140px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-yellow-400/50 bg-transparent text-yellow-400 transition-colors hover:border-yellow-400 hover:bg-yellow-400/5"
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
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700 bg-zinc-900/80 p-1.5 text-yellow-400 backdrop-blur transition-colors hover:border-yellow-400 hover:bg-zinc-800"
            aria-label="前のメッセージ"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* 次へ */}
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700 bg-zinc-900/80 p-1.5 text-yellow-400 backdrop-blur transition-colors hover:border-yellow-400 hover:bg-zinc-800"
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
                    ? 'w-6 bg-yellow-400'
                    : 'w-2 bg-zinc-600 hover:bg-zinc-400'
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
          className="mt-8 rounded-lg border border-zinc-700 bg-zinc-900 p-6"
        >
          <h3 className="mb-4 font-bold text-white">メッセージを投稿する</h3>

          <label className="mb-1 block text-sm text-gray-400" htmlFor="msg-author">
            お名前（任意）
          </label>
          <input
            id="msg-author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="お名前（省略可）"
            maxLength={50}
            className="mb-3 w-full rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none"
          />

          <label className="mb-1 block text-sm text-gray-400" htmlFor="msg-text">
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
            className="mb-3 w-full rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none"
          />

          {formError && <p className="mb-3 text-sm text-red-400">{formError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-yellow-400 px-6 py-2 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? '送信中...' : '送信'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
              className="rounded border border-zinc-600 px-6 py-2 text-gray-400 transition-colors hover:bg-zinc-800"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
