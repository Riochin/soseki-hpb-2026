'use client';

import { useState, useEffect, ReactNode } from 'react';
import { U18ModeContext } from '@/hooks/useU18Mode';

interface Props {
  children: ReactNode;
}

export default function AgeVerificationGate({ children }: Props) {
  const [isVerified, setIsVerified] = useState(false);
  const [u18Mode, setU18Mode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // SSR との整合のためクライアントマウント後に表示を切り替える
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mounted フラグは外部（sessionStorage）同期に必要
    setMounted(true);
    if (sessionStorage.getItem('age_verified') === 'true') {
      setIsVerified(true);
    }
  }, []);

  function handleYes() {
    sessionStorage.setItem('age_verified', 'true');
    setIsVerified(true);
  }

  function handleNo() {
    setU18Mode(true);
    setIsVerified(true);
  }

  if (!mounted) return null;

  return (
    <>
      {!isVerified && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
          <p className="mb-2 text-sm uppercase tracking-widest text-accent">アクセス制限</p>
          <h1 className="mb-6 text-3xl font-bold tracking-tight">年齢確認</h1>
          <p className="mb-8 text-center text-stone-300">
            このサイトには卑猥な単語が登場するため、18歳以上を対象としています。
            <br />
            あなたは18歳以上ですか？
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleYes}
              className="rounded-control border-2 border-accent px-8 py-3 font-bold text-accent transition-colors hover:bg-accent hover:text-black"
            >
              はい
            </button>
            <button
              type="button"
              onClick={handleNo}
              className="rounded-control border-2 border-stone-600 px-8 py-3 font-bold text-stone-400 transition-colors hover:bg-stone-800"
            >
              いいえ
            </button>
          </div>
        </div>
      )}

      {isVerified && (
        <U18ModeContext.Provider value={u18Mode}>
          {children}
        </U18ModeContext.Provider>
      )}
    </>
  );
}
