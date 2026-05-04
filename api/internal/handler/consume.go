package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/repository"
)

// Consume は POST /api/players/{name}/items/{item_id}/consume エンドポイントのハンドラーを保持する。
type Consume struct {
	store repository.ConsumeStore
}

// NewConsume は Consume ハンドラーを生成して返す。
func NewConsume(store repository.ConsumeStore) *Consume {
	return &Consume{store: store}
}

// Create は POST /api/players/{name}/items/{item_id}/consume を処理する。
func (h *Consume) Create(w http.ResponseWriter, r *http.Request) {
	playerName := chi.URLParam(r, "name")
	if playerName == "" {
		writeError(w, http.StatusBadRequest, "player name is required")
		return
	}

	itemIDStr := chi.URLParam(r, "item_id")
	itemID, err := strconv.Atoi(itemIDStr)
	if err != nil || itemID <= 0 {
		writeError(w, http.StatusBadRequest, "invalid item_id")
		return
	}

	if err := h.store.ConsumeItem(r.Context(), playerName, itemID); err != nil {
		switch {
		case errors.Is(err, apperr.ErrNotFound):
			writeError(w, http.StatusNotFound, "player or item not found")
		case errors.Is(err, apperr.ErrNotGiftable):
			writeError(w, http.StatusBadRequest, "item is not giftable")
		case errors.Is(err, apperr.ErrAlreadyConsumed):
			writeError(w, http.StatusConflict, "item already consumed")
		default:
			log.Printf("consume.Create: %v", err)
			writeError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"consumed":true}`))
}
