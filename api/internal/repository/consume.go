package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/db"
)

// ConsumeStore はアイテム引き換え操作を定義するインターフェース。
type ConsumeStore interface {
	ConsumeItem(ctx context.Context, playerName string, itemID int) error
}

// DBConsumeStore は pgxpool を使った ConsumeStore の実装。
type DBConsumeStore struct {
	db *db.DB
}

// NewDBConsumeStore は DBConsumeStore を生成して返す。
func NewDBConsumeStore(database *db.DB) *DBConsumeStore {
	return &DBConsumeStore{db: database}
}

func (s *DBConsumeStore) ConsumeItem(ctx context.Context, playerName string, itemID int) error {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var isGiftable bool
	err = tx.QueryRow(ctx,
		`SELECT is_giftable FROM items WHERE id = $1`,
		itemID,
	).Scan(&isGiftable)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.ErrNotFound
	}
	if err != nil {
		return err
	}
	if !isGiftable {
		return apperr.ErrNotGiftable
	}

	var isConsumed bool
	err = tx.QueryRow(ctx,
		`SELECT is_consumed FROM collections WHERE player_name = $1 AND item_id = $2`,
		playerName, itemID,
	).Scan(&isConsumed)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.ErrNotFound
	}
	if err != nil {
		return err
	}
	if isConsumed {
		return apperr.ErrAlreadyConsumed
	}

	if _, err := tx.Exec(ctx,
		`UPDATE collections SET is_consumed = true WHERE player_name = $1 AND item_id = $2`,
		playerName, itemID,
	); err != nil {
		return err
	}

	return tx.Commit(ctx)
}
