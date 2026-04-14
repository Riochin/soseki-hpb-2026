'use client';

import { useEffect } from 'react';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  gameUrl: string;
}

export default function GameModal({ isOpen, onClose, title, gameUrl }: GameModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <span className="font-bold text-yellow-400">⌨️ {title}</span>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-300 transition-colors text-xl leading-none"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <iframe
          src={gameUrl}
          className="w-full aspect-video border-0"
          title={title}
        />
      </div>
    </div>
  );
}
