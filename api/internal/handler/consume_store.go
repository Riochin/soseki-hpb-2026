package handler

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/soseki-hpb-2026/api/internal/db"
)

// DBConsumeStore は pgxpool を使った ConsumeStore の実装。
type DBConsumeStore struct {
	db *db.DB
}

// NewDBConsumeStore は DBConsumeStore を生成して返す。
func NewDBConsumeStore(database *db.DB) *DBConsumeStore {
	return &DBConsumeStore{db: database}
}

// ConsumeItem はアイテムを引き換え済みにマークする。
// - アイテムが is_giftable=false → ErrNotGiftable
// - コレクションに存在しない → ErrNotFound
// - すでに is_consumed=true → ErrAlreadyConsumed
func (s *DBConsumeStore) ConsumeItem(ctx context.Context, playerName string, itemID int) error {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// アイテムの is_giftable を確認
	var isGiftable bool
	err = tx.QueryRow(ctx,
		`SELECT is_giftable FROM items WHERE id = $1`,
		itemID,
	).Scan(&isGiftable)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if !isGiftable {
		return ErrNotGiftable
	}

	// プレイヤーがこのアイテムを所持しているか、消費済みかを確認
	var isConsumed bool
	err = tx.QueryRow(ctx,
		`SELECT is_consumed FROM collections WHERE player_name = $1 AND item_id = $2`,
		playerName, itemID,
	).Scan(&isConsumed)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if isConsumed {
		return ErrAlreadyConsumed
	}

	// 引き換え済みにする
	if _, err := tx.Exec(ctx,
		`UPDATE collections SET is_consumed = true WHERE player_name = $1 AND item_id = $2`,
		playerName, itemID,
	); err != nil {
		return err
	}

	return tx.Commit(ctx)
}
