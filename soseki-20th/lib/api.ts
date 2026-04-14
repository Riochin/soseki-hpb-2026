/**
 * api.ts — API ベース URL と SWR 用汎用 fetcher を定義する。
 *
 * 使用例:
 *   import useSWR from 'swr';
 *   import { fetcher } from '@/lib/api';
 *   const { data } = useSWR('/api/messages', fetcher);
 */

/** API サーバーのベース URL（環境変数から取得）。末尾スラッシュなし。 */
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

/**
 * SWR 用の汎用 fetcher。
 * key（パス文字列）を受け取り、API_BASE_URL と結合して JSON を取得する。
 * 4xx / 5xx の場合は Error をスローする（SWR の error 状態に反映される）。
 */
export async function fetcher<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * POST / PUT などのミューテーション用ヘルパー。
 * SWR の mutate から直接呼び出して使う。
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
