'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { BgColor, BgStyle, CardFont, Message } from '@/hooks/useMessages';
import { getStampImagePath } from '@/lib/yosegakiStamp';

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
  const len = text.length;
  if (len <= 10)  return 'text-[11px] leading-snug';
  if (len <= 20)  return 'text-[9px] leading-snug';
  if (len <= 35)  return 'text-[7.5px] leading-snug';
  if (len <= 55)  return 'text-[6px] leading-relaxed';
  if (len <= 80)  return 'text-[5px] leading-relaxed';
  if (len <= 110) return 'text-[4px] leading-relaxed';
  return 'text-[3px] leading-relaxed';
}

function getExpandedTextSizeClass(text: string): string {
  const len = text.length;
  if (len <= 15)  return 'text-2xl leading-snug';
  if (len <= 30)  return 'text-xl leading-snug';
  if (len <= 50)  return 'text-lg leading-relaxed';
  if (len <= 80)  return 'text-base leading-relaxed';
  if (len <= 120) return 'text-sm leading-relaxed';
  return 'text-xs leading-relaxed';
}

function seededRotation(id: number): number {
  // Math.imul による 32bit 整数ハッシュ（連番IDで均一分布）
  let h = Math.imul(id ^ (id >>> 4), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h / 0xffffffff) * 20 - 10;
}

interface BoardCardProps {
  msg: Message;
}

function BoardCard({ msg }: BoardCardProps) {
  const rotation = seededRotation(msg.id);
  return (
    <div
      className="relative aspect-square w-full rounded-sm border border-stone-300/30 overflow-hidden"
      style={{
        backgroundImage: `url(${bgImagePath(msg.bgColor, msg.bgStyle)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: FONT_FAMILY[msg.font],
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      <div className={`absolute inset-0 p-0.5 flex items-center justify-center whitespace-pre-wrap break-words text-center ${getTextSizeClass(msg.text)} ${TEXT_COLOR[msg.bgColor]}`}>
        {msg.text}
      </div>
      <p className={`absolute bottom-0.5 left-0.5 text-[6px] ${AUTHOR_COLOR[msg.bgColor]}`}>— {msg.author}</p>
      {msg.stamp && (
        <div className="pointer-events-none absolute bottom-0.5 right-0.5 w-1/2" style={{ opacity: 0.4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getStampImagePath(msg.stamp)}
            alt="スタンプ"
            className="h-auto w-full object-contain"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}

interface Props {
  messages: Message[];
  onClose: () => void;
}

// whiteboard.png のアスペクト比 (1600×1080)
const WB_ASPECT = 1600 / 1080;

// whiteboard の額縁の内側余白（画像サイズに対する割合）
const WB_INSET = { top: '7%', bottom: '7%', left: '4.5%', right: '4.5%' };

export default function YosegakiBoard({ messages, onClose }: Props) {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (max-width: 767px)');
    setIsPortraitMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsPortraitMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 回転ラッパー（＝ whiteboard 本体）のスタイル
  const rotateWrapStyle: React.CSSProperties = isPortraitMobile
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '100vh',
        height: '100vw',
        transform: 'translate(-50%, -50%) rotate(90deg)',
      }
    : {
        position: 'fixed',
        inset: 0,
      };

  // whiteboard は回転ラッパーを全面占有
  const wbStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
      {/* 閉じるボタン（画面座標に固定、回転に影響されない） */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
        aria-label="閉じる"
      >
        <X className="h-5 w-5" />
      </button>

      {/* 回転ラッパー */}
      <div style={rotateWrapStyle}>
        {/* whiteboard 本体（アスペクト比維持） */}
        <div style={wbStyle}>
          {/* whiteboard 画像 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/yosegaki/whiteboard.png"
            alt="寄せ書きボード"
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'fill' }}
            draggable={false}
          />

          {/* 拡大ビュー */}
          {selectedMsg && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
              onClick={() => setSelectedMsg(null)}
            >
              <div
                className="relative rounded-sm border border-stone-300/30 overflow-hidden"
                style={{
                  width: '35%',
                  aspectRatio: '1 / 1',
                  backgroundImage: `url(${bgImagePath(selectedMsg.bgColor, selectedMsg.bgStyle)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  fontFamily: FONT_FAMILY[selectedMsg.font],
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`absolute inset-0 p-4 flex items-center justify-center whitespace-pre-wrap break-words text-center ${getExpandedTextSizeClass(selectedMsg.text)} ${TEXT_COLOR[selectedMsg.bgColor]}`}>
                  {selectedMsg.text}
                </div>
                <p className={`absolute bottom-3 left-4 text-xs ${AUTHOR_COLOR[selectedMsg.bgColor]}`}>— {selectedMsg.author}</p>
                {selectedMsg.stamp && (
                  <div className="pointer-events-none absolute bottom-2 right-2 w-1/2" style={{ opacity: 0.4 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getStampImagePath(selectedMsg.stamp)}
                      alt="スタンプ"
                      className="h-auto w-full object-contain"
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 額縁内側のカードエリア（縦横中央揃え） */}
          <div
            className="absolute flex items-center justify-center overflow-auto"
            style={WB_INSET}
          >
            {messages.length === 0 ? (
              <p className="text-stone-500 text-xs">まだメッセージがありません</p>
            ) : (
              <div
                className="grid gap-x-5 gap-y-3"
                style={{ gridTemplateColumns: 'repeat(5, 72px)' }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{ width: '72px' }}
                    className="cursor-pointer"
                    onClick={() => setSelectedMsg(msg)}
                  >
                    <BoardCard msg={msg} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
