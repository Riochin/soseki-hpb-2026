'use client'

import { useState, useEffect, useRef } from 'react'
import { useSosekiName } from '@/hooks/useU18Mode'

const quotes = [
  {
    text: "智に働けば角が立つ。\n情に棹させば流される。意地を通せば窮屈だ。\nとかくに人の世は住みにくい。",
    author: "夏目漱石",
    source: "草枕",
  },
  {
    text: "自分が正しいと思ったら、どんな反対があっても、自分を貫け。",
    author: "夏目漱石",
    source: "こころ",
  },
  {
    text: "人間は自分の一生を貫く仕事を持たなければならない。",
    author: "夏目漱石",
    source: "道草",
  },
  {
    text: "恋は罪悪ですよ、と彼は云った。",
    author: "夏目漱石",
    source: "こころ",
  },
  {
    text: "義務は大事だ。\nしかし義務は一種の牢獄だよ。",
    author: "夏目漱石",
    source: "行人",
  },
  { text: "月が綺麗ですね。", author: "夏目漱石", source: "（伝説）" },
  {
    text: "誠実さのない天才よりも、\n才能のない誠実さの方が世の中の役に立つ。",
    author: "夏目漱石",
    source: "吾輩は猫である",
  },
  { text: "easy", author: "FORK", source: "NGC 2024" },
  { text: "まぁ、余裕ッスね", author: "FORK", source: "NGC 2023" },
  { text: "じゃ、また", author: "アクメ漱石", source: "namco巣鴨店" },
  {
    text: "「まぁ、余裕ッスね」",
    author: "FORK & かたはば",
    source: "LSC 2025",
  },
  { text: "俺⁉️⁉️⁉️⁉️⁉️⁉️⁉️", author: "アクメ漱石", source: "namco巣鴨店" },
  { text: "おけーーーーい‼️‼️‼️", author: "アクメ漱石", source: "namco巣鴨店" },
  { text: "上手ーーーーい‼️‼️‼️", author: "アクメ漱石", source: "namco巣鴨店" },
  { text: "本日のおドクペ", author: "アクメ漱石", source: "Twitter" },
  { text: "namco巣鴨が実家", author: "アクメ漱石", source: "Twitter" },
  { text: "鉄は熱いうちに打とう", author: "アクメ漱石", source: "LINE" },
  { text: "宵越しの銭は持たない", author: "アクメ漱石", source: "パチンコ屋" },
  {
    text: "ﾊｱﾞｱﾞｱﾞｱﾞｱﾞﾏｯｽﾞ‼️‼️‼️",
    author: "アクメ漱石",
    source: "namco松戸店",
  },
  {
    text: "俺たちの別れに涙は似合わない。\nだってまた会ったときに恥ずかしいからね",
    author: "アクメ漱石",
    source: "namco巣鴨店",
  },
  {
    text: "ごちそうさまでした！\n美味かったっす！！",
    author: "アクメ漱石",
    source: "巣鴨家",
  },
  {
    text: "普通にサンライズ立ちだろ",
    author: "アクメ漱石",
    source: "北区立東田端公園",
  },
  {
    text: "これからも熱くドライな関係で行こう",
    author: "アクメ漱石",
    source: "X",
  },
  {
    text: "月でかくね❓",
    author: "アクメ漱石",
    source: "Twitter",
  },
  {
    text: "次からは、気をつけような❓",
    author: "アクメ漱石",
    source: "中野駅",
  },
  {
    text: "俺レベル2‼️‼️‼️‼️‼️",
    author: "アクメ漱石",
    source: "namco巣鴨",
  },
  {
    text: "濡れた？",
    author: "アクメ漱石",
    source: "X",
  },
  {
    text: "沈む沈む‼️",
    author: "アクメ漱石",
    source: "ビッグエコー錦糸町南口駅前店 ダーツエリア",
  },
  {
    text: "OK、適応したわ",
    author: "アクメ漱石",
    source: "namco巣鴨",
  },
  {
    text: "孤独を受け入れるってことが、\n大人になることだと思うよ",
    author: "アクメ漱石",
    source: "X",
  },
  {
    text: "む”ぷ”ん”さ”ぁぁぁん”",
    author: "アクメ漱石",
    source: "namco巣鴨",
  },
  {
    text: "今日の服いいね",
    author: "アクメ漱石",
    source: "namco巣鴨",
  },
  {
    text: "名前を下ネタにすると相手にだけ言わせる事ができるカスのライフハック",
    author: "アクメ漱石",
    source: "Twitter",
  }
];

