'use client';

import { createContext, useContext } from 'react';

export const SOSEKI_NAME = 'アクメ漱石';

export const U18ModeContext = createContext(false);

export function useSosekiName(): string {
  const u18 = useContext(U18ModeContext);
  return u18 ? 'FORK選手' : SOSEKI_NAME;
}
