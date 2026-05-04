package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/repository"
)

// Gacha は POST /api/gacha エンドポイントのハンドラーを保持する。
type Gacha struct {
	store repository.GachaStore
}

// NewGacha は Gacha ハンドラーを生成して返す。
func NewGacha(store repository.GachaStore) *Gacha {
	return &Gacha{store: store}
}

// Create は POST /api/gacha を処理する。
func (h *Gacha) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		PlayerName string `json:"player_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.PlayerName == "" {
		writeError(w, http.StatusBadRequest, "player_name is required")
		return
	}

	result, err := h.store.ExecuteGacha(r.Context(), input.PlayerName)
	if errors.Is(err, apperr.ErrInsufficientCoins) {
		writeError(w, http.StatusPaymentRequired, "insufficient coins")
		return
	}
	if errors.Is(err, apperr.ErrNotFound) {
		writeError(w, http.StatusNotFound, "player not found")
		return
	}
	if err != nil {
		log.Printf("gacha.Create: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}

// CreateMulti は POST /api/gacha/multi を処理する。
func (h *Gacha) CreateMulti(w http.ResponseWriter, r *http.Request) {
	var input struct {
		PlayerName string `json:"player_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.PlayerName == "" {
		writeError(w, http.StatusBadRequest, "player_name is required")
		return
	}

	result, err := h.store.ExecuteMultiGacha(r.Context(), input.PlayerName)
	if errors.Is(err, apperr.ErrInsufficientCoins) {
		writeError(w, http.StatusPaymentRequired, "insufficient coins")
		return
	}
	if errors.Is(err, apperr.ErrNotFound) {
		writeError(w, http.StatusNotFound, "player not found")
		return
	}
	if err != nil {
		log.Printf("gacha.CreateMulti: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}
