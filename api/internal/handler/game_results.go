package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"
)

// GameResults は GET /api/game-results のハンドラー。
type GameResults struct {
	store GameResultListStore
}

// GameResultListStore はランキング一覧取得を抽象化する。
type GameResultListStore interface {
	ListLeaderboard(ctx context.Context, gameType string, timeLimit *int, limit int) ([]GameResultEntry, error)
}

// GameResultEntry は1件のランキング行。
type GameResultEntry struct {
	PlayerName string    `json:"playerName"`
	Score      int       `json:"score"`
	GradeRank  string    `json:"gradeRank"`
	CreatedAt  time.Time `json:"createdAt"`
}

// NewGameResults は GameResults を生成する。
func NewGameResults(store GameResultListStore) *GameResults {
	return &GameResults{store: store}
}

// List は GET /api/game-results を処理する。
func (h *GameResults) List(w http.ResponseWriter, r *http.Request) {
	gameType := r.URL.Query().Get("gameType")
	if gameType == "" {
		gameType = "typing"
	}

	limit := 20
	if ls := r.URL.Query().Get("limit"); ls != "" {
		if n, err := strconv.Atoi(ls); err == nil && n > 0 {
			limit = n
		}
	}
	if limit > 100 {
		limit = 100
	}

	var timeLimit *int
	if ts := r.URL.Query().Get("timeLimit"); ts != "" {
		if n, err := strconv.Atoi(ts); err == nil {
			timeLimit = &n
		}
	}

	entries, err := h.store.ListLeaderboard(r.Context(), gameType, timeLimit, limit)
	if err != nil {
		log.Printf("gameResults.List: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	out := make([]map[string]interface{}, 0, len(entries))
	for i, e := range entries {
		out = append(out, map[string]interface{}{
			"rank":        i + 1,
			"playerName":  e.PlayerName,
			"score":       e.Score,
			"gradeRank":   e.GradeRank,
			"createdAt":   e.CreatedAt.UTC().Format(time.RFC3339Nano),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"entries": out})
}
