package handler

import (
	"context"

	"github.com/soseki-hpb-2026/api/internal/db"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// DBMessageStore は pgxpool を使った MessageStore の実装。
type DBMessageStore struct {
	db *db.DB
}

// NewDBMessageStore は DBMessageStore を生成して返す。
func NewDBMessageStore(database *db.DB) *DBMessageStore {
	return &DBMessageStore{db: database}
}

// ListMessages は messages テーブルから全件を作成日降順で取得する。
func (s *DBMessageStore) ListMessages(ctx context.Context) ([]model.Message, error) {
	rows, err := s.db.Pool.Query(ctx,
		`SELECT id, author, text, created_at FROM messages ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []model.Message
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.ID, &m.Author, &m.Text, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if msgs == nil {
		msgs = []model.Message{}
	}
	return msgs, nil
}

// CreateMessage は messages テーブルに1件挿入して返す。
func (s *DBMessageStore) CreateMessage(ctx context.Context, author, text string) (model.Message, error) {
	var m model.Message
	err := s.db.Pool.QueryRow(ctx,
		`INSERT INTO messages (author, text) VALUES ($1, $2) RETURNING id, author, text, created_at`,
		author, text,
	).Scan(&m.ID, &m.Author, &m.Text, &m.CreatedAt)
	if err != nil {
		return model.Message{}, err
	}
	return m, nil
}
