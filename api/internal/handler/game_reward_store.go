package handler

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/soseki-hpb-2026/api/internal/db"
)

// ErrDuplicateGameSession は同一 session_id の結果が既に保存されている場合に返す。
var ErrDuplicateGameSession = errors.New("duplicate game session")

// GameRewardCommit はトランザクション内で保存するゲーム結果と付与コインを表す。
type GameRewardCommit struct {
	PlayerName  string
	GameType    string
	SessionID   string
	Rank        string
	TimeLimit   *int
	Score       int
	CoinsEarned int
}

// DBGameRewardStore は game_result 挿入とコイン加算を同一トランザクションで行う。
type DBGameRewardStore struct {
	db *db.DB
}

// NewDBGameRewardStore は DBGameRewardStore を生成する。
func NewDBGameRewardStore(database *db.DB) *DBGameRewardStore {
	return &DBGameRewardStore{db: database}
}

// CommitGameReward は game_result に1プレイ1行を挿入する（ベストだけに置き換えたりはしない。履歴はすべて残る）。
// 成功時のみコインを加算する。
// 同一 session_id が既に存在する場合は ErrDuplicateGameSession を返す。
// プレイヤーが存在しない場合は ErrNotFound を返す。
func (s *DBGameRewardStore) CommitGameReward(ctx context.Context, in GameRewardCommit) (newCoins int, resultID int64, err error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return 0, 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	err = tx.QueryRow(ctx, `
		INSERT INTO game_result (player_name, game_type, session_id, rank, time_limit, score, coins_earned)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (session_id) DO NOTHING
		RETURNING id
	`, in.PlayerName, in.GameType, in.SessionID, in.Rank, in.TimeLimit, in.Score, in.CoinsEarned,
	).Scan(&resultID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, 0, ErrDuplicateGameSession
		}
		if isFKPlayerMissing(err) {
			return 0, 0, ErrNotFound
		}
		return 0, 0, err
	}

	err = tx.QueryRow(ctx,
		`UPDATE players SET coins = coins + $2 WHERE name = $1 RETURNING coins`,
		in.PlayerName, in.CoinsEarned,
	).Scan(&newCoins)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, 0, ErrNotFound
		}
		return 0, 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, 0, err
	}
	return newCoins, resultID, nil
}

func isFKPlayerMissing(err error) bool {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return false
	}
	// 23503 = foreign_key_violation
	return pgErr.Code == "23503"
}
