'use client';

import { useState, useEffect, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function AgeVerificationGate({ children }: Props) {
  const [isVerified, setIsVerified] = useState(false);
  const [showGlitch, setShowGlitch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem('age_verified') === 'true') {
      setIsVerified(true);
    }
  }, []);

  function handleYes() {
    setShowGlitch(true);
    setTimeout(() => {
      sessionStorage.setItem('age_verified', 'true');
      setIsVerified(true);
      setShowGlitch(false);
    }, 800);
  }

  // SSR では何も表示しない（hydration mismatch 防止）
  if (!mounted) return null;

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white${showGlitch ? ' animate-glitch' : ''}`}
    >
      <p className="mb-2 text-sm tracking-widest text-yellow-400 uppercase">
        アクセス制限
      </p>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">年齢確認</h1>
      <p className="mb-8 text-center text-gray-300">
        このサイトは18歳以上を対象としています。
        <br />
        あなたは18歳以上ですか？
      </p>
      <div className="flex gap-4">
        <button
          onClick={handleYes}
          className="rounded border border-yellow-400 px-8 py-3 font-bold text-yellow-400 transition-colors hover:bg-yellow-400 hover:text-black"
        >
          はい
        </button>
        <button
          onClick={() => {
            window.location.href = 'https://www.google.com';
          }}
          className="rounded border border-gray-600 px-8 py-3 font-bold text-gray-400 transition-colors hover:bg-gray-800"
        >
          いいえ
        </button>
      </div>
    </div>
  );
}
