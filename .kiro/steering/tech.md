# テクノロジースタック

## アーキテクチャ

3層構成：Next.js App Router（フロントエンド）→ Go REST API（バックエンド）→ Supabase PostgreSQL（データ永続化）。
ゲームコンテンツはこれらとは独立したバニラHTMLで管理。

## フロントエンド（`soseki-20th/`）

- **言語**: TypeScript 5
- **フレームワーク**: Next.js 16.2.3（App Router）
- **ランタイム**: React 19.2.4
- **スタイリング**: Tailwind CSS v4
- **アイコン**: lucide-react

## バックエンド（Go API）

- **言語**: Go
- **役割**: メッセージCRUD、ガチャロジック（サーバーサイド抽選）、コイン/借金管理、アクセスカウンター
- **DB**: Supabase（PostgreSQL）
- **ユーザー識別**: 初回訪問時に入力した「名前」をキーとしてコイン・コレクション状態を管理。名前はlocalStorageに保持

## ゲーム（`games/`）

フレームワークなしのバニラHTML/CSS/JS。CDN依存なし、単一ファイルで完結。

## 開発標準

### フロントエンド
- TypeScript strict mode
- ESLint 9 + `eslint-config-next`
- コンポーネントは関数コンポーネント（FC）のみ
- Tailwind クラスはインライン記述

### Next.js 特記事項
`soseki-20th/AGENTS.md` に記載の通り、このNext.jsは学習データと異なる破壊的変更を含む可能性がある。  
**必ず `node_modules/next/dist/docs/` を参照してからコードを書くこと。**

## 開発環境コマンド

```bash
# フロントエンド（soseki-20th/ で実行）
npm run dev    # 開発サーバー
npm run build  # ビルド
npm run lint   # Lint

# バックエンド（Go APIディレクトリで実行）
go run .       # 開発サーバー
go build .     # ビルド
```

## 主要な技術決定

- **App Router採用**: Pages Routerではなく App Router を使用
- **Tailwind v4**: 設定ファイルベースではなくCSS-first設定
- **ゲームの分離**: インタラクティブゲームはNext.jsに組み込まず独立HTML化（デプロイ・デバッグの簡便さ）
- **Goバックエンド**: ガチャ抽選ロジックをサーバーサイドで管理し改ざんを防止
- **Supabase**: マネージドPostgreSQLとしてスキーマ管理・接続を簡略化

---
_標準とパターンをドキュメント化する。全依存関係の列挙は避ける_
