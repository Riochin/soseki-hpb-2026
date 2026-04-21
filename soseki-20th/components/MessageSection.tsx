'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Check, X, MoreHorizontal, LayoutGrid } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import type { BgColor, BgStyle, CardFont, Message } from '@/hooks/useMessages';
import YosegakiModal from '@/components/YosegakiModal';
import YosegakiBoard from '@/components/YosegakiBoard';
import { YOSEGAKI_BOARD_ENABLED } from '@/lib/mock';
import { getStampImagePath } from '@/lib/yosegakiStamp';

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

function bgImagePath(color: BgColor, style: BgStyle): string {
  return `/yosegaki/${color}${style === 'normal' ? '' : `-${style}`}.png`;
}

function getTextSizeClass(text: string): string {
  const lines = (text.match(/\n/g) ?? []).length + 1;
  const effective = Math.max(text.length, lines * 20);
  if (effective <= 15) return 'text-xl sm:text-lg leading-snug';
  if (effective <= 30) return 'text-lg sm:text-base leading-snug';
  if (effective <= 50) return 'text-base sm:text-sm leading-relaxed';
  if (effective <= 80) return 'text-sm sm:text-xs leading-relaxed';
  if (effective <= 120) return 'text-xs leading-relaxed';
  return 'text-[10px] leading-relaxed';
}

interface MessageCardProps {
  msg: Message;
  isOwn: boolean;
  onDelete: () => void;
  onUpdate: (input: { author?: string; text?: string }) => void;
}

function MessageCard({ msg, isOwn, onDelete, onUpdate }: MessageCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [authorInput, setAuthorInput] = useState(msg.author);
  const [textInput, setTextInput] = useState(msg.text);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  function handleEditOpen() {
    setAuthorInput(msg.author);
    setTextInput(msg.text);
    setMenuOpen(false);
    setEditing(true);
  }

  function handleEditSubmit() {
    const author = authorInput.trim() || msg.author;
    const text = textInput.trim() || msg.text;
    const changed: { author?: string; text?: string } = {};
    if (author !== msg.author) changed.author = author;
    if (text !== msg.text) changed.text = text;
    if (Object.keys(changed).length > 0) onUpdate(changed);
    setEditing(false);
  }

  function handleEditCancel() {
    setEditing(false);
  }

  return (
    <div
      className="relative aspect-square w-full rounded-sm border border-stone-300/30 shadow-[2px_4px_12px_rgba(0,0,0,0.35)] overflow-hidden"
      style={{
        backgroundImage: `url(${bgImagePath(msg.bgColor, msg.bgStyle)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: FONT_FAMILY[msg.font],
      }}
    >
      {/* 通常表示 */}
      {!editing && (
        <>
          <p className={`absolute inset-0 p-4 whitespace-pre-wrap break-words ${getTextSizeClass(msg.text)} ${TEXT_COLOR[msg.bgColor]}`}>{msg.text}</p>
          <p className={`absolute bottom-3 left-4 text-[10px] ${AUTHOR_COLOR[msg.bgColor]}`}>— {msg.author}</p>
          {msg.stamp && (
            <div className="pointer-events-none absolute bottom-2 right-2 w-1/2" style={{ opacity: 0.4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getStampImagePath(msg.stamp)}
                alt="スタンプ"
                className="h-auto w-full object-contain"
                draggable={false}
              />
            </div>
          )}
        </>
      )}

      {/* 編集オーバーレイ */}
      {editing && (
        <div className="absolute inset-0 flex flex-col gap-2 bg-black/60 p-3 backdrop-blur-sm">
          <textarea
            autoFocus
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            maxLength={140}
            rows={4}
            className="flex-1 resize-none rounded bg-white/90 px-2 py-1 text-xs text-stone-800 outline-none"
          />
          <input
            value={authorInput}
            onChange={(e) => setAuthorInput(e.target.value)}
            maxLength={50}
            placeholder="お名前"
            className="rounded bg-white/90 px-2 py-1 text-xs text-stone-800 outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleEditSubmit}
              className="flex flex-1 items-center justify-center gap-1 rounded bg-green-600/80 py-1 text-xs text-white hover:bg-green-600"
            >
              <Check className="h-3 w-3" />
              保存
            </button>
            <button
              onClick={handleEditCancel}
              className="flex flex-1 items-center justify-center gap-1 rounded bg-stone-600/80 py-1 text-xs text-white hover:bg-stone-600"
            >
              <X className="h-3 w-3" />
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 自分の投稿のみ三点メニュー */}
      {isOwn && !editing && (
        <div ref={menuRef} className="absolute top-2 right-2">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded bg-black/40 p-1 text-white backdrop-blur-sm hover:bg-black/60"
            aria-label="メニュー"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-10 min-w-[7rem] rounded border border-stone-600 bg-stone-900/95 py-1 shadow-lg backdrop-blur-sm">
              <button
                onClick={handleEditOpen}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-stone-200 hover:bg-stone-700"
              >
                <Pencil className="h-3 w-3 shrink-0" />
                編集
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 hover:bg-stone-700"
              >
                <Trash2 className="h-3 w-3 shrink-0" />
                削除
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  playerName: string | null;
}

export default function MessageSection({ playerName }: Props) {
  const { messages, isLoading, error, postMessage, deleteMessage, updateMessage } = useMessages(playerName);
  const [showModal, setShowModal] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
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
    (index: number) => {
      if (maxIndex === 0) return;
      setCurrentIndex(((index % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1));
    },
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
                  <MessageCard
                    msg={msg}
                    isOwn={!!(playerName && msg.username === playerName)}
                    onDelete={() => deleteMessage(msg.id)}
                    onUpdate={(input) => updateMessage(msg.id, input)}
                  />
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
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-control border-2 border-edge bg-surface/80 p-1.5 text-accent backdrop-blur transition-colors hover:border-accent hover:bg-video-back"
            aria-label="前のメッセージ"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-control border-2 border-edge bg-surface/80 p-1.5 text-accent backdrop-blur transition-colors hover:border-accent hover:bg-video-back"
            aria-label="次のメッセージ"
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

      {YOSEGAKI_BOARD_ENABLED && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowBoard(true)}
            className="flex items-center gap-2 rounded-control border border-accent/50 px-4 py-2 text-xs text-accent hover:border-accent hover:bg-accent/10 transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            ボードで見る
          </button>
        </div>
      )}

      {showModal && (
        <YosegakiModal
          onClose={() => setShowModal(false)}
          onSubmit={postMessage}
          username={playerName ?? undefined}
        />
      )}

      {showBoard && (
        <YosegakiBoard messages={messages} onClose={() => setShowBoard(false)} />
      )}
    </section>
  );
}
