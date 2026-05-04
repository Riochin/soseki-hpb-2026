package handler

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/apperr"
)

// ConsumeStore はアイテム引き換え操作を定義するインターフェース。
type ConsumeStore interface {
	ConsumeItem(ctx context.Context, playerName string, itemID int) error
}

// Consume は POST /api/players/{name}/items/{item_id}/consume エンドポイントのハンドラーを保持する。
type Consume struct {
	store ConsumeStore
}

// NewConsume は Consume ハンドラーを生成して返す。
func NewConsume(store ConsumeStore) *Consume {
	return &Consume{store: store}
}

// Create は POST /api/players/{name}/items/{item_id}/consume を処理する。
// is_giftable=true のアイテムを is_consumed=true にマークする。
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
