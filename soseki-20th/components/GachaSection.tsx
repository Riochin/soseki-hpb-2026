'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { usePlayer, CollectionItem, GachaResult, MultiGachaResult } from '@/hooks/usePlayer';
import { toCredit } from '@/lib/currency';
import BorrowModal from '@/components/BorrowModal';
import { IS_UI_MOCK } from '@/lib/mock';

const RARITY_COLOR: Record<string, string> = {
  UR: 'text-yellow-300 border-yellow-300',
  SSR: 'text-purple-400 border-purple-400',
  R: 'text-blue-400 border-blue-400',
  N: 'text-gray-400 border-gray-500',
};

interface Props {
  playerName: string;
}

const RARITY_LABEL: Record<string, string> = {
  UR: 'ULTRA RARE',
  SSR: 'SUPER RARE',
  R: 'RARE',
  N: 'NORMAL',
};

function GachaResultModal({ result, onClose }: { result: GachaResult; onClose: () => void }) {
  const { item, isNew, newCoins } = result;
  const colorClass = RARITY_COLOR[item.rarity] ?? 'text-gray-400 border-gray-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs border-2 border-yellow-400/20 bg-[#050403] p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* NEW バッジ */}
        {isNew && (
          <p className="mb-4 font-mono text-xs tracking-widest text-yellow-400 animate-pulse">
            ✦ NEW ITEM ✦
          </p>
        )}

        {/* アイコン */}
        <div className="mb-4 text-7xl">{item.icon}</div>

        {/* レアリティ */}
        <span className={`border px-3 py-1 text-xs font-bold tracking-widest ${colorClass}`}>
          {item.rarity} — {RARITY_LABEL[item.rarity]}
        </span>

        {/* アイテム名 */}
        <p className="mt-4 text-lg font-bold text-white">{item.name}</p>

        {/* 残Credit */}
        <p className="mt-2 font-mono text-xs text-gray-500">残Credit: {toCredit(newCoins)}</p>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="mt-6 w-full border-2 border-yellow-400/20 py-2 font-bold text-yellow-400 transition-colors hover:border-yellow-400/60 hover:bg-yellow-400/5"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

function MultiGachaResultModal({
  result,
  onClose,
}: {
  result: MultiGachaResult;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-yellow-400/20 bg-[#050403] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <p className="mb-4 font-mono text-xs tracking-widest text-yellow-400/60 text-center">
          — 10連ガチャ結果
        </p>

        {/* 結果グリッド: モバイル2列、sm以上5列 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {result.results.map((r, idx) => {
            const colorClass = RARITY_COLOR[r.item.rarity] ?? 'text-gray-400 border-gray-500';
            return (
              <div
                key={idx}
                className="relative border border-yellow-400/20 bg-[#0a0806] p-3 text-center"
              >
                {r.isNew && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 leading-none">
                    NEW
                  </span>
                )}
                <div className="mb-1.5 text-3xl">{r.item.icon}</div>
                <p className="mb-1 text-xs font-medium text-white leading-tight truncate" title={r.item.name}>
                  {r.item.name}
                </p>
                <span className={`border px-1.5 py-0.5 text-xs font-bold ${colorClass}`}>
                  {r.item.rarity}
                </span>
              </div>
            );
          })}
        </div>

        {/* 残Credit */}
        <p className="text-center font-mono text-xs text-gray-500 mb-4">
          残Credit: {toCredit(result.newCoins)}
        </p>

        <button
          onClick={onClose}
          className="w-full border-2 border-yellow-400/20 py-2 font-bold text-yellow-400 transition-colors hover:border-yellow-400/60 hover:bg-yellow-400/5"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

function CollectionModal({ collection, onClose }: { collection: CollectionItem[]; onClose: () => void }) {
  const acquired = collection.filter((i) => i.acquired).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto border-2 border-yellow-400/20 bg-[#050403] p-6"
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
              <div key={item.itemId} className="border border-yellow-400/20 bg-[#0a0806] p-3 text-center">
                <div className="mb-1.5 text-3xl">{item.icon}</div>
                <p className="mb-1 text-xs font-medium text-white leading-tight">{item.name}</p>
                <span className={`border px-1.5 py-0.5 text-xs font-bold ${RARITY_COLOR[item.rarity] ?? 'text-gray-400 border-gray-500'}`}>
                  {item.rarity}
                </span>
              </div>
            ) : (
              <div key={item.itemId} className="border border-yellow-400/10 bg-[#0a0806] p-3 text-center opacity-40">
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
  const { player, spinGacha, spinGachaMulti, borrowCoins } = usePlayer(playerName);
  const [spinning, setSpinning] = useState(false);
  const [gachaResult, setGachaResult] = useState<GachaResult | null>(null);
  const [multiGachaResult, setMultiGachaResult] = useState<MultiGachaResult | null>(null);
  const [message, setMessage] = useState('');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  async function handleGacha() {
    if (spinning) return;
    if (player && player.coins < 100) {
      setShowBorrowModal(true);
      return;
    }
    setSpinning(true);
    setMessage('');
    try {
      const res = await spinGacha();
      setGachaResult(res);
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : '失敗しました'}`);
    } finally {
      setSpinning(false);
    }
  }

  async function handleMultiGacha() {
    if (spinning) return;
    if (player && player.coins < 1000) {
      setMessage('コインが不足しています（10連には10クレ必要）');
      return;
    }
    setSpinning(true);
    setMessage('');
    try {
      const res = await spinGachaMulti();
      setMultiGachaResult(res);
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : '失敗しました'}`);
    } finally {
      setSpinning(false);
    }
  }

  async function handleBorrow(amount: number) {
    await borrowCoins(amount);
    setMessage(`${amount}クレ 借りました（借金 +${amount}クレ）`);
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

        {/* ガチャボタン: 2カラムグリッド */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            onClick={handleGacha}
            disabled={spinning}
            className="bg-yellow-400 py-4 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {spinning ? 'ガチャ中...' : '1回まわす'}
            <span className="block text-xs font-normal opacity-70">1クレ</span>
          </button>

          <button
            onClick={handleMultiGacha}
            disabled={spinning || (player !== null && player.coins < 1000)}
            className="border-2 border-yellow-400 py-4 font-bold text-yellow-400 transition-colors hover:bg-yellow-400 hover:text-black disabled:opacity-50"
          >
            {spinning ? 'ガチャ中...' : '10回まわす'}
            <span className="block text-xs font-normal opacity-70">10クレ</span>
          </button>
        </div>

        {/* 借金ボタン: 本番はコイン不足時のみ、モック時は常時表示 */}
        {!showBorrowModal && (IS_UI_MOCK || (player && player.coins < 100)) && (
          <div className="mb-3">
            <button
              onClick={() => setShowBorrowModal(true)}
              className="w-full border-2 border-red-500 py-3 font-bold text-red-400 transition-colors hover:bg-red-500/10"
            >
              借金する
            </button>
          </div>
        )}

        {/* コレクション（別種アクション） */}
        <div className="mb-6">
          <button
            onClick={() => setShowCollection(true)}
            className="flex w-full items-center justify-between border border-yellow-400/20 px-4 py-3 text-sm text-yellow-400/70 transition-colors hover:border-yellow-400/40 hover:text-yellow-400"
          >
            <span>コレクションを見る</span>
            <span className="text-yellow-400/40">›</span>
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

      {gachaResult && (
        <GachaResultModal result={gachaResult} onClose={() => setGachaResult(null)} />
      )}

      {multiGachaResult && (
        <MultiGachaResultModal result={multiGachaResult} onClose={() => setMultiGachaResult(null)} />
      )}

      {showCollection && collection.length > 0 && (
        <CollectionModal collection={collection} onClose={() => setShowCollection(false)} />
      )}

      {showBorrowModal && (
        <BorrowModal
          onBorrow={handleBorrow}
          onClose={() => setShowBorrowModal(false)}
        />
      )}
    </>
  );
}
