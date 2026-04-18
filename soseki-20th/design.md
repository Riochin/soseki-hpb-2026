# SOSEKI 20th フロントエンド デザインガイド

本ドキュメントは [`app/globals.css`](app/globals.css) に定義されたデザイントークンと、Next.js アプリ（`soseki-20th`）の UI 統一方針をまとめたものです。新規コンポーネントやスタイル変更の際は、ここにない任意の 16 進色や `zinc-*` の追加を避け、トークンと既存パターンに寄せてください。

## スコープ

- **メイン UI**: 本リポジトリの Next アプリ（Tailwind CSS v4）。
- **埋め込みゲーム**: [`public/games/*.html`](public/games/) は素の CSS の `:root` で色を持つ。値は本ガイドのトークンと揃える（リポジトリルートの [`games/`](../games/) の `typing-game.html` と同期運用）。

## カラートークン

`:root` で定義し、`@theme inline` により `bg-*` / `border-*` / `text-*` として利用します。

| トークン名 | 用途 | Tailwind 例 |
|------------|------|-------------|
| `background` | ページ地 | `bg-background` |
| `foreground` | 本文テキスト | `text-foreground` |
| `surface` | 一段明るい面（カード、カウンター枠など） | `bg-surface` |
| `surface-muted` | ティッカー帯など暗い帯 | `bg-surface-muted` |
| `panel` | モーダル内メイン面 | `bg-panel` |
| `panel-raised` | モーダル内グリッドセル | `bg-panel-raised` |
| `panel-hover` | ホバー時の一段明るい面 | `hover:bg-panel-hover` |
| `accent` | ブランドアクセント（旧 `yellow-400` 相当） | `text-accent`, `bg-accent`, `border-accent` |
| `edge` | 標準の黄系枠（約 20%） | `border-edge` |
| `edge-faint` | 弱い枠（約 10%） | `border-edge-faint` |
| `edge-strong` | 強い枠（約 40%） | `border-edge-strong` |
| `edge-muted` | 中間（約 60%、チップ選択など） | `border-edge-muted` |
| `overlay` | モーダル背後（約 80%） | `bg-overlay` |
| `overlay-heavy` | より濃いオーバーレイ（約 85%） | `bg-overlay-heavy` |
| `overlay-light` | やや薄いオーバーレイ（約 70%） | `bg-overlay-light` |
| `overlay-inner` | モーダル内の全画面確認など（約 90%） | `bg-overlay-inner` |
| `message-paper` / `message-ink` | メッセージカードのライトサブテーマ用（ダーク UI とは別レーン） | `bg-message-paper`, `text-message-ink` |
| `video-back` / `video-back-hover` | 動画プレースホルダー内の面 | `bg-video-back`, `group-hover:bg-video-back-hover` |

**ニュートラル**: ダーク UI の補助テキスト・区切りには **`stone-*`** を優先（暖色背景との相性）。用途に応じて `gray-*` は残してよいが、クールな `zinc-*` は新規に増やさない。

**意味色**（成功・警告・借金など）は従来どおり `green-*` / `red-*` 等を使用してよい。

## 半径

| 名前 | 値 | 用途 |
|------|-----|------|
| `rounded-panel`（`--radius-panel`） | 0.375rem | モーダルパネル、大きいカード、セクション内の枠 |
| `rounded-control`（`--radius-control`） | 0.125rem | ボタン、入力、小バッジ |

## レイアウト・余白

- **`section-padding`**（`@utility`）: `px-4 py-12 md:px-8 lg:px-16`。標準セクションの横・縦余白はこれに統一する。
- **ヒーロー**（`HeroSection`）は全画面構成のため、`section-padding` は使わず横方向のみ `px-4 md:px-8 lg:px-16` とする。

## モーダル

- 共通枠は [`components/ModalFrame.tsx`](components/ModalFrame.tsx) を使う。パネルは `@utility modal-panel`（`border-2 border-edge bg-panel rounded-panel`）に相当するクラスが付く。
- `overlayVariant`: `default` | `heavy` | `light` でオーバーレイ濃度を切り替え。
- `maxWidthClass`（例: `max-w-lg`）、`panelClassName`（余白・スクロール・上書き用 `!border-*` など）、`zClass`（重ね順が必要な場合）を渡す。
- 特例（借金モーダルなど）で枠色を赤系に変える場合は、`modal-panel` の `border-edge` を `!border-red-500/40` などで上書きする。

## 埋め込みゲーム HTML

- [`public/games/typing-game.html`](public/games/typing-game.html) と [`public/games/shooting-game.html`](public/games/shooting-game.html) の `:root` は、上記の **背景・アクセント・本文色** と整合させる。
- ルート [`games/typing-game.html`](../games/typing-game.html) を編集したら、`public/games` 側へ同内容をコピーして同期する。

## Storybook

- プレビュー背景は `.storybook/preview.ts` で `#0c0a08`（`background` に一致）。コンポーネント追加時は同背景で見え方を確認するとよい。

## 参照実装

トークン利用の実例は次を参照してください。

- モーダル: `GameModal`, `NameInputModal`, `BorrowModal`, `GachaSection` 内各モーダル
- ヘッダー・フッター: `GlobalHeader`, `FooterCounter`
- セクション: `VideoSection`, `MiniGameSection`, `MessageSection`, `GachaSection`

---

変更履歴は Git で追う前提とし、トークン値を変えた場合は本ファイルの表と [`app/globals.css`](app/globals.css) を揃えて更新してください。
