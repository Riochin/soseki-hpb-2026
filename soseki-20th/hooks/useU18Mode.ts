'use client';

import { createContext, useContext } from 'react';

export const SOSEKI_NAME = 'アクメ漱石';

export const U18ModeContext = createContext(false);

export function useSosekiName(): string {
  const u18 = useContext(U18ModeContext);
  const devName = process.env.NEXT_PUBLIC_DEV_NAME;
  if (devName) return devName;
  return u18 ? 'FORK選手' : SOSEKI_NAME;
}
