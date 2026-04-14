# 実装タスク: アクメ漱石 誕生日Webアプリ

## タスクリスト

- [ ] 1. Foundation: データベース・Go API・フロントエンドの基盤整備
- [x] 1.1 Supabase スキーマとシードデータを作成する
  - `api/migrations/001_init.sql` に players・messages・items・collections・access_counter テーブルを定義する
  - items テーブルに初期アイテム（伝説のメガネ SSR・徹夜のコーヒー N・黄金のキーボード UR・謎の領収書 R）をシードデータとして INSERT する
  - access_counter に id=1 の初期行を INSERT する
  - Supabase ダッシュボードで SQL を実行してスキーマが正常に作成されること
  - _Requirements: 9.5_

- [x] 1.2 Go API プロジェクトを初期化し、DB 接続・ルーター・CORS を動かす
  - `api/` ディレクトリに `go.mod`（`github.com/go-chi/chi/v5`・`github.com/go-chi/cors`・`github.com/jackc/pgx/v5`）を作成する
  - `api/internal/db/db.go` に pgxpool の初期化と Close 関数を実装し、`DATABASE_URL` 環境変数から接続する
  - `api/cmd/server/main.go` に Chi ルーター・CORS ミドルウェア・ヘルスチェックエンドポイント（`GET /health`）を実装する
  - Supabase 接続失敗時に起動でフェイルファスト、リクエスト時に 503 を返すエラーハンドリングを実装する
  - `go run ./cmd/server` で起動し `GET /health` が 200 を返すこと
  - _Requirements: 9.5, 9.6, 9.7_

- [x] 1.3 Next.js フロントエンドの API 連携基盤を整備する
  - `soseki-20th/lib/api.ts` に API ベース URL（環境変数 `NEXT_PUBLIC_API_URL`）と SWR 用の汎用 fetcher 関数を定義する
  - SWR パッケージ（`swr`）を `soseki-20th/` に追加する
  - `soseki-20th/.env.local.example` に `NEXT_PUBLIC_API_URL=http://localhost:8080` を記載する
  - `npm run dev` でビルドエラーがなく起動すること
  - _Requirements: 8.1, 8.3_

---

- [ ] 2. Go API コアハンドラー実装
- [x] 2.1 (P) メッセージ CRUD ハンドラーを実装する
  - `api/internal/model/message.go` に `Message` 型（id・author・text・createdAt）を定義する
  - `api/internal/handler/messages.go` に `GET /api/messages`（全件取得・作成日降順）と `POST /api/messages`（新規投稿、author/text 空文字は 400）を実装する
  - ルーターにエンドポイントを登録する
  - `curl POST /api/messages` でメッセージが保存され、続く `GET /api/messages` で取得できること
  - _Requirements: 9.1, 4.1, 4.5_
  - _Boundary: messages Handler_

- [ ] 2.2 (P) プレイヤー管理ハンドラー（取得・作成・借金）を実装する
  - `api/internal/model/player.go` に `Player`（name・coins・debt）と `CollectionItem` 型を定義する
  - `api/internal/handler/players.go` に `POST /api/players`（upsert: 初回は coins=100 で INSERT、既存は SELECT）と `GET /api/players/:name` を実装する
  - `api/internal/handler/borrow.go` に `POST /api/players/:name/borrow`（coins+100・debt+100）を実装する
  - 名前をキーとする一意制約（`ON CONFLICT DO NOTHING`）により、同名なら既存プレイヤーデータを返すこと
  - _Requirements: 9.3, 9.8, 6.1, 6.5_
  - _Boundary: players Handler, borrow Handler_

