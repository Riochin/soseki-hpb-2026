'use client'

import { useState, useEffect } from 'react'

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
  { text: "ﾊｱﾞｱﾞｱﾞｱﾞｱﾞﾏｯｽﾞ‼️‼️‼️", author: "アクメ漱石", source: "namco松戸店" },
  { text: "俺たちの別れに涙は似合わない。\nだってまた会ったときに恥ずかしいからね", author: "アクメ漱石", source: "namco巣鴨店" },
];

// 見切れにくい小さめの角度バリエーション
const ANGLES = [-10, -7, -5, -3, 0, 3, 5, 8, -12, 10]

// 出現ゾーン：中央コンテンツエリアを避けた4ゾーン
const ZONES = [
  { topMin: 4,  topMax: 26, leftMin: 4,  leftMax: 90 },  // 上部ストリップ（全幅）
  { topMin: 68, topMax: 90, leftMin: 4,  leftMax: 90 },  // 下部ストリップ（全幅）
  { topMin: 22, topMax: 72, leftMin: 2,  leftMax: 20 },  // 左カラム
  { topMin: 22, topMax: 72, leftMin: 78, leftMax: 96 },  // 右カラム
]

// 文字数に応じたフォントサイズ（短いほど大きく）
function getQuoteFontSize(text: string): string {
  const len = [...text].length  // 絵文字も1文字としてカウント
  if (len <= 8)  return 'clamp(1.5rem, 3.2vw, 3rem)'
  if (len <= 20) return 'clamp(1rem, 2vw, 1.8rem)'
  return 'clamp(0.7rem, 1.3vw, 1.1rem)'
}

const VISIBLE_MS  = 5500  // 表示継続時間
const FADE_IN_MS  = 1400  // フェードイン時間
const FADE_OUT_MS = 1800  // フェードアウト時間
const SPAWN_MS    = 1600  // 次の名言を出すまでの間隔
const MAX_ITEMS   = 5     // 同時表示最大数

let uid = 0

type Phase = 'in' | 'show' | 'out'

type Item = {
  id: number
  quoteIndex: number
  angle: number
  top: number   // % — 上端からの位置
  left: number  // % — 左端からの位置
  phase: Phase
}

export default function QuoteOverlay() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    function spawn() {
      const id = uid++
      const quoteIndex = Math.floor(Math.random() * quotes.length)
      const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)]
      const zone = ZONES[Math.floor(Math.random() * ZONES.length)]
      const top  = zone.topMin  + Math.random() * (zone.topMax  - zone.topMin)
      const left = zone.leftMin + Math.random() * (zone.leftMax - zone.leftMin)

      const item: Item = { id, quoteIndex, angle, top, left, phase: 'in' }

      // まず scale(0.6) opacity:0 で追加し、次フレームで show へ遷移
      setItems(prev => {
        const next = prev.length >= MAX_ITEMS ? prev.slice(1) : prev
        return [...next, item]
      })

      // フェードイン（scale up + opacity 1）
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setItems(prev => prev.map(q => q.id === id ? { ...q, phase: 'show' } : q))
        })
      })

      // フェードアウト開始（scale up + opacity 0）
      setTimeout(() => {
        setItems(prev => prev.map(q => q.id === id ? { ...q, phase: 'out' } : q))
      }, VISIBLE_MS)

      // 削除
      setTimeout(() => {
        setItems(prev => prev.filter(q => q.id !== id))
      }, VISIBLE_MS + FADE_OUT_MS)
    }

    spawn()
    const interval = setInterval(spawn, SPAWN_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      {items.map(item => {
        const q = quotes[item.quoteIndex]

        const scale = item.phase === 'in' ? 0.6 : item.phase === 'out' ? 2.2 : 1
        const opacity = item.phase === 'show' ? 1 : 0
        const transition = item.phase === 'out'
          ? `opacity ${FADE_OUT_MS}ms ease, transform ${FADE_OUT_MS}ms ease`
          : `opacity ${FADE_IN_MS}ms ease, transform ${FADE_IN_MS}ms ease`

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: `${item.top}%`,
              left: `${item.left}%`,
              transform: `rotate(${item.angle}deg) scale(${scale})`,
              transformOrigin: 'center center',
              writingMode: 'vertical-rl',
              fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
              opacity,
              transition,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <p
              className="font-bold tracking-widest text-yellow-100/75 drop-shadow-lg"
              style={{ fontSize: getQuoteFontSize(q.text), whiteSpace: 'pre-line', maxInlineSize: '60vh' }}
            >
              「{q.text}」
            </p>
            <cite
              className="not-italic text-accent/55"
              style={{ fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)' }}
            >
              — {q.author}{q.source ? `『${q.source}』` : ''}
            </cite>
          </div>
        )
      })}
    </div>
  )
}
