'use client';

import type { ReactNode } from 'react';

export type ModalOverlayVariant = 'default' | 'heavy' | 'light';

const overlayBg: Record<ModalOverlayVariant, string> = {
  default: 'bg-overlay',
  heavy: 'bg-overlay-heavy',
  light: 'bg-overlay-light',
};

export interface ModalFrameProps {
  children: ReactNode;
  /** 背景クリックで閉じるときに渡す */
  onBackdropClick?: () => void;
  maxWidthClass?: string;
  panelClassName?: string;
  overlayVariant?: ModalOverlayVariant;
  zClass?: string;
}

/**
 * オーバーレイ濃度・パネル枠・角丸をサイトトークンに揃えたモーダル枠。
 */
export default function ModalFrame({
  children,
  onBackdropClick,
  maxWidthClass = 'max-w-xs',
  panelClassName = '',
  overlayVariant = 'default',
  zClass = 'z-50',
}: ModalFrameProps) {
  const bg = overlayBg[overlayVariant];
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm ${bg} ${zClass}`}
      onClick={onBackdropClick}
      role="presentation"
    >
      <div
        className={`modal-panel ${maxWidthClass} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
