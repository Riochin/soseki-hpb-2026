package handler

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/soseki-hpb-2026/api/internal/db"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// DBGachaStore は pgxpool を使った GachaStore の実装。
type DBGachaStore struct {
	db *db.DB
}

// NewDBGachaStore は DBGachaStore を生成して返す。
func NewDBGachaStore(database *db.DB) *DBGachaStore {
	return &DBGachaStore{db: database}
}

// ExecuteGacha はコイン消費・重み付き抽選・コレクション追加をトランザクション内で実行する。
// - coins < 100 → ErrInsufficientCoins
// - プレイヤー不在 → ErrNotFound
func (s *DBGachaStore) ExecuteGacha(ctx context.Context, playerName string) (GachaResult, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return GachaResult{}, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// プレイヤーをロック付きで取得
	var coins int
	err = tx.QueryRow(ctx,
		`SELECT coins FROM players WHERE name = $1 FOR UPDATE`,
		playerName,
	).Scan(&coins)
	if errors.Is(err, pgx.ErrNoRows) {
		return GachaResult{}, ErrNotFound
	}
	if err != nil {
		return GachaResult{}, err
	}

	if coins < 100 {
		return GachaResult{}, ErrInsufficientCoins
	}

	// コイン消費
	var newCoins int
	if err := tx.QueryRow(ctx,
		`UPDATE players SET coins = coins - 100 WHERE name = $1 RETURNING coins`,
		playerName,
	).Scan(&newCoins); err != nil {
		return GachaResult{}, err
	}

	// アイテム一覧取得（重み付き抽選用）
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

	// 重み付きランダム抽選
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	selected := SelectWeightedItem(items, rng)

	// コレクションに追加（重複は ON CONFLICT DO NOTHING で無視）
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

// ExecuteMultiGacha は1000コイン消費・10回抽選・コレクション追加をトランザクション内で実行する。
// - coins < 1000 → ErrInsufficientCoins
// - プレイヤー不在 → ErrNotFound
func (s *DBGachaStore) ExecuteMultiGacha(ctx context.Context, playerName string) (MultiGachaResult, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return MultiGachaResult{}, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// プレイヤーをロック付きで取得
	var coins int
	err = tx.QueryRow(ctx,
		`SELECT coins FROM players WHERE name = $1 FOR UPDATE`,
		playerName,
	).Scan(&coins)
	if errors.Is(err, pgx.ErrNoRows) {
		return MultiGachaResult{}, ErrNotFound
	}
	if err != nil {
		return MultiGachaResult{}, err
	}

	if coins < 1000 {
		return MultiGachaResult{}, ErrInsufficientCoins
	}

	// 1000コイン一括消費
	var newCoins int
	if err := tx.QueryRow(ctx,
		`UPDATE players SET coins = coins - 1000 WHERE name = $1 RETURNING coins`,
		playerName,
	).Scan(&newCoins); err != nil {
		return MultiGachaResult{}, err
	}

	// アイテム一覧取得（1回だけ）
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

	// rng を1つ生成して10回使い回す
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
			selected = SelectWeightedItem(highRarityItems, rng)
		} else {
			selected = SelectWeightedItem(items, rng)
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