// 出現ゾーン：中央コンテンツエリアを避けた4ゾーン
const ZONES = [
  { topMin: 4,  topMax: 22, leftMin: 6,  leftMax: 84 },  // 上部ストリップ
  { topMin: 70, topMax: 90, leftMin: 6,  leftMax: 84 },  // 下部ストリップ
  { topMin: 22, topMax: 70, leftMin: 2,  leftMax: 18 },  // 左カラム
  { topMin: 22, topMax: 70, leftMin: 76, leftMax: 92 },  // 右カラム
]

// 5文字以上：右2/5を除いた左3/5に制限
const ZONES_MID = [
  { topMin: 4,  topMax: 22, leftMin: 6,  leftMax: 60 },
  { topMin: 70, topMax: 90, leftMin: 6,  leftMax: 60 },
  { topMin: 22, topMax: 70, leftMin: 2,  leftMax: 18 },
]

// 長い文章はさらに左寄り（左42%まで）
const ZONES_LEFT = [
  { topMin: 4,  topMax: 22, leftMin: 6,  leftMax: 42 },
  { topMin: 70, topMax: 90, leftMin: 6,  leftMax: 42 },
  { topMin: 22, topMax: 70, leftMin: 2,  leftMax: 18 },
]

// 文字数に応じたフォントサイズ（短いほど大きく）
function getQuoteFontSize(text: string): string {
  const len = [...text].length
  if (len <= 8)  return 'clamp(1.4rem, 2.8vw, 2.6rem)'
  if (len <= 20) return 'clamp(0.95rem, 1.8vw, 1.6rem)'
  return 'clamp(0.7rem, 1.2vw, 1rem)'
}

// 文字数に応じたフェードアウト時間（ms）
function getFadeOutMs(charCount: number): number {
  if (charCount <= 8)  return 4000
  if (charCount <= 20) return 5000
  return 6500
}

// 既存 item との衝突を避け、ゾーンの中央寄りの位置を優先して返す
function findSafePosition(existing: Item[], text: string): { top: number; left: number } {
  const len = [...text].length
  const minTopGap  = len <= 8 ? 18 : len <= 20 ? 14 : 11
  const minLeftGap = len <= 8 ? 22 : len <= 20 ? 16 : 13

  const zones = len > 20 ? ZONES_LEFT : len >= 5 ? ZONES_MID : ZONES

  // ゾーン全体の中心を基準点とする
  const allTop  = zones.map(z => (z.topMin  + z.topMax)  / 2)
  const allLeft = zones.map(z => (z.leftMin + z.leftMax) / 2)
  const centerTop  = allTop.reduce((a, b) => a + b, 0) / allTop.length
  const centerLeft = allLeft.reduce((a, b) => a + b, 0) / allLeft.length

  // 候補を大量生成して中央からの距離でソート
  const candidates: { top: number; left: number; dist: number }[] = []
  for (let i = 0; i < 4; i++) {
    const zone = zones[Math.floor(Math.random() * zones.length)]
    const top  = zone.topMin  + Math.random() * (zone.topMax  - zone.topMin)
    const left = zone.leftMin + Math.random() * (zone.leftMax - zone.leftMin)
    const dist = (top - centerTop) ** 2 + (left - centerLeft) ** 2
    candidates.push({ top, left, dist })
  }
  candidates.sort((a, b) => a.dist - b.dist)

  for (const c of candidates) {
    const safe = existing.every(item => {
      const dt = Math.abs(item.top  - c.top)
      const dl = Math.abs(item.left - c.left)
      return dt > minTopGap || dl > minLeftGap
    })
    if (safe) return { top: c.top, left: c.left }
  }

  // フォールバック：最も中央寄りの候補をそのまま使用
  return { top: candidates[0].top, left: candidates[0].left }
}

const SPAWN_MS   = 800
const MAX_ITEMS  = 18

let uid = 0

type Phase = 'in' | 'show' | 'out'

type Item = {
  id: number
  quoteIndex: number
  top: number
  left: number
  phase: Phase
  visibleLineCount: number
  totalLines: number
  totalDurationMs: number  // スケール縮小アニメーション全体の長さ
  outDelay: number         // フェードアウト開始までの遅延
  fadeOutMs: number
  transformOrigin: string  // 縮小の基点方向
}

