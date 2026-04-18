package handler

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/soseki-hpb-2026/api/internal/db"
)

// DBGameResultListStore はランキング一覧を DB から取得する。
type DBGameResultListStore struct {
	db *db.DB
}

// NewDBGameResultListStore は DBGameResultListStore を生成する。
func NewDBGameResultListStore(database *db.DB) *DBGameResultListStore {
	return &DBGameResultListStore{db: database}
}

// ListLeaderboard は game_type（と任意の time_limit）ごとにスコア降順で上位 limit 件を返す。
func (s *DBGameResultListStore) ListLeaderboard(ctx context.Context, gameType string, timeLimit *int, limit int) ([]GameResultEntry, error) {
	var rows pgx.Rows
	var err error

	if timeLimit != nil {
		rows, err = s.db.Pool.Query(ctx, `
			SELECT player_name, score, rank, created_at
			FROM game_result
			WHERE game_type = $1 AND time_limit = $2
			ORDER BY score DESC, created_at ASC
			LIMIT $3
		`, gameType, *timeLimit, limit)
	} else {
		rows, err = s.db.Pool.Query(ctx, `
			SELECT player_name, score, rank, created_at
			FROM game_result
			WHERE game_type = $1
			ORDER BY score DESC, created_at ASC
			LIMIT $2
		`, gameType, limit)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []GameResultEntry{}
	for rows.Next() {
		var e GameResultEntry
		if err := rows.Scan(&e.PlayerName, &e.Score, &e.GradeRank, &e.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}
