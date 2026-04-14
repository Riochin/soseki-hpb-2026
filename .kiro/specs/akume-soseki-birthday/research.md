# リサーチ & 設計決定ログ

---
**目的**: 技術設計を裏付けるディスカバリーの記録と、design.md に反映した意思決定の根拠を保持する。

---

## サマリー

- **フィーチャー**: `akume-soseki-birthday`
- **ディスカバリー種別**: New Feature / Complex Integration（3層: Next.js + Go + Supabase）
- **主要な発見**:
  1. Go の Supabase クライアントはコミュニティ版 (`supabase-community/supabase-go`) が存在するが、直接 `pgx/v5` を使う方がシンプルで高パフォーマンス。
  2. 小規模 Go API には Chi ルーターが最もイディオマティック（net/http 互換、ゼロ依存）。
  3. Next.js Client Component でのデータ取得は SWR が Vercel 公式推奨。`useEffect + fetch` は非推奨。

---

## リサーチログ

### Go × Supabase 接続方式

- **コンテキスト**: Supabase の PostgreSQL に Go から接続する最良の方法を調査。
- **参照源**:
  - [supabase-community/supabase-go](https://github.com/supabase-community/supabase-go)
  - [pgx/v5 公式](https://github.com/jackc/pgx)
  - Supabase ドキュメント (Client Libraries)
- **発見**:
  - `supabase-community/supabase-go` は REST・Auth・Realtime をカバーする統合クライアント。
  - 今回の用途（純粋な CRUD）には Supabase の REST layer を介す必要がなく、PostgreSQL 接続文字列で `pgx/v5` を直接使う方が高速・シンプル。
  - Supabase は接続情報として `DATABASE_URL`（`postgresql://...`）を提供しており、pgx でそのまま利用可能。
- **インパクト**: バックエンドは `pgx/v5` のみに依存する。`supabase-go` は不使用。

### Go HTTP ルーター選定

- **コンテキスト**: 小規模 REST API に最適なルーターを選定。
- **参照源**: [Go Backend Frameworks 比較 2025-2026](https://encore.dev/articles/best-go-backend-frameworks)
- **発見**:
  - `chi`: net/http 互換・ゼロ依存・ミドルウェア合成が自然。小規模 API に最適。
  - `gin`: バリデーション・バインディング内蔵。今回は過剰。
  - `echo`: gin に近いが若干よりイディオマティック。
  - 結論: **Chi** を選択。
- **インパクト**: `go-chi/chi` と `go-chi/cors` で統一。

### Next.js クライアントコンポーネントのデータ取得

- **コンテキスト**: Go API を呼び出すフロントエンドのデータフェッチパターンを選定。
- **参照源**: [SWR with Next.js](https://swr.vercel.app/docs/with-nextjs), Next.js 16 ドキュメント
- **発見**:
  - `useEffect + fetch` は Next.js 公式・コミュニティともに非推奨。
  - SWR（Vercel 製）は Next.js とゼロコンフィグ統合。キャッシュ・再検証・エラー状態を自動管理。
  - TanStack Query は複数 mutation が絡む複雑なケース向け。今回は SWR で十分。
- **インパクト**: フロントエンドのデータ取得は全て SWR で統一。

### CORS 対応（Go）

- **コンテキスト**: Next.js（localhost:3000）から Go API（localhost:8080）への cross-origin リクエストを許可。
- **参照源**: [rs/cors](https://pkg.go.dev/github.com/rs/cors), [go-chi/cors](https://github.com/go-chi/cors)
- **発見**: `go-chi/cors` が Chi とネイティブに統合でき、推奨設定が明快。
- **インパクト**: CORS ミドルウェアに `go-chi/cors` を採用。

---

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク/制限 | 判定 |
|---|---|---|---|---|
| 3層（Next.js + Go + Supabase） | フロント・API・DB を完全分離 | 明確な責務分離、型安全な API 境界 | デプロイが3系統に増える | **採用** |
| Next.js API Route + Supabase | Next.js の API Routes から直接 Supabase 接続 | 構成がシンプル | ガチャロジックがフロントエンドリポジトリに混入、Go 不使用 | 却下（Go を使いたい要件と不一致） |
| Monolith（Go + Next.js SSR） | Go が HTML を SSR | 単一デプロイ | Next.js の恩恵が失われる | 却下 |

---

## 設計決定

### 決定: データベースクライアント選定

- **コンテキスト**: Supabase への接続方法
- **検討した選択肢**:
  1. `supabase-community/supabase-go` — REST + Auth 統合クライアント
  2. `pgx/v5` — 直接 PostgreSQL ドライバー
- **選択**: `pgx/v5`
- **根拠**: 今回は Auth・Realtime・Storage を使用しない。純粋な SQL CRUD に pgx が最適。パフォーマンスと依存の少なさを優先。
- **トレードオフ**: Supabase の高レベル API（Filter 構文等）が使えないが、SQL で十分に代替可能。
- **フォローアップ**: Supabase の接続プーリングは PgBouncer 経由推奨（ポート 6543）。

### 決定: ユーザー識別方式

- **コンテキスト**: 認証なしでコイン・コレクションを誰のデータか識別する方法
- **検討した選択肢**:
  1. UUID（localStorage に保存）— 匿名だが名前と紐付かない
  2. 名前ベース — 友人サイトらしいパーソナリティ
  3. 完全共有（全員同じプール）— パーティーゲーム的体験
- **選択**: **名前ベース**（ユーザー指定）
- **根拠**: 誕生日サイトとして「誰が何コイン持っているか」が可視化される方が楽しい。認証不要でシンプル。
- **トレードオフ**: 同名ユーザーに注意（同名は同一プレイヤーとして扱う。悪意のある操作は想定しない）。

### 決定: ガチャ抽選ロジックの配置

- **コンテキスト**: ガチャの抽選をフロントエンドかバックエンドか
- **選択**: **Go バックエンド**（サーバーサイド）
- **根拠**: フロントエンドに抽選ロジックを置くとブラウザデバッグで改ざんが容易。コイン消費と抽選をアトミックに処理する必要がある。
- **トレードオフ**: API ラウンドトリップが 1 回増えるが、体験上問題ない。

---

## リスクと緩和策

- **同名ユーザーの衝突**: 同名で入力した場合、同一プレイヤーとして扱われる。緩和: players テーブルに `UNIQUE(name)` を設定し、初回は INSERT、以後は SELECT のみ。
- **Supabase 接続数制限**: 無料プランは接続数が少ない。緩和: `pgxpool` でコネクションプールを利用（最大 5 接続程度）。
- **デプロイ分離**: Next.js と Go API を別々にデプロイする必要がある。緩和: Go API を Fly.io・Railway 等に、Next.js を Vercel にデプロイ。環境変数で API URL を管理。

---

## 参照

- [pgx/v5](https://github.com/jackc/pgx) — Go の PostgreSQL ドライバー
- [go-chi/chi](https://github.com/go-chi/chi) — Chi ルーター
- [go-chi/cors](https://github.com/go-chi/cors) — Chi 用 CORS ミドルウェア
- [SWR](https://swr.vercel.app/) — Next.js 推奨データフェッチライブラリ
- [supabase-community/supabase-go](https://github.com/supabase-community/supabase-go) — 参考（今回は不使用）
