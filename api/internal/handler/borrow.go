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

// Borrow は POST /api/players/:name/borrow エンドポイントのハンドラーを保持する。
type Borrow struct {
	store repository.PlayerStore
}

// NewBorrow は Borrow ハンドラーを生成して返す。
func NewBorrow(store repository.PlayerStore) *Borrow {
	return &Borrow{store: store}
}

// Create は POST /api/players/:name/borrow を処理する。
func (h *Borrow) Create(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")

	var input struct {
		Amount int `json:"amount"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.Amount < 1 {
		input.Amount = 1
	}

	coins, debt, err := h.store.BorrowCoins(r.Context(), name, input.Amount)
	if errors.Is(err, apperr.ErrNotFound) {
		writeError(w, http.StatusNotFound, "player not found")
		return
	}
	if err != nil {
		log.Printf("borrow.Create: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]int{"coins": coins, "debt": debt})
}
