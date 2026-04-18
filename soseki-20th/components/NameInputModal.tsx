'use client';

import { useState, useEffect, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { IS_UI_MOCK, MOCK_PLAYER } from '@/lib/mock';
import ModalFrame from '@/components/ModalFrame';

export interface Player {
  name: string;
  coins: number;
  debt: number;
  collection: CollectionItem[];
}

export interface CollectionItem {
  itemId: number;
  name: string;
  rarity: 'UR' | 'SSR' | 'R' | 'N';
  icon: string;
  acquired: boolean;
}

interface Props {
  onInit: (player: Player) => void;
}

export default function NameInputModal({ onInit }: Props) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!connecting) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [connecting]);

  useEffect(() => {
    if (IS_UI_MOCK) {
      onInit(MOCK_PLAYER);
      return;
    }

    const saved = localStorage.getItem('playerName');
    if (saved) {
      setConnecting(true);
      apiFetch<Player>('/api/players', {
        method: 'POST',
        body: JSON.stringify({ name: saved }),
      })
        .then((player) => onInit(player))
        .catch(() => {
          setShow(true);
        })
        .finally(() => setConnecting(false));
    } else {
      setShow(true);
    }
  }, [onInit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('名前を入力してください');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const player = await apiFetch<Player>('/api/players', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      });
      localStorage.setItem('playerName', trimmed);
      setShow(false);
      onInit(player);
    } catch (err) {
      setError(`エラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  }

  if (connecting) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black">
        <div className="mb-8 h-12 w-12 animate-spin rounded-full border-4 border-stone-700 border-t-accent" />
        <p className="font-noto-serif-jp text-lg text-accent">サーバー接続中{dots}</p>
        <p className="mt-2 text-sm text-stone-500">
          初回起動に少々お時間がかかる場合があります。ぶっちゃけ俺悪くなくね！？
        </p>
      </div>
    );
  }

  if (!show) return null;

  return (
    <ModalFrame
      maxWidthClass="max-w-sm"
      panelClassName="!border-edge-strong p-8 text-center"
      zClass="z-40"
    >
      <h2 className="mb-2 text-center text-xl font-bold text-accent">お名前を入力してください</h2>
      <p className="mb-6 text-center text-sm text-stone-400">
        名前はCreditやコレクションに紐付けられます
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="例: アクメ漱石ッズ"
          className="mb-3 w-full rounded-control border-b-2 border-stone-600 bg-transparent px-2 py-2 text-white placeholder-stone-500 focus:border-accent focus:outline-none"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-control bg-accent py-2 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? '処理中...' : '決定'}
        </button>
      </form>
    </ModalFrame>
  );
}
