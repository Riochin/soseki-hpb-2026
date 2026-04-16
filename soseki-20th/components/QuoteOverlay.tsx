'use client'

import { useState, useEffect } from 'react'

const quotes = [
  {
    text: "智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。",
    source: "草枕",
  },
  {
    text: "自分が正しいと思ったら、どんな反対があっても、自分を貫け。",
    source: "こころ",
  },
  {
    text: "人間は自分の一生を貫く仕事を持たなければならない。",
    source: "道草",
  },
  { text: "恋は罪悪ですよ、と彼は云った。", source: "こころ" },
  { text: "義務は大事だ。しかし義務は一種の牢獄だよ。", source: "行人" },
  { text: "月が綺麗ですね。", source: "（伝説）" },
  {
    text: "誠実さのない天才よりも、才能のない誠実さの方が世の中の役に立つ。",
    source: "吾輩は猫である",
  },
  { text: "easy", source: "NGC 2024" },
  { text: "まぁ、余裕っすね", source: "NGC 2023" },
];

// 見切れにくい小さめの角度バリエーション
const ANGLES = [-10, -7, -5, -3, 0, 3, 5, 8, -12, 10]

const VISIBLE_MS = 4500   // 表示継続時間
const FADE_MS    = 1000   // フェード時間
const SPAWN_MS   = 2000   // 次の名言を出すまでの間隔
const MAX_ITEMS  = 3      // 同時表示最大数

let uid = 0

type Item = {
  id: number
  quoteIndex: number
  angle: number
  top: number    // % — 上端からの位置
  side: 'left' | 'right'
  offset: number // % — 各端からの距離
  visible: boolean
}

export default function QuoteOverlay() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    function spawn() {
      const id = uid++
      const quoteIndex = Math.floor(Math.random() * quotes.length)
      const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)]

      // 左右どちらかにランダム配置
      const top    = 15 + Math.random() * 50
      const side   = Math.random() < 0.5 ? 'left' : 'right'
      const offset = 2 + Math.random() * 10   // 端から 2〜12%

      const item: Item = { id, quoteIndex, angle, top, side, offset, visible: false }

      // まず opacity:0 で追加し、次フレームで opacity:1 にしてフェードイン
      setItems(prev => {
        const next = prev.length >= MAX_ITEMS ? prev.slice(1) : prev
        return [...next, item]
      })

      // フェードイン（次フレームで visible:true）
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setItems(prev => prev.map(q => q.id === id ? { ...q, visible: true } : q))
        })
      })

      // フェードアウト開始
      setTimeout(() => {
        setItems(prev => prev.map(q => q.id === id ? { ...q, visible: false } : q))
      }, VISIBLE_MS)

      // 削除
      setTimeout(() => {
        setItems(prev => prev.filter(q => q.id !== id))
      }, VISIBLE_MS + FADE_MS)
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
        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: `${item.top}%`,
              left:  item.side === 'left'  ? `${item.offset}%` : undefined,
              right: item.side === 'right' ? `${item.offset}%` : undefined,
              transform: `rotate(${item.angle}deg)`,
              writingMode: 'vertical-rl',
              fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
              opacity: item.visible ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <p
              className="font-bold tracking-widest text-yellow-100/75 drop-shadow-lg"
              style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1.3rem)' }}
            >
              「{q.text}」
            </p>
            <cite
              className="not-italic text-yellow-400/55"
              style={{ fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)' }}
            >
              — 夏目漱石『{q.source}』
            </cite>
          </div>
        )
      })}
    </div>
  )
}
