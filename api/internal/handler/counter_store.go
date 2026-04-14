package handler

import (
	"context"

	"github.com/soseki-hpb-2026/api/internal/db"
)

// DBCounterStore は pgxpool を使った CounterStore の実装。
type DBCounterStore struct {
	db *db.DB
}

// NewDBCounterStore は DBCounterStore を生成して返す。
func NewDBCounterStore(database *db.DB) *DBCounterStore {
	return &DBCounterStore{db: database}
}

// Increment は access_counter をアトミックにインクリメントして最新値を返す。
func (s *DBCounterStore) Increment(ctx context.Context) (int, error) {
	var count int
	err := s.db.Pool.QueryRow(ctx,
		`UPDATE access_counter SET count = count + 1 WHERE id = 1 RETURNING count`,
	).Scan(&count)
	return count, err
}