- [ ] 2.3 (P) ガチャハンドラーを実装する
  - `api/internal/model/item.go` に `Item` 型（id・name・rarity・icon・weight）を定義する
  - `api/internal/handler/gacha.go` に `POST /api/gacha`（player_name を受け取り coins-100・重み付き抽選・collections INSERT をトランザクション内で実行）を実装する
  - coins < 100 の場合は 402 を返す
  - `GachaResult`（item・isNew・newCoins）を JSON で返す
  - ガチャ実行後に coins が 100 減り、items テーブルの重みに従ったアイテムが返却されること
  - _Requirements: 9.2, 6.3, 6.4_
  - _Boundary: gacha Handler_

- [ ] 2.4 (P) アクセスカウンターハンドラーを実装する
  - `api/internal/handler/counter.go` に `POST /api/counter`（`UPDATE access_counter SET count = count + 1 RETURNING count` でアトミック更新）を実装する
  - `{ "count": N }` を返す
  - 複数同時リクエストでカウントが正確にインクリメントされること
  - _Requirements: 9.4, 7.1_
  - _Boundary: counter Handler_

---

- [ ] 3. フロントエンド コアコンポーネント実装
- [ ] 3.1 (P) 年齢確認ゲートと名前入力モーダルを実装する
  - `soseki-20th/app/globals.css` に `@keyframes glitch`（色反転＋位置ズレ）と `@keyframes ticker`（横スクロール）を定義する
  - `AgeVerificationGate` コンポーネントを実装する。sessionStorage の `age_verified` フラグで再訪時をスキップし、「はい」クリックで 0.8 秒グリッチ演出後にメインを表示する
  - `NameInputModal` コンポーネントを実装する。localStorage の `playerName` 存在時はスキップし、入力した名前で `POST /api/players` を呼んでプレイヤー状態を初期化する
  - 初回訪問で年齢確認 → 名前入力 → メインコンテンツの順に画面が遷移すること
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1_
  - _Boundary: AgeVerificationGate, NameInputModal_

- [ ] 3.2 (P) グローバルヘッダーとニュースティッカーを実装する
  - `GlobalHeader` コンポーネントを実装する。`coins`・`debt` を props で受け取り、コインアイコン付きで残高表示、debt > 0 の場合のみ赤色警告を表示する
  - ティッカーは静的テキスト（祝福メッセージ・警告文）を `globals.css` の `animate-ticker` で無限横スクロールさせる
  - スティッキーヘッダーが全セクションをスクロール中も画面上部に固定されること
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - _Boundary: GlobalHeader_

- [ ] 3.3 (P) ヒーローセクションを実装する
  - `HeroSection` コンポーネントを実装する。日付・大見出し（黄色グラデーション）・動画プレースホルダー（16:9、ホバーエフェクト付き）・引用文カード（左黄色ボーダー）を表示する
  - モックアップ（`geminimockup.tsx`）の該当セクションのレイアウトと配色を踏襲する
  - ページ上部にヒーローコンテンツが正しく表示され、動画プレースホルダーにホバーで暗さが軽減すること
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.1, 8.2_
  - _Boundary: HeroSection_

- [ ] 3.4 (P) メッセージセクション（一覧表示・投稿フォーム）を実装する
  - `soseki-20th/hooks/useMessages.ts` に SWR を使った `GET /api/messages` 取得フックと `postMessage` ミューテーション関数を実装する
  - `MessageSection` コンポーネントを実装する。横スクロールカード一覧、末尾の「+ メッセージを書く」カード、投稿フォーム（名前・本文・送信ボタン）を含む
  - 本文空欄でのクライアントバリデーション、API エラー時のエラーメッセージ表示、送信成功後のオプティミスティック更新を実装する
  - 投稿後に新しいカードが一覧末尾（追加ボタンの前）に即座に表示されること
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.4_
  - _Boundary: MessageSection, useMessages_

