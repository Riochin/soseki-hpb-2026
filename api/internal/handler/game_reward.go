package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
)

// rewardSessions はセッション単位の二重取得防止用インメモリマップ。
// キー: "playerName:sessionId" → 最終報酬時刻
var (
	rewardMu       sync.Mutex
	rewardSessions = make(map[string]time.Time)
)

// GameReward は POST /api/players/:name/game-reward エンドポイントのハンドラーを保持する。
type GameReward struct {
	store PlayerStore
}

// NewGameReward は GameReward ハンドラーを生成して返す。
func NewGameReward(store PlayerStore) *GameReward {
	return &GameReward{store: store}
}

// gameRewardInput はクライアントから送られるゲーム結果。
type gameRewardInput struct {
	GameType  string `json:"gameType"`  // "typing" | 将来の他ゲーム
	Rank      string `json:"rank"`      // typing 用: "S"|"A"|"B"|"C"|"D"
	TimeLimit int    `json:"timeLimit"` // typing 用: 30 | 60 | 120
	SessionID string `json:"sessionId"` // クライアント側で生成した UUID
}

// Create は POST /api/players/:name/game-reward を処理する。
// ゲーム結果を受け取り、コインを加算して新しい残高を返す。
func (h *GameReward) Create(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")

	var input gameRewardInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.SessionID == "" {
		writeError(w, http.StatusBadRequest, "sessionId is required")
		return
	}

	// 二重取得防止: 同一 sessionId は5分間1回のみ
	key := name + ":" + input.SessionID
	rewardMu.Lock()
	if last, ok := rewardSessions[key]; ok && time.Since(last) < 5*time.Minute {
		rewardMu.Unlock()
		writeError(w, http.StatusTooManyRequests, "reward already claimed for this session")
		return
	}
	rewardSessions[key] = time.Now()
	rewardMu.Unlock()

	amount := calcCoinReward(input)

	newCoins, err := h.store.EarnCoins(r.Context(), name, amount)
	if errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, "player not found")
		return
	}
	if err != nil {
		log.Printf("gameReward.Create: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]int{
		"coinsEarned": amount,
		"newCoins":    newCoins,
	})
}

// calcCoinReward は gameType に応じた報酬計算関数へ委譲する。
// 将来のゲームは case を追加するだけで対応可能。
func calcCoinReward(input gameRewardInput) int {
	switch input.GameType {
	case "typing":
		return calcTypingReward(input.Rank, input.TimeLimit)
	case "shooting":
		return calcShootingReward(input.Rank)
	default:
		return 5 // 未知のゲームは最低報酬
	}
}

// calcShootingReward はランクからシューティングゲームのコイン報酬を算出する。
//
// S=1500(15Cr), A=800(8Cr), B=400(4Cr), C=200(2Cr), D=100(1Cr)
func calcShootingReward(rank string) int {
	rewards := map[string]int{"S": 1500, "A": 800, "B": 400, "C": 200, "D": 100}
	if r, ok := rewards[rank]; ok {
		return r
	}
	return 100
}

// calcTypingReward はランクと制限時間からタイピングゲームのコイン報酬を算出する。
//
// 基準コイン (60s):
//
//	S=50, A=30, B=20, C=10, D=5
//
// 難易度倍率:
//
//	30s → ×2.0, 60s → ×1.0, 120s → ×0.7
func calcTypingReward(rank string, timeLimit int) int {
	base := map[string]int{"S": 1000, "A": 500, "B": 300, "C": 200, "D": 100}[rank]
	if base == 0 {
		base = 5 // 不正なランクは D 扱い
	}
	var mult float64
	switch timeLimit {
	case 30:
		mult = 3.0
	case 120:
		mult = 1.0
	default: // 60 または未知
		mult = 2.0
	}
	if reward := int(float64(base) * mult); reward > 0 {
		return reward
	}
	return 1
}
