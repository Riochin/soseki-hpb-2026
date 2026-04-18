'use client';

import { useState } from 'react';
import Image from 'next/image';
import ModalFrame from '@/components/ModalFrame';

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10;

interface Props {
  onBorrow: (amount: number) => Promise<void>;
  onClose: () => void;
  debt?: number;
}

function lenderLine(debt: number): string {
  if (debt >= 10000) return '殺す。';
  if (debt >= 5000) return 'もう俺も金ないて❗️';
  if (debt >= 1000) return 'またぁ？';
  return 'しゃあねえな';
}

function lenderImage(debt: number): string {
  if (debt >= 10000) return '/lender4.jpg';
  if (debt >= 5000) return '/lender3.jpg';
  if (debt >= 1000) return '/lender2.jpg';
  return '/lender.jpg';
}

export default function BorrowModal({ onBorrow, onClose, debt = 0 }: Props) {
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
    <ModalFrame
      onBackdropClick={onClose}
      maxWidthClass="max-w-xs"
      panelClassName="!border-red-500/40 p-8 text-center"
    >
      <div className="mb-6 overflow-hidden rounded-control border border-red-500/20">
        <Image
          src={lenderImage(debt)}
          alt="金貸し"
          width={320}
          height={180}
          className="w-full object-cover object-top"
        />
      </div>

      <p
        className="mb-6 text-lg font-black tracking-wider text-red-300"
        style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
      >
        「{lenderLine(debt)}」
      </p>

      <div className="mb-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={decrement}
          disabled={amount <= MIN_AMOUNT || borrowing}
          className="h-10 w-10 rounded-control border border-red-500/60 text-xl font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>

        <div className="min-w-[6rem] text-center">
          <span className="font-mono text-2xl font-bold text-white">{amount}</span>
          <span className="ml-1 text-sm text-red-400/70">クレ</span>
        </div>

        <button
          type="button"
          onClick={increment}
          disabled={amount >= MAX_AMOUNT || borrowing}
          className="h-10 w-10 rounded-control border border-red-500/60 text-xl font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ＋
        </button>
      </div>

      {error && <p className="mb-4 text-xs text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleBorrow}
        disabled={borrowing}
        className="mb-3 w-full rounded-control border-2 border-red-500 py-3 font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
      >
        {borrowing ? '処理中...' : `${amount}クレ 借りる`}
      </button>

      <button
        type="button"
        onClick={onClose}
        disabled={borrowing}
        className="w-full rounded-control border border-stone-600 py-2 text-sm text-stone-500 transition-colors hover:border-stone-500 hover:text-stone-400 disabled:opacity-50"
      >
        キャンセル
      </button>
    </ModalFrame>
  );
}
