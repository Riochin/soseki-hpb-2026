package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB はアプリ全体で共有するコネクションプールを保持する。
type DB struct {
	Pool *pgxpool.Pool
}

// New は DATABASE_URL をもとに pgxpool を初期化して返す。
// 接続文字列が不正または接続に失敗した場合はエラーを返す。
func New(ctx context.Context, databaseURL string) (*DB, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DATABASE_URL: %w", err)
	}

	// コネクション数を Supabase 無料枠に合わせて制限する
	cfg.MaxConns = 5

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// 起動時に疎通確認する（フェイルファスト）
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return &DB{Pool: pool}, nil
}

// Close はコネクションプールを閉じる。defer で呼び出すこと。
func (d *DB) Close() {
	if d.Pool != nil {
		d.Pool.Close()
	}
}
