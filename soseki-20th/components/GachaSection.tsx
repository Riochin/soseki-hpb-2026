'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { usePlayer, CollectionItem } from '@/hooks/usePlayer';

const RARITY_COLOR: Record<string, string> = {
  UR: 'text-yellow-300 border-yellow-300',
  SSR: 'text-purple-400 border-purple-400',
  R: 'text-blue-400 border-blue-400',
  N: 'text-gray-400 border-gray-500',
};

interface Props {
  playerName: string;
}

function CollectionModal({ collection, onClose }: { collection: CollectionItem[]; onClose: () => void }) {
  const acquired = collection.filter((i) => i.acquired).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto border-2 border-yellow-400/20 bg-[#0c0a08] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-widest text-yellow-400/60">— COLLECTION</p>
            <p className="text-sm text-gray-400 mt-0.5">{acquired} / {collection.length} 入手済み</p>
          </div>
          <button
            onClick={onClose}
            className="border border-yellow-400/20 p-1.5 text-gray-400 transition-colors hover:border-yellow-400/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* グリッド */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {collection.map((item) =>
            item.acquired ? (
              <div key={item.itemId} className="border border-yellow-400/20 bg-[#141008] p-3 text-center">
                <div className="mb-1.5 text-3xl">{item.icon}</div>
                <p className="mb-1 text-xs font-medium text-white leading-tight">{item.name}</p>
                <span className={`border px-1.5 py-0.5 text-xs font-bold ${RARITY_COLOR[item.rarity] ?? 'text-gray-400 border-gray-500'}`}>
                  {item.rarity}
                </span>
              </div>
            ) : (
              <div key={item.itemId} className="border border-yellow-400/10 bg-[#141008] p-3 text-center opacity-40">
                <div className="mb-1.5 text-3xl text-gray-600">？</div>
                <p className="mb-1 text-xs font-medium text-gray-600">???</p>
                <span className={`border px-1.5 py-0.5 text-xs font-bold ${RARITY_COLOR[item.rarity] ?? 'text-gray-400 border-gray-500'}`}>
                  {item.rarity}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function GachaSection({ playerName }: Props) {
  const { player, spinGacha, borrowCoins } = usePlayer(playerName);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [borrowing, setBorrowing] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  async function handleGacha() {
    if (spinning) return;
    if (player && player.coins < 100) {
      setMessage('コインが不足しています。借金ボタンで補充できます。');
      return;
    }
    setSpinning(true);
    setMessage('');
    try {
      const res = await spinGacha();
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
    <>
      <section className="px-4 py-12 md:px-8 lg:px-16">
        <p className="mb-4 font-mono text-xs tracking-widest text-yellow-400/60">
          — GACHA &amp; COLLECTION
        </p>
        <h2 className="mb-8 text-xl font-black tracking-tight text-white md:text-3xl" style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}>
          ガチャ＆コレクション
        </h2>

        {/* ガチャ操作エリア */}
        <div className="mb-6 flex flex-wrap justify-center items-center gap-4 md:justify-start">
          <button
            onClick={handleGacha}
            disabled={spinning}
            className="bg-yellow-400 px-6 py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {spinning ? 'ガチャ中...' : '1回まわす (100C)'}
          </button>

          <button
            onClick={handleBorrow}
            disabled={borrowing}
            className="border-2 border-red-500 px-6 py-3 font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            {borrowing ? '処理中...' : '借金する (+100C)'}
          </button>

          <button
            onClick={() => setShowCollection(true)}
            className="border-2 border-yellow-400/20 px-6 py-3 font-bold text-yellow-400 transition-colors hover:border-yellow-400/60 hover:bg-yellow-400/5"
          >
            コレクションを見る
          </button>
        </div>

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
      </section>

      {showCollection && collection.length > 0 && (
        <CollectionModal collection={collection} onClose={() => setShowCollection(false)} />
      )}
    </>
  );
}
