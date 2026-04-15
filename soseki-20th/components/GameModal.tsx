'use client';

import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

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
          <span className="flex items-center gap-2 font-bold text-yellow-400">
            <Keyboard className="h-4 w-4" /> {title}
          </span>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <iframe
          src={gameUrl}
          className="w-full h-[75vh] border-0"
          title={title}
        />
      </div>
    </div>
  );
}
