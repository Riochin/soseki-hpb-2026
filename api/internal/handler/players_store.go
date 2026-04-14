package handler

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/soseki-hpb-2026/api/internal/db"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// DBPlayerStore は pgxpool を使った PlayerStore の実装。
type DBPlayerStore struct {
	db *db.DB
}

// NewDBPlayerStore は DBPlayerStore を生成して返す。
func NewDBPlayerStore(database *db.DB) *DBPlayerStore {
	return &DBPlayerStore{db: database}
}

// UpsertPlayer は初回訪問時に players に INSERT（coins=100）し、
// 既存プレイヤーは SELECT で返す（ON CONFLICT DO NOTHING）。
func (s *DBPlayerStore) UpsertPlayer(ctx context.Context, name string) (model.Player, error) {
	// 存在しなければ挿入（既存行はそのまま）
	_, err := s.db.Pool.Exec(ctx,
		`INSERT INTO players (name, coins, debt) VALUES ($1, 100, 0) ON CONFLICT (name) DO NOTHING`,
		name,
	)
	if err != nil {
		return model.Player{}, err
	}
	return s.GetPlayer(ctx, name)
}

// GetPlayer は name をキーにプレイヤーとコレクション一覧を取得する。
// プレイヤーが存在しない場合は ErrNotFound を返す。
func (s *DBPlayerStore) GetPlayer(ctx context.Context, name string) (model.Player, error) {
	var p model.Player
	err := s.db.Pool.QueryRow(ctx,
		`SELECT name, coins, debt FROM players WHERE name = $1`,
		name,
	).Scan(&p.Name, &p.Coins, &p.Debt)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Player{}, ErrNotFound
	}
	if err != nil {
		return model.Player{}, err
	}

	// 全アイテムと取得状態を JOIN で取得
	rows, err := s.db.Pool.Query(ctx, `
		SELECT i.id, i.name, i.rarity, i.icon,
		       (c.player_name IS NOT NULL) AS acquired
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
		if err := rows.Scan(&item.ItemID, &item.Name, &item.Rarity, &item.Icon, &item.Acquired); err != nil {
			return model.Player{}, err
		}
		p.Collection = append(p.Collection, item)
	}
	if err := rows.Err(); err != nil {
		return model.Player{}, err
	}

	return p, nil
}

// BorrowCoins は coins+100・debt+100 を更新して最新値を返す。
// プレイヤーが存在しない場合は ErrNotFound を返す。
func (s *DBPlayerStore) BorrowCoins(ctx context.Context, name string) (coins, debt int, err error) {
	err = s.db.Pool.QueryRow(ctx,
		`UPDATE players SET coins = coins + 100, debt = debt + 100 WHERE name = $1 RETURNING coins, debt`,
		name,
	).Scan(&coins, &debt)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, 0, ErrNotFound
	}
	return coins, debt, err
}
