'use client';

import { useState, FormEvent } from 'react';
import { useMessages } from '@/hooks/useMessages';

export default function MessageSection() {
  const { messages, isLoading, error, postMessage } = useMessages();
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      <h2 className="mb-6 text-2xl font-bold text-yellow-400">
        💌 みんなからのメッセージ
      </h2>

      {isLoading && (
        <p className="text-gray-400">読み込み中...</p>
      )}
      {error && (
        <p className="text-red-400">メッセージの取得に失敗しました</p>
      )}

      {/* 横スクロールカード一覧 */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="min-w-[220px] max-w-[260px] flex-shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 p-4"
          >
            <p className="mb-3 text-sm leading-relaxed text-gray-200">
              {msg.text}
            </p>
            <p className="text-xs text-yellow-400">— {msg.author}</p>
          </div>
        ))}

        {/* 投稿ボタン（末尾） */}
        <button
          onClick={() => setShowForm(true)}
          className="flex min-w-[180px] flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-yellow-400/50 bg-transparent p-4 text-yellow-400 transition-colors hover:border-yellow-400 hover:bg-yellow-400/5"
        >
          + メッセージを書く
        </button>
      </div>

      {/* 投稿フォーム */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900 p-6"
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

          {formError && (
            <p className="mb-3 text-sm text-red-400">{formError}</p>
          )}

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
              onClick={() => { setShowForm(false); setFormError(''); }}
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
