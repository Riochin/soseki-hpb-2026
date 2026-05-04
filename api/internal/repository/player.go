package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/db"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// PlayerStore はプレイヤーの永続化操作を定義するインターフェース。
type PlayerStore interface {
	UpsertPlayer(ctx context.Context, name string) (model.Player, error)
	GetPlayer(ctx context.Context, name string) (model.Player, error)
	BorrowCoins(ctx context.Context, name string, amount int) (coins, debt int, err error)
	EarnCoins(ctx context.Context, name string, amount int) (newCoins int, err error)
}

// DBPlayerStore は pgxpool を使った PlayerStore の実装。
type DBPlayerStore struct {
	db *db.DB
}

// NewDBPlayerStore は DBPlayerStore を生成して返す。
func NewDBPlayerStore(database *db.DB) *DBPlayerStore {
	return &DBPlayerStore{db: database}
}

func (s *DBPlayerStore) UpsertPlayer(ctx context.Context, name string) (model.Player, error) {
	_, err := s.db.Pool.Exec(ctx,
		`INSERT INTO players (name, coins, debt) VALUES ($1, 1000, 0) ON CONFLICT (name) DO NOTHING`,
		name,
	)
	if err != nil {
		return model.Player{}, err
	}
	return s.GetPlayer(ctx, name)
}

func (s *DBPlayerStore) GetPlayer(ctx context.Context, name string) (model.Player, error) {
	var p model.Player
	err := s.db.Pool.QueryRow(ctx,
		`SELECT name, coins, debt FROM players WHERE name = $1`,
		name,
	).Scan(&p.Name, &p.Coins, &p.Debt)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Player{}, apperr.ErrNotFound
	}
	if err != nil {
		return model.Player{}, err
	}

	rows, err := s.db.Pool.Query(ctx, `
		SELECT i.id, i.name, i.rarity, i.icon,
		       (c.player_name IS NOT NULL) AS acquired,
		       i.is_giftable,
		       i.proposed_by,
		       COALESCE(c.is_consumed, false) AS is_consumed
		FROM items i
		LEFT JOIN collections c ON c.item_id = i.id AND c.player_name = $1
		ORDER BY i.id
	`, name)
	if err != nil {
		return model.Player{}, err
	}
	defer rows.Close()

	p.Collection = []model.CollectionItem{}
	for rows.Next() {
		var item model.CollectionItem
		if err := rows.Scan(&item.ItemID, &item.Name, &item.Rarity, &item.Icon, &item.Acquired, &item.IsGiftable, &item.ProposedBy, &item.IsConsumed); err != nil {
			return model.Player{}, err
		}
		p.Collection = append(p.Collection, item)
	}
	if err := rows.Err(); err != nil {
		return model.Player{}, err
	}

	return p, nil
}

func (s *DBPlayerStore) BorrowCoins(ctx context.Context, name string, amount int) (coins, debt int, err error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var debtBefore int
	err = tx.QueryRow(ctx, `SELECT debt FROM players WHERE name = $1`, name).Scan(&debtBefore)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, 0, apperr.ErrNotFound
	}
	if err != nil {
		return 0, 0, err
	}

	err = tx.QueryRow(ctx,
		`UPDATE players SET coins = coins + $2*100, debt = debt + $2*100 WHERE name = $1 RETURNING coins, debt`,
		name, amount,
	).Scan(&coins, &debt)
	if err != nil {
		return 0, 0, err
	}

	borrowAmount := amount * 100
	_, err = tx.Exec(ctx,
		`INSERT INTO debt_logs (player_name, event_type, amount, debt_before, debt_after) VALUES ($1, 'borrow', $2, $3, $4)`,
		name, borrowAmount, debtBefore, debt,
	)
	if err != nil {
		return 0, 0, err
	}

	return coins, debt, tx.Commit(ctx)
}

func (s *DBPlayerStore) EarnCoins(ctx context.Context, name string, amount int) (int, error) {
	var newCoins int
	err := s.db.Pool.QueryRow(ctx,
		`UPDATE players SET coins = coins + $2 WHERE name = $1 RETURNING coins`,
		name, amount,
	).Scan(&newCoins)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, apperr.ErrNotFound
	}
	return newCoins, err
}
