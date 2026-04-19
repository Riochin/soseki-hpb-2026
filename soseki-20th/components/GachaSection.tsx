'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { usePlayer, CollectionItem, GachaResult, MultiGachaResult } from '@/hooks/usePlayer';
import { toCredit } from '@/lib/currency';
import BorrowModal from '@/components/BorrowModal';
import ModalFrame from '@/components/ModalFrame';
import { IS_UI_MOCK } from '@/lib/mock';

const RARITY_TEXT: Record<string, string> = {
  UR: 'bg-gradient-to-r from-rose-400 via-yellow-300 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent',
  SSR: 'text-accent',
  R: 'text-slate-300',
  N: 'text-amber-600',
};

const RARITY_BORDER: Record<string, string> = {
  UR: 'border-white/50',
  SSR: 'border-accent',
  R: 'border-slate-300',
  N: 'border-amber-600',
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

function rarityClass(rarity: string): string {
  const text = RARITY_TEXT[rarity] ?? 'text-stone-400';
  const border = RARITY_BORDER[rarity] ?? 'border-stone-500';
  return `${text} ${border}`;
}

function GachaResultModal({ result, onClose }: { result: GachaResult; onClose: () => void }) {
  const { item, isNew, newCoins } = result;
  const colorClass = rarityClass(item.rarity);

  return (
    <ModalFrame onBackdropClick={onClose} maxWidthClass="max-w-xs" panelClassName="p-8 text-center">
      {isNew && (
        <p className="mb-4 animate-pulse font-mono text-xs tracking-widest text-accent">
          ✦ NEW ITEM ✦
        </p>
      )}

      <div className="mb-4 text-7xl">{item.icon}</div>

      <span className={`rounded-control border px-3 py-1 text-xs font-bold tracking-widest ${colorClass}`}>
        {item.rarity} — {RARITY_LABEL[item.rarity]}
      </span>

      <p className="mt-4 text-lg font-bold text-white">{item.name}</p>

      <p className="mt-2 font-mono text-xs text-stone-500">残Credit: {toCredit(newCoins)}</p>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full rounded-control border-2 border-edge py-2 font-bold text-accent transition-colors hover:border-edge-strong hover:bg-accent/5"
      >
        閉じる
      </button>
    </ModalFrame>
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
    <ModalFrame
      onBackdropClick={onClose}
      maxWidthClass="max-w-2xl"
      panelClassName="max-h-[90vh] overflow-y-auto p-6 text-center"
    >
      <p className="mb-4 text-center font-mono text-xs tracking-widest text-accent/60">— 10連ガチャ結果</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {result.results.map((r, idx) => {
          const colorClass = rarityClass(r.item.rarity);
          return (
            <div key={idx} className="relative rounded-control border border-edge bg-panel-raised p-3 text-center">
              {r.isNew && (
                <span className="absolute -right-2 -top-2 bg-accent px-1.5 py-0.5 text-[10px] font-bold leading-none text-black">
                  NEW
                </span>
              )}
              <div className="mb-1.5 text-3xl">{r.item.icon}</div>
              <p
                className="mb-1 truncate text-xs font-medium leading-tight text-white"
                title={r.item.name}
              >
                {r.item.name}
              </p>
              <span className={`rounded-control border px-1.5 py-0.5 text-xs font-bold ${colorClass}`}>
                {r.item.rarity}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mb-4 text-center font-mono text-xs text-stone-500">残Credit: {toCredit(result.newCoins)}</p>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-control border-2 border-edge py-2 font-bold text-accent transition-colors hover:border-edge-strong hover:bg-accent/5"
      >
        閉じる
      </button>
    </ModalFrame>
  );
}

function ItemDetailModal({
  item,
  onConsume,
  onClose,
}: {
  item: CollectionItem;
  onConsume: (itemId: number) => Promise<void>;
  onClose: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [consuming, setConsuming] = useState(false);
  const [consumed, setConsumed] = useState(item.is_consumed);
  const [error, setError] = useState('');
  const colorClass = rarityClass(item.rarity);

  async function handleConsume() {
    setConsuming(true);
    setError('');
    try {
      await onConsume(item.itemId);
      setConsumed(true);
      setShowConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗しました');
    } finally {
      setConsuming(false);
    }
  }

  return (
    <ModalFrame
      onBackdropClick={onClose}
      overlayVariant="heavy"
      zClass="z-[60]"
      maxWidthClass="max-w-xs"
      panelClassName="overflow-hidden p-8 text-center"
    >
      <div className="mb-3 text-6xl">{item.icon}</div>

      <span className={`rounded-control border px-3 py-1 text-xs font-bold tracking-widest ${colorClass}`}>
        {item.rarity} — {RARITY_LABEL[item.rarity]}
      </span>

      <p className="mt-4 text-lg font-bold text-white">{item.name}</p>

      {item.proposed_by && (
        <p className="mt-2 text-sm text-stone-400">
          アイテム提案者:{' '}
          <span className="font-bold text-yellow-300">{item.proposed_by}</span>
        </p>
      )}

      {item.is_giftable && !consumed && (
        <>
          <p className="mt-3 rounded-control border border-green-400/30 bg-green-400/5 px-3 py-2 text-xs text-green-400">
            提案者の前で見せればもらえます
          </p>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="mt-3 w-full rounded-control border-2 border-green-400 py-2 text-sm font-bold text-green-400 transition-colors hover:bg-green-400/10"
          >
            交換する
          </button>
        </>
      )}

      {consumed && (
        <div className="mt-3 w-full rounded-control border-2 border-stone-600 py-2 text-sm font-bold text-stone-500">
          交換済み
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-control border border-edge py-2 text-sm text-stone-400 transition-colors hover:border-edge-strong hover:text-white"
      >
        閉じる
      </button>

      {showConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-overlay-inner p-6"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <div className="text-center">
            <p className="mb-3 font-mono text-xs tracking-widest text-accent">⚠ 確認</p>
            <p className="mb-1 text-base font-bold text-white">{item.name}</p>
            <p className="mb-1 text-sm text-stone-300">を交換しますか？</p>
            <p className="mb-5 text-xs text-red-400">※ 一度交換すると取り消せません</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={consuming}
                className="flex-1 rounded-control border border-stone-600 py-2 text-sm text-stone-400 transition-colors hover:text-white disabled:opacity-50"
              >
                やめる
              </button>
              <button
                type="button"
                onClick={handleConsume}
                disabled={consuming}
                className="flex-1 rounded-control border-2 border-green-400 py-2 text-sm font-bold text-green-400 transition-colors hover:bg-green-400/10 disabled:opacity-50"
              >
                {consuming ? '処理中...' : '交換する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalFrame>
  );
}

function CollectionModal({
  collection,
  onConsume,
  onClose,
}: {
  collection: CollectionItem[];
  onConsume: (itemId: number) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [filterBy, setFilterBy] = useState<string | null>(null);
  const acquired = collection.filter((i) => i.acquired).length;

  const RARITY_ORDER: Record<string, number> = { UR: 0, SSR: 1, R: 2, N: 3 };
  const sorted = [...collection].sort(
    (a, b) => (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9),
  );

  const proposers = Array.from(
    new Set(sorted.filter((i) => i.proposed_by).map((i) => i.proposed_by as string)),
  );

  const filtered = filterBy ? sorted.filter((i) => i.proposed_by === filterBy) : sorted;

  return (
    <>
      <ModalFrame
        onBackdropClick={onClose}
        maxWidthClass="max-w-lg"
        panelClassName="max-h-[80vh] overflow-y-auto p-6 text-left"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-widest text-accent/60">— COLLECTION</p>
            <p className="mt-0.5 text-sm text-stone-400">
              {acquired} / {collection.length} 入手済み
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-edge p-1.5 text-stone-400 transition-colors hover:border-edge-strong hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {proposers.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterBy(null)}
              className={`rounded-control px-2.5 py-1 font-mono text-xs transition-colors ${
                filterBy === null
                  ? 'border border-edge-muted bg-accent/10 text-accent'
                  : 'border border-edge text-stone-400 hover:border-edge-strong hover:text-stone-200'
              }`}
            >
              すべて
            </button>
            {proposers.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setFilterBy(filterBy === name ? null : name)}
                className={`rounded-control px-2.5 py-1 font-mono text-xs transition-colors ${
                  filterBy === name
                    ? 'border border-edge-muted bg-accent/10 text-accent'
                    : 'border border-edge text-stone-400 hover:border-edge-strong hover:text-stone-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((item) =>
            item.acquired ? (
              <button
                key={item.itemId}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="relative rounded-control border border-edge bg-panel-raised p-3 text-center transition-colors hover:border-edge-strong hover:bg-panel-hover active:scale-95"
              >
                {item.is_giftable && !item.is_consumed && (
                  <span className="absolute -right-1.5 -top-1.5 bg-green-400 px-1.5 py-0.5 text-[9px] font-bold leading-none text-black">
                    GIFT
                  </span>
                )}
                {item.is_consumed && (
                  <span className="absolute -right-1.5 -top-1.5 bg-stone-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-stone-300">
                    済
                  </span>
                )}
                <div className="mb-1.5 text-3xl">{item.icon}</div>
                <p className="mb-1 text-xs font-medium leading-tight text-white">{item.name}</p>
                <span className={`rounded-control border px-1.5 py-0.5 text-xs font-bold ${rarityClass(item.rarity)}`}>
                  {item.rarity}
                </span>
              </button>
            ) : (
              <div
                key={item.itemId}
                className="rounded-control border border-edge-faint bg-panel-raised p-3 text-center opacity-40"
              >
                <div className="mb-1.5 text-3xl text-stone-600">？</div>
                <p className="mb-1 text-xs font-medium text-stone-600">???</p>
                <span className={`rounded-control border px-1.5 py-0.5 text-xs font-bold ${rarityClass(item.rarity)}`}>
                  {item.rarity}
                </span>
              </div>
            )
          )}
        </div>
      </ModalFrame>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onConsume={onConsume}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}

export default function GachaSection({ playerName }: Props) {
  const { player, spinGacha, spinGachaMulti, borrowCoins, consumeItem } = usePlayer(playerName);
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
      <section className="section-reveal section-padding">
        <p className="mb-4 font-mono text-xs tracking-widest text-accent/60">— GACHA &amp; COLLECTION</p>
        <h2
          className="mb-8 text-xl font-black tracking-tight text-white md:text-3xl"
          style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
        >
          ガチャ＆コレクション
        </h2>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <p className="mb-1 h-4" />
            <button
              type="button"
              onClick={handleGacha}
              disabled={spinning}
              className="rounded-control bg-accent py-4 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {spinning ? 'ガチャ中...' : '1回まわす'}
              <span className="flex items-center justify-center gap-1 text-xs font-normal opacity-70">
                <Image src="/1credit.png" alt="" width={12} height={12} className="h-3 w-3" />
                1クレ
              </span>
            </button>
          </div>

          <div className="flex flex-col">
            <p className="mb-1 text-center font-mono text-xs tracking-widest text-accent/60">SSR以上1個確定</p>
            <button
              type="button"
              onClick={handleMultiGacha}
              disabled={spinning || (player !== null && player.coins < 1000)}
              className="rounded-control bg-accent py-4 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {spinning ? 'ガチャ中...' : '10回まわす'}
              <span className="flex items-center justify-center gap-1 text-xs font-normal opacity-70">
                <Image src="/1credit.png" alt="" width={12} height={12} className="h-3 w-3" />
                10クレ
              </span>
            </button>
          </div>
        </div>

        {!showBorrowModal && (IS_UI_MOCK || (player && player.coins < 100)) && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowBorrowModal(true)}
              className="w-full rounded-control border-2 border-red-500 py-3 font-bold text-red-400 transition-colors hover:bg-red-500/10"
            >
              借金する
            </button>
          </div>
        )}

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowCollection(true)}
            className="flex w-full items-center justify-between rounded-control border border-edge px-4 py-3 text-sm text-accent/70 transition-colors hover:border-edge-strong hover:text-accent"
          >
            <span>コレクションを見る</span>
            <span className="text-accent/40">›</span>
          </button>
        </div>

        {message && (
          <p
            className={`text-sm font-medium ${
              message.includes('エラー') || message.includes('不足') ? 'text-red-400' : 'text-green-400'
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
        <CollectionModal
          collection={collection}
          onConsume={consumeItem}
          onClose={() => setShowCollection(false)}
        />
      )}

      {showBorrowModal && (
        <BorrowModal
          onBorrow={handleBorrow}
          onClose={() => setShowBorrowModal(false)}
          debt={player?.debt ?? 0}
        />
      )}
    </>
  );
}
