'use client';

import { useState, useEffect, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

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

  useEffect(() => {
    const saved = localStorage.getItem('playerName');
    if (saved) {
      // 既存プレイヤーを取得して onInit を呼ぶ
      apiFetch<Player>('/api/players', {
        method: 'POST',
        body: JSON.stringify({ name: saved }),
      })
        .then((player) => onInit(player))
        .catch(() => {
          // 取得失敗時はモーダルを表示
          setShow(true);
        });
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-sm rounded-lg border border-yellow-400/30 bg-zinc-900 p-8">
        <h2 className="mb-2 text-center text-xl font-bold text-yellow-400">
          お名前を入力してください
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          名前はコインやコレクションに紐付けられます
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="例: 漱石ファン"
            className="mb-3 w-full rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none"
          />
          {error && (
            <p className="mb-3 text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-yellow-400 py-2 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '処理中...' : '決定'}
          </button>
        </form>
      </div>
    </div>
  );
}
