'use client';

import { useState } from 'react';

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10;

interface Props {
  onBorrow: (amount: number) => Promise<void>;
  onClose: () => void;
}

export default function BorrowModal({ onBorrow, onClose }: Props) {
  const [amount, setAmount] = useState(1);
  const [borrowing, setBorrowing] = useState(false);
  const [error, setError] = useState('');

  function decrement() {
    setAmount((prev) => Math.max(MIN_AMOUNT, prev - 1));
  }

  function increment() {
    setAmount((prev) => Math.min(MAX_AMOUNT, prev + 1));
  }

  async function handleBorrow() {
    setBorrowing(true);
    setError('');
    try {
      await onBorrow(amount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '失敗しました');
    } finally {
      setBorrowing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs border-2 border-red-500/40 bg-[#050403] p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* キャラクター画像エリア（プレースホルダー） */}
        <div className="mb-6 flex h-32 items-center justify-center border border-red-500/20 bg-[#0a0604]">
          <span className="text-xs text-red-500/40 tracking-widest">IMAGE COMING SOON</span>
        </div>

        {/* セリフ */}
        <p
          className="mb-6 text-lg font-black text-red-300 tracking-wider"
          style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}
        >
          「しゃあねえな」
        </p>

        {/* ステッパー */}
        <div className="mb-6 flex items-center justify-center gap-6">
          <button
            onClick={decrement}
            disabled={amount <= MIN_AMOUNT || borrowing}
            className="h-10 w-10 border border-red-500/60 text-red-400 text-xl font-bold transition-colors hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>

          <div className="min-w-[6rem] text-center">
            <span className="font-mono text-2xl font-bold text-white">{amount}</span>
            <span className="ml-1 text-sm text-red-400/70">クレ</span>
          </div>

          <button
            onClick={increment}
            disabled={amount >= MAX_AMOUNT || borrowing}
            className="h-10 w-10 border border-red-500/60 text-red-400 text-xl font-bold transition-colors hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ＋
          </button>
        </div>

        {error && (
          <p className="mb-4 text-xs text-red-400">{error}</p>
        )}

        {/* 借りるボタン */}
        <button
          onClick={handleBorrow}
          disabled={borrowing}
          className="mb-3 w-full border-2 border-red-500 py-3 font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          {borrowing ? '処理中...' : `${amount}クレ 借りる`}
        </button>

        {/* キャンセル */}
        <button
          onClick={onClose}
          disabled={borrowing}
          className="w-full border border-gray-700 py-2 text-sm text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-400 disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
