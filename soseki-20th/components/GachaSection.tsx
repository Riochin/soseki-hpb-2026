'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const RARITY_LABEL: Record<string, string> = {
  UR: 'ULTRA RARE',
  SSR: 'SUPER RARE',
  R: 'RARE',
  N: 'NORMAL',
};

const RARITY_CARD_BG: Record<string, string> = {
  UR: 'bg-gradient-to-br from-rose-400 via-yellow-300 via-green-400 via-blue-400 to-purple-400',
  SSR: 'bg-gradient-to-br from-amber-300 to-yellow-500',
  R: 'bg-gradient-to-br from-slate-300 to-slate-500',
  N: 'bg-gradient-to-br from-amber-600 to-amber-800',
};

interface Props {
  playerName: string;
  onUrStart?: () => void;
  onUrEnd?: () => void;
}

function rarityClass(rarity: string): string {
  const text = RARITY_TEXT[rarity] ?? 'text-stone-400';
  const border = RARITY_BORDER[rarity] ?? 'border-stone-500';
  return `${text} ${border}`;
}

type AnimPhase = 'rarity' | 'gif' | 'upgrading' | 'flip-out' | 'flip-in' | 'done';

const UR_GIF_DURATION = 3000;
const UPGRADE_PHASE_DURATION = 2800;
const FLASH_DELAY = 1500;  // upgrading 開始 → 白フラッシュ＆虹切替
const WHITE_FLASH_DURATION = 600;

function URConfirmedOverlay({ visible }: { visible: boolean }) {
  if (!visible || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black">
      <Image
        src="/games/ur-confirmed.gif"
        alt=""
        fill
        unoptimized
        className="object-cover"
      />
    </div>,
    document.body,
  );
}

// カード裏面の背景色を計算
function getCardBackBg(rarity: string, isUpgradeAnim: boolean, animPhase: AnimPhase, showURBack: boolean): string {
  if (isUpgradeAnim && rarity === 'UR') {
    if (animPhase === 'flip-out' || showURBack) {
      return RARITY_CARD_BG['UR'];
    }
    return RARITY_CARD_BG['SSR'];
  }
  return RARITY_CARD_BG[rarity] ?? 'bg-stone-700';
}

const FLIP_DURATION = 380;

interface GachaCardProps {
  item: CollectionItem;
  isNew: boolean;
  animPhase: AnimPhase;
  isUpgradeAnim: boolean;
  showWhiteFlash: boolean;
  showURBack: boolean;
  size?: 'sm' | 'lg';
}

