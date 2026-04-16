package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// ErrNotFound はリソースが見つからない場合のセンチネルエラー。
var ErrNotFound = errors.New("not found")

// PlayerStore はプレイヤーの永続化操作を定義するインターフェース。
type PlayerStore interface {
	UpsertPlayer(ctx context.Context, name string) (model.Player, error)
	GetPlayer(ctx context.Context, name string) (model.Player, error)
	BorrowCoins(ctx context.Context, name string) (coins, debt int, err error)
	EarnCoins(ctx context.Context, name string, amount int) (newCoins int, err error)
}

// Players はプレイヤー取得・作成エンドポイントのハンドラーを保持する。
type Players struct {
	store PlayerStore
}

// NewPlayers は Players ハンドラーを生成して返す。
func NewPlayers(store PlayerStore) *Players {
	return &Players{store: store}
}

// Create は POST /api/players を処理する。
// 初回は coins=100 で INSERT、既存は SELECT（upsert）。
func (h *Players) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	player, err := h.store.UpsertPlayer(r.Context(), input.Name)
	if err != nil {
		log.Printf("players.Create: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(player)
}

// Get は GET /api/players/:name を処理する。
func (h *Players) Get(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")

	player, err := h.store.GetPlayer(r.Context(), name)
	if errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, "player not found")
		return
	}
	if err != nil {
		log.Printf("players.Get: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(player)
}
