package repository

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/db"
	"github.com/soseki-hpb-2026/api/internal/model"
	"github.com/soseki-hpb-2026/api/internal/service/gacha"
)

// GachaResult はガチャ実行結果を表す。
type GachaResult struct {
	Item     model.CollectionItem `json:"item"`
	IsNew    bool                 `json:"isNew"`
	NewCoins int                  `json:"newCoins"`
}

// MultiGachaResult は10連ガチャ実行結果を表す。
type MultiGachaResult struct {
	Results  []GachaResult `json:"results"`
	NewCoins int           `json:"newCoins"`
}

// GachaStore はガチャの永続化操作を定義するインターフェース。
type GachaStore interface {
	ExecuteGacha(ctx context.Context, playerName string) (GachaResult, error)
	ExecuteMultiGacha(ctx context.Context, playerName string) (MultiGachaResult, error)
}

// DBGachaStore は pgxpool を使った GachaStore の実装。
type DBGachaStore struct {
	db *db.DB
}

// NewDBGachaStore は DBGachaStore を生成して返す。
func NewDBGachaStore(database *db.DB) *DBGachaStore {
	return &DBGachaStore{db: database}
}

func (s *DBGachaStore) ExecuteGacha(ctx context.Context, playerName string) (GachaResult, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return GachaResult{}, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var coins int
	err = tx.QueryRow(ctx,
		`SELECT coins FROM players WHERE name = $1 FOR UPDATE`,
		playerName,
	).Scan(&coins)
	if errors.Is(err, pgx.ErrNoRows) {
		return GachaResult{}, apperr.ErrNotFound
	}
	if err != nil {
		return GachaResult{}, err
	}

	if coins < 100 {
		return GachaResult{}, apperr.ErrInsufficientCoins
	}

	var newCoins int
	if err := tx.QueryRow(ctx,
		`UPDATE players SET coins = coins - 100 WHERE name = $1 RETURNING coins`,
		playerName,
	).Scan(&newCoins); err != nil {
		return GachaResult{}, err
	}

	rows, err := tx.Query(ctx,
		`SELECT id, name, rarity, icon, weight, proposed_by, is_giftable FROM items WHERE weight > 0`,
	)
	if err != nil {
		return GachaResult{}, err
	}
	var items []model.Item
	for rows.Next() {
		var item model.Item
		if err := rows.Scan(&item.ID, &item.Name, &item.Rarity, &item.Icon, &item.Weight, &item.ProposedBy, &item.IsGiftable); err != nil {
			rows.Close()
			return GachaResult{}, err
		}
		items = append(items, item)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return GachaResult{}, err
	}
	if len(items) == 0 {
		return GachaResult{}, fmt.Errorf("no items available for gacha")
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	selected := gacha.SelectWeightedItem(items, rng)

	tag, err := tx.Exec(ctx,
		`INSERT INTO collections (player_name, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		playerName, selected.ID,
	)
	if err != nil {
		return GachaResult{}, err
	}
	isNew := tag.RowsAffected() > 0

	if err := tx.Commit(ctx); err != nil {
		return GachaResult{}, err
	}

	return GachaResult{
		Item: model.CollectionItem{
			ItemID:     selected.ID,
			Name:       selected.Name,
			Rarity:     selected.Rarity,
			Icon:       selected.Icon,
			Acquired:   true,
			IsGiftable: selected.IsGiftable,
			ProposedBy: selected.ProposedBy,
			IsConsumed: false,
		},
		IsNew:    isNew,
		NewCoins: newCoins,
	}, nil
}

func (s *DBGachaStore) ExecuteMultiGacha(ctx context.Context, playerName string) (MultiGachaResult, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return MultiGachaResult{}, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var coins int
	err = tx.QueryRow(ctx,
		`SELECT coins FROM players WHERE name = $1 FOR UPDATE`,
		playerName,
	).Scan(&coins)
	if errors.Is(err, pgx.ErrNoRows) {
		return MultiGachaResult{}, apperr.ErrNotFound
	}
	if err != nil {
		return MultiGachaResult{}, err
	}

	if coins < 1000 {
		return MultiGachaResult{}, apperr.ErrInsufficientCoins
	}

	var newCoins int
	if err := tx.QueryRow(ctx,
		`UPDATE players SET coins = coins - 1000 WHERE name = $1 RETURNING coins`,
		playerName,
	).Scan(&newCoins); err != nil {
		return MultiGachaResult{}, err
	}

	rows, err := tx.Query(ctx,
		`SELECT id, name, rarity, icon, weight, proposed_by, is_giftable FROM items WHERE weight > 0`,
	)
	if err != nil {
		return MultiGachaResult{}, err
	}
	var items []model.Item
	for rows.Next() {
		var item model.Item
		if err := rows.Scan(&item.ID, &item.Name, &item.Rarity, &item.Icon, &item.Weight, &item.ProposedBy, &item.IsGiftable); err != nil {
			rows.Close()
			return MultiGachaResult{}, err
		}
		items = append(items, item)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return MultiGachaResult{}, err
	}
	if len(items) == 0 {
		return MultiGachaResult{}, fmt.Errorf("no items available for gacha")
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	var highRarityItems []model.Item
	for _, item := range items {
		if item.Rarity == "UR" || item.Rarity == "SSR" {
			highRarityItems = append(highRarityItems, item)
		}
	}

	results := make([]GachaResult, 0, 10)
	for i := 0; i < 10; i++ {
		var selected model.Item
		if i == 9 && len(highRarityItems) > 0 {
			selected = gacha.SelectWeightedItem(highRarityItems, rng)
		} else {
			selected = gacha.SelectWeightedItem(items, rng)
		}

		tag, err := tx.Exec(ctx,
			`INSERT INTO collections (player_name, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			playerName, selected.ID,
		)
		if err != nil {
			return MultiGachaResult{}, err
		}
		isNew := tag.RowsAffected() > 0

		results = append(results, GachaResult{
			Item: model.CollectionItem{
				ItemID:     selected.ID,
				Name:       selected.Name,
				Rarity:     selected.Rarity,
				Icon:       selected.Icon,
				Acquired:   true,
				IsGiftable: selected.IsGiftable,
				ProposedBy: selected.ProposedBy,
				IsConsumed: false,
			},
			IsNew:    isNew,
			NewCoins: newCoins,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return MultiGachaResult{}, err
	}

	return MultiGachaResult{
		Results:  results,
		NewCoins: newCoins,
	}, nil
}
