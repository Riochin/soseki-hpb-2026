package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/repository"
)

// Players はプレイヤー取得・作成エンドポイントのハンドラーを保持する。
type Players struct {
	store repository.PlayerStore
}

// NewPlayers は Players ハンドラーを生成して返す。
func NewPlayers(store repository.PlayerStore) *Players {
	return &Players{store: store}
}

// Create は POST /api/players を処理する。
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
	if errors.Is(err, apperr.ErrNotFound) {
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
