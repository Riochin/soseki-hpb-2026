-- 005_debt_log.sql
-- トイチ借金システム: 借金ログテーブル + 自動利息適用関数

-- ============================================================
-- テーブル定義
-- ============================================================

CREATE TABLE IF NOT EXISTS debt_logs (
    id          BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL REFERENCES players(name),
    event_type  TEXT NOT NULL CHECK (event_type IN ('borrow', 'interest', 'repay')),
    amount      INTEGER NOT NULL,
    debt_before INTEGER NOT NULL,
    debt_after  INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_logs_player ON debt_logs (player_name, created_at DESC);

-- ============================================================
-- トイチ利息適用関数
-- debt > 0 の全プレイヤーに10%利息（切り上げ）を適用し、ログを記録する
-- ============================================================

CREATE OR REPLACE FUNCTION apply_toichi_interest() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    rec      RECORD;
    interest INTEGER;
    new_debt INTEGER;
BEGIN
    FOR rec IN SELECT name, debt FROM players WHERE debt > 0 LOOP
        interest := CEIL(rec.debt::numeric * 0.1)::INTEGER;
        new_debt := rec.debt + interest;

        UPDATE players SET debt = new_debt WHERE name = rec.name;

        INSERT INTO debt_logs (player_name, event_type, amount, debt_before, debt_after)
        VALUES (rec.name, 'interest', interest, rec.debt, new_debt);
    END LOOP;
END;
$$;

-- ============================================================
-- pg_cron スケジュール登録（手動実行）
--
-- 事前に Supabase Dashboard > Database > Extensions で pg_cron を有効化してから
-- Supabase SQL Editor で以下を実行：
--
--   SELECT cron.schedule('toichi-interest', '0 0 */10 * *', 'SELECT apply_toichi_interest()');
--
-- ※ '0 0 */10 * *' = 毎月 1日・11日・21日・31日 の 00:00 UTC に実行
-- 登録確認: SELECT * FROM cron.job;
-- 削除:     SELECT cron.unschedule('toichi-interest');
-- ============================================================
