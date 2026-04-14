'use client';

import { useState } from 'react';
import { usePlayer, GachaResult, CollectionItem } from '@/hooks/usePlayer';

const RARITY_COLOR: Record<string, string> = {
  UR: 'text-yellow-300 border-yellow-300',
  SSR: 'text-purple-400 border-purple-400',
  R: 'text-blue-400 border-blue-400',
  N: 'text-gray-400 border-gray-500',
};

interface Props {
  playerName: string;
}

export default function GachaSection({ playerName }: Props) {
  const { player, spinGacha, borrowCoins } = usePlayer(playerName);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<GachaResult | null>(null);
  const [message, setMessage] = useState('');
  const [borrowing, setBorrowing] = useState(false);

  async function handleGacha() {
    if (spinning) return;
    if (player && player.coins < 100) {
      setMessage('コインが不足しています。借金ボタンで補充できます。');
      return;
    }
    setSpinning(true);
    setMessage('');
    setResult(null);
    try {
      const res = await spinGacha();
      setResult(res);
      setMessage(res.isNew ? `NEW！ ${res.item.name} を獲得！` : `${res.item.name}（入手済み）`);
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : '失敗しました'}`);
    } finally {
      setSpinning(false);
    }
  }

  async function handleBorrow() {
    setBorrowing(true);
    setMessage('');
    try {
      await borrowCoins();
      setMessage('100C 借りました（借金 +100C）');
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : '失敗しました'}`);
    } finally {
      setBorrowing(false);
    }
  }

  const collection: CollectionItem[] = player?.collection ?? [];

  return (
    <section className="px-4 py-12 md:px-8 lg:px-16">
      <h2 className="mb-6 text-2xl font-bold text-yellow-400">🎰 ガチャ＆コレクション</h2>

      {/* ガチャ操作エリア */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <button
          onClick={handleGacha}
          disabled={spinning}
          className="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {spinning ? 'ガチャ中...' : '1回まわす (100C)'}
        </button>

        <button
          onClick={handleBorrow}
          disabled={borrowing}
          className="rounded-lg border border-red-500 px-6 py-3 font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          {borrowing ? '処理中...' : '借金する (+100C)'}
        </button>

        {message && (
          <p
            className={`text-sm font-medium ${
              message.includes('エラー') || message.includes('不足')
                ? 'text-red-400'
                : 'text-green-400'
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* コレクション 2列グリッド */}
      {collection.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {collection.map((item) => (
            <div
              key={item.itemId}
              className={`rounded-lg border bg-zinc-900 p-4 text-center transition-all${
                item.acquired ? '' : ' grayscale opacity-50'
              }`}
            >
              <div className="mb-2 text-3xl">{item.icon}</div>
              <p className="mb-1 text-sm font-medium text-white">{item.name}</p>
              <span
                className={`rounded border px-2 py-0.5 text-xs font-bold ${
                  RARITY_COLOR[item.rarity] ?? 'text-gray-400 border-gray-500'
                }`}
              >
                {item.rarity}
              </span>
              {!item.acquired && (
                <p className="mt-2 text-xs text-gray-500">🔒 未入手</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">コレクションはまだありません</p>
      )}
    </section>
  );
}
