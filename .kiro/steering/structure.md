# プロジェクト構造

## 構成方針

ルートはモノレポ風の2エリア構成。メインWebアプリとスタンドアロンゲームを明確に分離。

## ディレクトリパターン

### メインサイト
**場所**: `soseki-20th/`  
**目的**: Next.js App Routerベースの誕生日サイト本体  
**例**: `soseki-20th/app/page.tsx` がトップページ

### ゲームコンテンツ
**場所**: `games/`  
**目的**: 独立したミニゲーム群（単一HTMLファイル）  
**例**: `games/typing-game.html` — 夏目漱石名言タイピングゲーム

### アプリルーティング
**場所**: `soseki-20th/app/`  
**目的**: Next.js App Routerのページ・レイアウト  
**パターン**: `app/[route]/page.tsx`、共通レイアウトは `app/layout.tsx`

## 命名規則

- **コンポーネントファイル**: PascalCase（例: `HeroSection.tsx`）
- **ページ**: `page.tsx`（App Router規約）
- **ゲームファイル**: kebab-case（例: `typing-game.html`）
- **Tailwindクラス**: インラインでJSX内に直接記述

## インポートパターン

```typescript
// Nextjs組み込み
import Image from "next/image";
import type { Metadata } from "next";

// 外部ライブラリ
import { Play, Gamepad2 } from 'lucide-react';

// ローカル（相対パス）
import "./globals.css";
```

パスエイリアスは現時点で未設定（デフォルトNext.js設定）。

## コード構成の原則

- UIロジックとデータは同一コンポーネントファイルにまとめる（小規模プロジェクトのため）
- モックアップファイル（`geminimockup.tsx`）は参考用として `soseki-20th/` 直下に配置
- ゲームはNext.jsとは独立。CSSカスタムプロパティ（`--accent: #f5c400`等）でデザイントークンを管理

---
_パターンをドキュメント化する。ファイルツリーの列挙は避ける。パターンに従う新ファイルはステアリング更新不要_
