package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Borrow は POST /api/players/:name/borrow エンドポイントのハンドラーを保持する。
type Borrow struct {
	store PlayerStore
}

// NewBorrow は Borrow ハンドラーを生成して返す。
func NewBorrow(store PlayerStore) *Borrow {
	return &Borrow{store: store}
}

// Create は POST /api/players/:name/borrow を処理する。
// リクエストボディの amount（クレ単位）だけ coins・debt を増やして最新値を返す。
// amount 未指定または 1 未満の場合は 1 とする。
func (h *Borrow) Create(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")

	var input struct {
		Amount int `json:"amount"`
	}
	// デコード失敗は無視してデフォルト値（0）のまま続行
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.Amount < 1 {
		input.Amount = 1
	}

	coins, debt, err := h.store.BorrowCoins(r.Context(), name, input.Amount)
	if errors.Is(err, ErrNotFound) {
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
