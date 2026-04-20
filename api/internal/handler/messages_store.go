package handler

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
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

// DeleteMessage は messages テーブルから id と username が一致する行を削除する。
// 削除できた場合は true を返す。
func (s *DBMessageStore) DeleteMessage(ctx context.Context, id int, username string) (bool, error) {
	tag, err := s.db.Pool.Exec(ctx,
		`DELETE FROM messages WHERE id=$1 AND username=$2`,
		id, username,
	)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

// UpdateMessage は author・text を更新して更新後の Message を返す。
// nil を渡したフィールドは既存値を保持する。
// 対象行が存在しない or username 不一致の場合は (zero, false, nil) を返す。
func (s *DBMessageStore) UpdateMessage(ctx context.Context, id int, username string, newAuthor *string, newText *string) (model.Message, bool, error) {
	var m model.Message
	err := s.db.Pool.QueryRow(ctx,
		`UPDATE messages
		 SET author = COALESCE($3, author), text = COALESCE($4, text)
		 WHERE id=$1 AND username=$2
		 RETURNING id, author, username, text, bg_color, bg_style, font, stamp, created_at`,
		id, username, newAuthor, newText,
	).Scan(
		&m.ID, &m.Author, &m.Username, &m.Text,
		&m.BgColor, &m.BgStyle, &m.Font, &m.Stamp,
		&m.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Message{}, false, nil
		}
		return model.Message{}, false, err
	}
	return m, true, nil
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