function GachaCard({ item, isNew, animPhase, isUpgradeAnim, showWhiteFlash, showURBack, size = 'lg' }: GachaCardProps) {
  const colorClass = rarityClass(item.rarity);
  const cardFrontBorderBg = RARITY_CARD_BG[item.rarity] ?? 'bg-stone-700';
  const cardBackBg = getCardBackBg(item.rarity, isUpgradeAnim, animPhase, showURBack);
  const isSmall = size === 'sm';
  const showFront = animPhase === 'flip-in' || animPhase === 'done';

  // カード内容（サイズキーパーと表面で共用）
  const innerContent = (
    <div className={`rounded-control bg-panel-raised text-center ${isSmall ? 'p-2 sm:p-3' : 'p-6'}`}>
      {isSmall ? (
        <>
          <div className="mb-1 text-2xl sm:text-3xl">{item.icon}</div>
          <p
            className="mb-0.5 truncate text-[10px] font-medium leading-tight text-white sm:mb-1 sm:text-xs"
            title={item.name}
          >
            {item.name}
          </p>
          <span className={`rounded-control border px-1 py-0.5 text-[9px] font-bold sm:px-1.5 sm:text-xs ${colorClass}`}>
            {item.rarity}
          </span>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );

  return (
    <div className="relative w-full">
      {/* サイズキーパー（常に DOM に存在、高さ確保用、不可視） */}
      <div
        className={`rounded-control ${cardFrontBorderBg} ${isSmall ? 'p-[3px]' : 'p-[5px]'}`}
        style={{ visibility: 'hidden' }}
        aria-hidden="true"
      >
        {innerContent}
      </div>

      {/* カード表面（flip-in 時にマウント、回転しながら登場） */}
      {showFront && (
        <div
          className={`absolute inset-0 rounded-control ${cardFrontBorderBg} ${isSmall ? 'p-[3px]' : 'p-[5px]'}`}
          style={animPhase === 'flip-in' ? {
            animation: `card-front-in ${FLIP_DURATION}ms cubic-bezier(0, 0, 0.6, 1) forwards`,
            transformOrigin: 'center center',
          } : undefined}
        >
          {innerContent}
        </div>
      )}

      {/* カード裏面（色のみ、flip-out 時に回転アニメーション） */}
      {!showFront && (
        <div
          key={animPhase}
          className={`absolute inset-0 rounded-control ${cardBackBg}`}
          style={animPhase === 'flip-out' ? {
            animation: `card-back-out ${FLIP_DURATION}ms cubic-bezier(0.4, 0, 1, 1) forwards`,
            transformOrigin: 'center center',
          } : undefined}
        >
          {/* 白フラッシュ: upgrading 開始と同時に全白 → フェードで虹色を露出 */}
          {showWhiteFlash && animPhase === 'upgrading' && (
            <div
              className="pointer-events-none absolute inset-0 rounded-control bg-white"
              style={{ animation: `white-flash ${WHITE_FLASH_DURATION}ms ease-in-out forwards` }}
            />
          )}
        </div>
      )}

      {/* NEW バッジ（sm、done 後） */}
      {isSmall && animPhase === 'done' && isNew && (
        <span className="absolute -right-2 -top-2 bg-accent px-1.5 py-0.5 text-[10px] font-bold leading-none text-black">
          NEW
        </span>
      )}
    </div>
  );
}

// アニメーション状態を管理するカスタムフック（タイムアウトで完全制御）
function useGachaAnim(
  hasUR: boolean,
  onUrStart?: () => void,
  onUrEnd?: () => void,
): {
  animPhase: AnimPhase;
  isUpgradeAnim: boolean;
  showWhiteFlash: boolean;
  showURBack: boolean;
  showWhiteGlow: boolean;
} {
  const [animPhase, setAnimPhase] = useState<AnimPhase>('rarity');
  const [showWhiteFlash, setShowWhiteFlash] = useState(false);
  const [showURBack, setShowURBack] = useState(false);
  const [showWhiteGlow, setShowWhiteGlow] = useState(false);
  const [isUpgradeAnim] = useState(() => hasUR && Math.random() < 1 / 3);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    if (hasUR && isUpgradeAnim) {
      const gifStart = 2000;
      const upgradeStart = gifStart + UR_GIF_DURATION;
      const flipStart = upgradeStart + UPGRADE_PHASE_DURATION;
      at(gifStart, () => { setAnimPhase('gif'); onUrStart?.(); });
      at(upgradeStart, () => { setAnimPhase('upgrading'); onUrEnd?.(); });
      at(upgradeStart + FLASH_DELAY, () => { setShowWhiteFlash(true); setShowURBack(true); setShowWhiteGlow(true); });
      at(flipStart, () => { setAnimPhase('flip-out'); setShowWhiteGlow(false); });
      at(flipStart + FLIP_DURATION, () => setAnimPhase('flip-in'));
      at(flipStart + FLIP_DURATION * 2, () => setAnimPhase('done'));
    } else if (hasUR) {
      at(2000, () => setAnimPhase('flip-out'));
      at(2000 + FLIP_DURATION, () => setAnimPhase('flip-in'));
      at(2000 + FLIP_DURATION * 2, () => setAnimPhase('done'));
    } else {
      at(1800, () => setAnimPhase('flip-out'));
      at(1800 + FLIP_DURATION, () => setAnimPhase('flip-in'));
      at(1800 + FLIP_DURATION * 2, () => setAnimPhase('done'));
    }

    return () => timers.forEach(clearTimeout);
  }, [hasUR, isUpgradeAnim, onUrStart, onUrEnd]);

  return { animPhase, isUpgradeAnim, showWhiteFlash, showURBack, showWhiteGlow };
}

