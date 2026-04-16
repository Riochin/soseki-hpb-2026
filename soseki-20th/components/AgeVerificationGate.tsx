'use client';

import { useState, useEffect, ReactNode } from 'react';
import Image from 'next/image';

interface Props {
  children: ReactNode;
}

const INTRO_DURATION = 4000; // ms — intro-overlay アニメーションと合わせる

export default function AgeVerificationGate({ children }: Props) {
  const [isVerified, setIsVerified] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem('age_verified') === 'true') {
      setIsVerified(true);
    }
  }, []);

  function handleYes() {
    sessionStorage.setItem('age_verified', 'true');
    setIsVerified(true);
    setShowIntro(true);
    setTimeout(() => setShowIntro(false), INTRO_DURATION);
  }

  // SSR では何も表示しない（hydration mismatch 防止）
  if (!mounted) return null;

  return (
    <>
      {/* 年齢確認フォーム */}
      {!isVerified && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
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
              className="border-2 border-yellow-400 px-8 py-3 font-bold text-yellow-400 transition-colors hover:bg-yellow-400 hover:text-black"
            >
              はい
            </button>
            <button
              onClick={() => {
                window.location.href = 'https://www.google.com';
              }}
              className="border-2 border-gray-600 px-8 py-3 font-bold text-gray-400 transition-colors hover:bg-gray-800"
            >
              いいえ
            </button>
          </div>
        </div>
      )}

      {/* イントロオーバーレイ: 画像フェードイン → 画面フェードアウト */}
      {showIntro && (
        <div className="animate-intro-overlay fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black">
          <div className="animate-intro-image relative w-64 sm:w-80 md:w-96">
            <Image
              src="/yoyu2024.png"
              alt="yoyu2024"
              width={400}
              height={400}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <p
            className="animate-intro-image text-4xl tracking-widest text-amber-100 sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-yuji-syuku), serif" }}
          >
            まあ、余裕っすね
          </p>
        </div>
      )}

      {/* ヒーローページ（verified 後に描画） */}
      {isVerified && <>{children}</>}
    </>
  );
}