export default function QuoteOverlay() {
  const sosekiName = useSosekiName()
  const [items, setItems] = useState<Item[]>([])
  const itemsRef = useRef<Item[]>([])

  function updateItems(updater: (prev: Item[]) => Item[]) {
    setItems(prev => {
      const next = updater(prev)
      itemsRef.current = next
      return next
    })
  }

  useEffect(() => {
    function spawn() {
      const id = uid++
      const quoteIndex = Math.floor(Math.random() * quotes.length)
      const q = quotes[quoteIndex]
      const lines = q.text.split('\n')
      const totalLines = lines.length
      const charCount = [...q.text].length
      const fadeOutMs = getFadeOutMs(charCount)
      const lastLineDelay = 700 * (totalLines - 1)
      // 単行の場合でもフェードインが完了してから out に入るよう最低時間を確保
      const outDelay = Math.max(lastLineDelay, 100)
      const totalDurationMs = outDelay + fadeOutMs

      // 不可視（out フェーズ）のアイテムは衝突判定から除外
      const visibleItems = itemsRef.current.filter(i => i.phase !== 'out')
      const { top, left } = findSafePosition(visibleItems, q.text)

      const origins = ['top left', 'top center', 'top right', 'center left', 'center center', 'center right']
      const transformOrigin = origins[Math.floor(Math.random() * origins.length)]

      const item: Item = { id, quoteIndex, top, left, phase: 'in', visibleLineCount: 0, totalLines, totalDurationMs, outDelay, fadeOutMs, transformOrigin }

      updateItems(prev => {
        const next = prev.length >= MAX_ITEMS ? prev.slice(1) : prev
        return [...next, item]
      })

      // 登場: スケール縮小を開始しつつ最初の行を表示
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateItems(prev => prev.map(q => q.id === id ? { ...q, phase: 'show', visibleLineCount: 1 } : q))

          // 2行目以降を 0.7s ずつずらして表示
          for (let i = 1; i < totalLines; i++) {
            const lineIndex = i
            setTimeout(() => {
              updateItems(prev => prev.map(q => q.id === id ? { ...q, visibleLineCount: lineIndex + 1 } : q))
            }, 700 * lineIndex)
          }

          // 全行出揃い＋最低表示時間経過後にフェードアウト開始
          setTimeout(() => {
            updateItems(prev => prev.map(q => q.id === id ? { ...q, phase: 'out' } : q))
          }, outDelay)

          // 削除
          setTimeout(() => {
            updateItems(prev => prev.filter(q => q.id !== id))
          }, totalDurationMs)
        })
      })
    }

    spawn()
    const interval = setInterval(spawn, SPAWN_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {items.map(item => {
        const q = quotes[item.quoteIndex]
        const lines = q.text.split('\n')
        const author = q.author === 'アクメ漱石' ? sosekiName : q.author

        // 外側: スケールのみ担当。登場からゴールスケールまで一定速度で縮小
        const outerScale      = item.phase === 'in' ? 1.5 : 0.3
        const outerTransition = item.phase === 'in'
          ? 'none'
          : `transform ${item.totalDurationMs}ms linear`

        // 内側: opacityのみ担当。即座に表示、フェードアウトはゆっくり
        const innerOpacity    = item.phase === 'out' ? 0 : 1
        const innerTransition = item.phase === 'out'
          ? `opacity ${item.fadeOutMs}ms ease`
          : 'none'

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: `${item.top}%`,
              left: `${item.left}%`,
              transform: `scale(${outerScale})`,
              transformOrigin: item.transformOrigin,
              transition: outerTransition,
              fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
            }}
          >
            <div
              style={{
                opacity: innerOpacity,
                transition: innerTransition,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <cite
                className="not-italic text-accent/50"
                style={{ fontSize: 'clamp(0.55rem, 0.8vw, 0.7rem)', marginBottom: '0.2em', opacity: item.visibleLineCount >= 1 ? 1 : 0 }}
              >
                — {author}{q.source ? `『${q.source}』` : ''}
              </cite>
              <p
                className="font-bold tracking-widest text-yellow-100/75 drop-shadow-lg"
                style={{ fontSize: getQuoteFontSize(q.text) }}
              >
                {lines.map((line, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'block',
                      opacity: i < item.visibleLineCount ? 1 : 0,
                      transition: 'opacity 300ms ease',
                    }}
                  >
                    {i === 0 ? `「${line}` : line}{i === lines.length - 1 ? '」' : ''}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
