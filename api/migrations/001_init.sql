-- 001_init.sql
-- アクメ漱石 誕生日Webアプリ 初期スキーマ + シードデータ
-- Supabase ダッシュボードの SQL エディターで実行してください

-- ============================================================
-- テーブル定義
-- ============================================================

-- プレイヤー
CREATE TABLE IF NOT EXISTS players (
    id         SERIAL PRIMARY KEY,
    name       TEXT UNIQUE NOT NULL,
    coins      INTEGER NOT NULL DEFAULT 100,
    debt       INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- メッセージ
CREATE TABLE IF NOT EXISTS messages (
    id         SERIAL PRIMARY KEY,
    author     TEXT NOT NULL,
    text       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- アイテムマスター
CREATE TABLE IF NOT EXISTS items (
    id     SERIAL PRIMARY KEY,
    name   TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('UR','SSR','R','N')),
    icon   TEXT NOT NULL,
    weight INTEGER NOT NULL
);

-- コレクション（プレイヤーとアイテムの多対多）
CREATE TABLE IF NOT EXISTS collections (
    player_name TEXT NOT NULL REFERENCES players(name),
    item_id     INTEGER NOT NULL REFERENCES items(id),
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (player_name, item_id)
);

-- アクセスカウンター（シングルトン）
CREATE TABLE IF NOT EXISTS access_counter (
    id    INTEGER PRIMARY KEY DEFAULT 1,
    count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT single_row CHECK (id = 1)
);

-- ============================================================
-- インデックス
-- ============================================================

-- コレクション取得の高速化
CREATE INDEX IF NOT EXISTS idx_collections_player_name ON collections(player_name);

-- メッセージ作成日降順取得の高速化
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================================
-- シードデータ
-- ============================================================

-- アイテムマスター（重み: UR=1, SSR=4, R=20, N=75）
INSERT INTO items (name, rarity, icon, weight) VALUES
    ('黄金のキーボード', 'UR',  '⌨️', 1),
    ('伝説のメガネ',     'SSR', '🕶️', 4),
    ('謎の領収書',       'R',   '🧾', 20),
    ('徹夜のコーヒー',   'N',   '☕', 75)
ON CONFLICT DO NOTHING;

-- アクセスカウンター初期行
INSERT INTO access_counter (id, count) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
