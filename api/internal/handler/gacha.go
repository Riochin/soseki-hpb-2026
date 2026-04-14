package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"math/rand"
	"net/http"

	"github.com/soseki-hpb-2026/api/internal/model"
)

// ErrInsufficientCoins はコイン残高不足を表すセンチネルエラー。
var ErrInsufficientCoins = errors.New("insufficient coins")

// GachaResult はガチャ実行結果を表す。
type GachaResult struct {
	Item     model.CollectionItem `json:"item"`
	IsNew    bool                 `json:"isNew"`
	NewCoins int                  `json:"newCoins"`
}

// GachaStore はガチャの永続化操作を定義するインターフェース。
type GachaStore interface {
	ExecuteGacha(ctx context.Context, playerName string) (GachaResult, error)
}

// Gacha は POST /api/gacha エンドポイントのハンドラーを保持する。
type Gacha struct {
	store GachaStore
}

// NewGacha は Gacha ハンドラーを生成して返す。
func NewGacha(store GachaStore) *Gacha {
	return &Gacha{store: store}
}

// Create は POST /api/gacha を処理する。
// player_name を受け取り、コイン消費・抽選・コレクション追加をトランザクションで実行する。
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
	if errors.Is(err, ErrInsufficientCoins) {
		writeError(w, http.StatusPaymentRequired, "insufficient coins")
		return
	}
	if errors.Is(err, ErrNotFound) {
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

// SelectWeightedItem は重み付きランダム抽選でアイテムを1件選ぶ。
// items は空であってはならない。weight=0 のアイテムは選ばれない。
func SelectWeightedItem(items []model.Item, rng *rand.Rand) model.Item {
	total := 0
	for _, item := range items {
		total += item.Weight
	}

	n := rng.Intn(total)
	cumulative := 0
	for _, item := range items {
		cumulative += item.Weight
		if n < cumulative {
			return item
		}
	}
	// ここには到達しないはず（total > 0 が前提）
	return items[len(items)-1]
}