- [ ] 3.5 (P) ガチャ＆コレクションセクションを実装する
  - `soseki-20th/hooks/usePlayer.ts` に SWR を使ったプレイヤー状態取得フックと `spinGacha`・`borrowCoins` 関数を実装する
  - `GachaSection` コンポーネントを実装する。ガチャボタン（100C）・借金ボタン・コレクション 2 列グリッドを表示する
  - 未入手アイテムのグレースケール＆鍵アイコン表示、コイン不足時の拒否メッセージ、ガチャ演出（ボタン非活性＋結果表示）を実装する
  - ガチャ実行後にコインが 100 減り、獲得アイテムのロックが解除されてコレクションが更新されること
  - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  - _Boundary: GachaSection, usePlayer_

- [ ] 3.6 (P) ミニゲームセクションを実装する
  - `MiniGameSection` コンポーネントを実装する。「漱石タイピング」カード（+100 Coins バッジ・PLAY NOW ボタン）を表示する
  - PLAY NOW クリックで `games/typing-game.html` への相対リンクが機能すること（`target="_blank"` またはルーター遷移）
  - ゲームカードが正しく表示され PLAY NOW でゲームに遷移できること
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - _Boundary: MiniGameSection_

- [ ] 3.7 (P) アクセスカウンターフッターを実装する
  - `soseki-20th/hooks/useCounter.ts` に `POST /api/counter` を呼ぶ SWR mutate フックを実装する（ページ表示時に 1 回インクリメント）
  - `FooterCounter` コンポーネントを実装する。6 桁のデジタルカウンター表示（ゼロ埋め）と著作権表記を含む
  - カウント値が 777 の倍数のとき「★☆ LUCKY NUMBER! ☆★」を `animate-pulse` 付きで表示する
  - ページ表示時にカウンターが増加し、777 の倍数でラッキー演出が表示されること
  - _Requirements: 7.1, 7.2, 7.3_
  - _Boundary: FooterCounter, useCounter_

---

- [ ] 4. Integration: ページ組み立てとコイン状態共有
- [ ] 4.1 page.tsx に全コンポーネントを統合し、コイン・借金状態を共有する
  - `soseki-20th/app/page.tsx` を更新し、AgeVerificationGate → NameInputModal → GlobalHeader + 全セクション（Hero・Messages・MiniGame・Gacha・Footer）の順に組み立てる
  - `usePlayer` から取得した `coins`・`debt` を GlobalHeader と GachaSection に渡し、ガチャ・借金操作が即座にヘッダーの残高表示に反映されるよう状態を共有する
  - `soseki-20th/app/layout.tsx` のメタデータを「SOSEKI 20th | Happy Birthday!」に更新する
  - ページ全体が geminimockup.tsx のレイアウト・配色に準拠した状態でエラーなく表示され、ガチャ後にヘッダーのコイン残高が即時更新されること
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 2.3, 2.4_
  - _Depends: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

---

- [ ] 5. Validation: 統合・E2E テスト
- [ ] 5.1 Go API の統合テストを実装する
  - `api/` にテストファイルを作成し、`POST /api/gacha` のトランザクション整合性テスト（コイン消費・コレクション追加のアトミック性）を実装する
  - `POST /api/messages` → `GET /api/messages` の往復テストを実装する
  - `POST /api/players`（新規・既存の upsert 動作）の確認テストを実装する
  - テストスイートがすべてパスし、ガチャのコイン消費とコレクション更新が常にアトミックであること
  - _Requirements: 9.1, 9.2, 9.3, 9.5_
  - _Depends: 2.1, 2.2, 2.3_

- [ ] * 5.2 フロントエンドの E2E テストを実装する
  - 初回訪問フロー（年齢確認 → 名前入力 → コンテンツ表示）の E2E テストを実装する
  - メッセージ投稿フロー（フォーム入力 → 送信 → 一覧更新）の E2E テストを実装する
  - ガチャフロー（コイン消費 → 演出 → コレクション反映）の E2E テストを実装する
  - E2E テストがすべてパスすること
  - _Requirements: 1.1, 1.3, 4.5, 6.3_
  - _Depends: 4.1_
