'use client';

import { useEffect, useRef, useState } from 'react';
import { Keyboard, X, Monitor } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { toCredit } from '@/lib/currency';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  gameUrl: string;
  playerName?: string | null;
  mobileSupported?: boolean;
}

export default function GameModal({
  isOpen,
  onClose,
  title,
  gameUrl,
  playerName,
  mobileSupported = false,
}: GameModalProps) {
  const { earnCoins } = usePlayer(playerName ?? null);
  const [toast, setToast] = useState<{ coinsEarned: number } | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    sessionIdRef.current = crypto.randomUUID();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- モーダルを開くたびにトーストをリセット
    setToast(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !playerName) return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type !== 'MINI_GAME_RESULT') return;
      if (!sessionIdRef.current) return;

      const { gameType, ...payload } = event.data.payload ?? {};
      if (typeof gameType !== 'string') return;

      try {
        const result = await earnCoins(gameType, payload, sessionIdRef.current);
        sessionIdRef.current = null;
        setToast({ coinsEarned: result.coinsEarned });
        window.setTimeout(() => setToast(null), 4000);
      } catch (err) {
        console.warn('earnCoins failed:', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, playerName, earnCoins]);

  if (!isOpen) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85dvh] max-h-[min(900px,92dvh)] w-full max-w-4xl flex-col overflow-hidden rounded-panel border-2 border-edge bg-panel sm:h-[88dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-edge px-4 py-3">
          <span className="flex items-center gap-2 font-bold text-accent">
            <Keyboard className="h-4 w-4" /> {title}
          </span>
          <button
            onClick={onClose}
            className="text-accent transition-colors hover:text-yellow-300"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isMobile && !mobileSupported ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <Monitor className="h-12 w-12 text-accent/60" />
            <p className="text-lg font-bold text-accent">PC専用ゲームです</p>
            <p className="text-sm text-stone-400">
              このゲームはキーボード操作が必要なため、
              <br />
              PCからお楽しみください。
            </p>
          </div>
        ) : (
          <iframe
            src={gameUrl}
            className="min-h-0 w-full flex-1 border-0"
            title={title}
          />
        )}

        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-control bg-accent px-5 py-2 text-sm font-bold text-black shadow-lg">
            +{toCredit(toast.coinsEarned)} Credit獲得！
          </div>
        )}
      </div>
    </div>
  );
}
