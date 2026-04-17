-- items テーブルに proposed_by と is_giftable を追加
ALTER TABLE items
  ADD COLUMN proposed_by TEXT,
  ADD COLUMN is_giftable BOOLEAN NOT NULL DEFAULT false;

-- collections テーブルに is_consumed を追加
ALTER TABLE collections
  ADD COLUMN is_consumed BOOLEAN NOT NULL DEFAULT false;
