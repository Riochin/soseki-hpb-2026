package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
)

// CounterStore はアクセスカウンターの永続化操作を定義するインターフェース。
type CounterStore interface {
	Increment(ctx context.Context) (count int, err error)
}

// Counter は POST /api/counter エンドポイントのハンドラーを保持する。
type Counter struct {
	store CounterStore
}

// NewCounter は Counter ハンドラーを生成して返す。
func NewCounter(store CounterStore) *Counter {
	return &Counter{store: store}
}

// Create は POST /api/counter を処理する。
// アトミックにカウンターをインクリメントして最新値を返す。
func (h *Counter) Create(w http.ResponseWriter, r *http.Request) {
	count, err := h.store.Increment(r.Context())
	if err != nil {
		log.Printf("counter.Create: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]int{"count": count})
}
