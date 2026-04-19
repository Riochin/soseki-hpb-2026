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
		`SELECT id, author, username, text, bg_color, bg_style, font, stamp, created_at
		 FROM messages ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []model.Message
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(
			&m.ID, &m.Author, &m.Username, &m.Text,
			&m.BgColor, &m.BgStyle, &m.Font, &m.Stamp,
			&m.CreatedAt,
		); err != nil {
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
func (s *DBMessageStore) CreateMessage(
	ctx context.Context,
	author string,
	username *string,
	text string,
	bgColor string,
	bgStyle string,
	font string,
	stamp *string,
) (model.Message, error) {
	var m model.Message
	err := s.db.Pool.QueryRow(ctx,
		`INSERT INTO messages (author, username, text, bg_color, bg_style, font, stamp)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, author, username, text, bg_color, bg_style, font, stamp, created_at`,
		author, username, text, bgColor, bgStyle, font, stamp,
	).Scan(
		&m.ID, &m.Author, &m.Username, &m.Text,
		&m.BgColor, &m.BgStyle, &m.Font, &m.Stamp,
		&m.CreatedAt,
	)
	if err != nil {
		return model.Message{}, err
	}
	return m, nil
}