function GachaResultModal({ result, onClose, onUrStart, onUrEnd }: { result: GachaResult; onClose: () => void; onUrStart?: () => void; onUrEnd?: () => void }) {
  const { item, isNew, newCoins } = result;
  const hasUR = item.rarity === 'UR';
  const { animPhase, isUpgradeAnim, showWhiteFlash, showURBack, showWhiteGlow } = useGachaAnim(hasUR, onUrStart, onUrEnd);

  const showSpotlight = isUpgradeAnim && animPhase === 'upgrading';

  return (
    <>
      <URConfirmedOverlay visible={animPhase === 'gif'} />
      <ModalFrame onBackdropClick={onClose} maxWidthClass="max-w-xs" panelClassName="p-6 text-center">
        {/* 周囲暗転オーバーレイ（modal-panel が relative なので absolute で被せられる） */}
        {showSpotlight && (
          <div
            className="pointer-events-none absolute inset-0 rounded-panel"
            style={{ backgroundColor: 'rgba(0,0,0,0.88)', animation: `ur-spotlight-dim ${UPGRADE_PHASE_DURATION}ms ease-out forwards`, zIndex: 10 }}
          />
        )}
        <div
          className={showSpotlight ? 'relative z-20' : ''}
          style={showWhiteGlow ? { filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.9)) drop-shadow(0 0 50px rgba(255,255,255,0.5))' } : undefined}
        >
          <GachaCard
            item={item}
            isNew={isNew}
            animPhase={animPhase}
            isUpgradeAnim={isUpgradeAnim}
            showWhiteFlash={showWhiteFlash}
            showURBack={showURBack}
            size="lg"
          />
        </div>
        {animPhase === 'done' && (
          <p className="mt-3 font-mono text-xs text-stone-500">残Credit: {toCredit(newCoins)}</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-control border-2 border-edge py-2 font-bold text-accent transition-colors hover:border-edge-strong hover:bg-accent/5"
        >
          閉じる
        </button>
      </ModalFrame>
    </>
  );
}

function MultiGachaResultModal({
  result,
  onClose,
  onUrStart,
  onUrEnd,
}: {
  result: MultiGachaResult;
  onClose: () => void;
  onUrStart?: () => void;
  onUrEnd?: () => void;
}) {
  const hasUR = result.results.some((r) => r.item.rarity === 'UR');
  const { animPhase, isUpgradeAnim, showWhiteFlash, showURBack, showWhiteGlow } = useGachaAnim(hasUR, onUrStart, onUrEnd);

  const showSpotlight = isUpgradeAnim && animPhase === 'upgrading';

  return (
    <>
      <URConfirmedOverlay visible={animPhase === 'gif'} />
      <ModalFrame
        onBackdropClick={onClose}
        maxWidthClass="max-w-2xl"
        panelClassName="p-4 text-center sm:p-6"
      >
        {/* 周囲暗転オーバーレイ */}
        {showSpotlight && (
          <div
            className="pointer-events-none absolute inset-0 rounded-panel"
            style={{ backgroundColor: 'rgba(0,0,0,0.88)', animation: `ur-spotlight-dim ${UPGRADE_PHASE_DURATION}ms ease-out forwards`, zIndex: 10 }}
          />
        )}
        <p className="mb-3 text-center font-mono text-xs tracking-widest text-accent/60">— 10連ガチャ結果</p>

        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          {result.results.map((r, idx) => {
            const isUrCard = r.item.rarity === 'UR';
            return (
              <div
                key={idx}
                className={showSpotlight && isUrCard ? 'relative z-20' : 'relative'}
                style={showWhiteGlow && isUrCard ? { filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.9)) drop-shadow(0 0 36px rgba(255,255,255,0.5))' } : undefined}
              >
                <GachaCard
                  item={r.item}
                  isNew={r.isNew}
                  animPhase={animPhase}
                  isUpgradeAnim={isUpgradeAnim && isUrCard}
                  showWhiteFlash={showWhiteFlash && isUrCard}
                  showURBack={showURBack && isUrCard}
                  size="sm"
                />
              </div>
            );
          })}
        </div>

        {animPhase === 'done' && (
          <p className="mb-3 text-center font-mono text-xs text-stone-500">残Credit: {toCredit(result.newCoins)}</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-control border-2 border-edge py-1.5 font-bold text-accent transition-colors hover:border-edge-strong hover:bg-accent/5 sm:py-2"
        >
          閉じる
        </button>
      </ModalFrame>
    </>
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
                className="relative transition-transform hover:scale-[1.03] active:scale-95"
              >
                {item.is_giftable && !item.is_consumed && (
                  <span className="absolute -right-1.5 -top-1.5 z-10 bg-green-400 px-1.5 py-0.5 text-[9px] font-bold leading-none text-black">
                    GIFT
                  </span>
                )}
                {item.is_consumed && (
                  <span className="absolute -right-1.5 -top-1.5 z-10 bg-stone-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-stone-300">
                    済
                  </span>
                )}
                <GachaCard
                  item={item}
                  isNew={false}
                  animPhase="done"
                  isUpgradeAnim={false}
                  showWhiteFlash={false}
                  showURBack={false}
                  size="sm"
                />
              </button>
            ) : (
              <div
                key={item.itemId}
                className={`rounded-control opacity-40 ${RARITY_CARD_BG[item.rarity] ?? 'bg-stone-700'} p-[3px]`}
              >
                <div className="rounded-control bg-panel-raised p-2 text-center sm:p-3">
                  <div className="mb-1 text-2xl text-stone-600 sm:text-3xl">？</div>
                  <p className="mb-0.5 text-[10px] font-medium text-stone-600 sm:mb-1 sm:text-xs">???</p>
                  <span className={`rounded-control border px-1 py-0.5 text-[9px] font-bold sm:px-1.5 sm:text-xs ${rarityClass(item.rarity)}`}>
                    {item.rarity}
                  </span>
                </div>
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

export default function GachaSection({ playerName, onUrStart, onUrEnd }: Props) {
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

        {!showBorrowModal && (IS_UI_MOCK || (player && player.coins < 10000)) && (
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
        <GachaResultModal result={gachaResult} onClose={() => setGachaResult(null)} onUrStart={onUrStart} onUrEnd={onUrEnd} />
      )}

      {multiGachaResult && (
        <MultiGachaResultModal result={multiGachaResult} onClose={() => setMultiGachaResult(null)} onUrStart={onUrStart} onUrEnd={onUrEnd} />
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
