-- 003_game_result.sql
-- ミニゲーム結果の永続化とランキング用
-- Supabase ダッシュボードの SQL エディターで実行してください
-- RLS: 本アプリは Go API が DB に直接接続するため anon 用ポリシーは不要

CREATE TABLE IF NOT EXISTS game_result (
    id           BIGSERIAL PRIMARY KEY,
    player_name  TEXT NOT NULL REFERENCES players(name) ON DELETE CASCADE,
    game_type    TEXT NOT NULL,
    session_id   TEXT NOT NULL UNIQUE,
    rank         TEXT NOT NULL,
    time_limit   INTEGER,
    score        INTEGER NOT NULL,
    coins_earned INTEGER NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_result_leaderboard
    ON game_result (game_type, score DESC, created_at ASC);
