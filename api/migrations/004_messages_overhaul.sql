-- 004_messages_overhaul.sql
-- 寄せ書きカスタマイズ対応: messages テーブルにカラムを追加
-- Supabase ダッシュボードの SQL エディター、または psql から実行してください

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS bg_color TEXT NOT NULL DEFAULT 'white'
    CHECK (bg_color IN ('white', 'beige', 'purple')),
  ADD COLUMN IF NOT EXISTS bg_style TEXT NOT NULL DEFAULT 'normal'
    CHECK (bg_style IN ('normal', 'line', 'grid')),
  ADD COLUMN IF NOT EXISTS font TEXT NOT NULL DEFAULT 'noto-sans'
    CHECK (font IN ('noto-sans', 'tanuki', 'fude-ji', 'fude')),
  ADD COLUMN IF NOT EXISTS stamp TEXT
    CHECK (stamp IN (
      'dio', 'joseph', 'jotaro', 'kakyoin', 'DIO',
      'josuke', 'rohan', 'bucciarati', 'giorno',
      'diavolo', 'jolyne', 'anasui'
    ));

COMMENT ON COLUMN messages.username IS 'Supabase auth のユーザー名（将来の認証連携用）';
COMMENT ON COLUMN messages.bg_color IS 'カード背景色: white / beige / purple';
COMMENT ON COLUMN messages.bg_style IS 'カード背景スタイル: normal / line / grid';
COMMENT ON COLUMN messages.font    IS 'カードフォント: noto-sans / tanuki / fude-ji / fude';
COMMENT ON COLUMN messages.stamp   IS '選択したジョジョキャラのスタンプ識別子（nullable）';
