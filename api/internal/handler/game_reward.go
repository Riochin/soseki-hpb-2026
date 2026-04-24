package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// GameRewardCommiter はゲーム報酬を DB にコミットする操作を表す。
type GameRewardCommiter interface {
	CommitGameReward(ctx context.Context, in GameRewardCommit) (newCoins int, resultID int64, err error)
}

// GameReward は POST /api/players/:name/game-reward エンドポイントのハンドラーを保持する。
type GameReward struct {
	commiter GameRewardCommiter
}

// NewGameReward は GameReward ハンドラーを生成して返す。
func NewGameReward(c GameRewardCommiter) *GameReward {
	return &GameReward{commiter: c}
}

// gameRewardInput はクライアントから送られるゲーム結果。
type gameRewardInput struct {
	GameType  string `json:"gameType"`  // "typing" | "shooting" | 将来の他ゲーム
	Rank      string `json:"rank"`      // typing 用: "S"|"A"|"B"|"C"|"D"
	TimeLimit int    `json:"timeLimit"` // typing: 30|60|120, face_memory: 1=EASY, 2=ムズすぎるな
	Score     int    `json:"score"`     // ランキング用スコア（未送信時は 0）
	SessionID string `json:"sessionId"` // クライアント側で生成した UUID
}

// Create は POST /api/players/:name/game-reward を処理する。
// ゲーム結果を保存し、コインを加算して新しい残高を返す。
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

	amount := calcCoinReward(input)

	var timeLimit *int
	if input.GameType == "typing" || input.GameType == "face_memory" {
		tl := input.TimeLimit
		timeLimit = &tl
	}

	commit := GameRewardCommit{
		PlayerName:  name,
		GameType:    input.GameType,
		SessionID:   input.SessionID,
		Rank:        input.Rank,
		TimeLimit:   timeLimit,
		Score:       input.Score,
		CoinsEarned: amount,
	}

	newCoins, resultID, err := h.commiter.CommitGameReward(r.Context(), commit)
	if errors.Is(err, ErrDuplicateGameSession) {
		writeError(w, http.StatusTooManyRequests, "reward already claimed for this session")
		return
	}
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
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"coinsEarned": amount,
		"newCoins":    newCoins,
		"resultId":    resultID,
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
	case "face_memory":
		return calcFaceMemoryReward(input.Rank, input.TimeLimit)
	case "quiz":
		return calcQuizReward(input.Rank)
	case "animal_tower":
		return calcAnimalTowerReward(input.Score)
	default:
		return 5 // 未知のゲームは最低報酬
	}
}

// calcAnimalTowerReward は積み上げ数をそのまま Credit に換算する。
// 100 coins = 1 Credit なので score * 100。最低 1 Credit 保証。
func calcAnimalTowerReward(score int) int {
	if score < 1 {
		return 100
	}
	return (score / 2) * 100
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

// calcQuizReward は効果測定（〇×クイズ）のコイン報酬を算出する。
//
// S=1000(10Cr), A=600(6Cr), B=300(3Cr), C=150(1.5Cr), D=100(1Cr)
func calcQuizReward(rank string) int {
	rewards := map[string]int{"S": 1000, "A": 600, "B": 300, "C": 150, "D": 100}
	if r, ok := rewards[rank]; ok {
		return r
	}
	return 100
}

// calcFaceMemoryReward は名場面神経衰弱のコイン報酬を算出する。
// 基準（EASY, timeLimit=1）: S=1200(12Cr), A=700, B=400, C=250, D=100
// ムズすぎるな（timeLimit=2）は獲得コインを3倍。
func calcFaceMemoryReward(rank string, timeLimit int) int {
	base := map[string]int{"S": 1200, "A": 700, "B": 400, "C": 250, "D": 100}[rank]
	if base == 0 {
		base = 100
	}
	mult := 1.0
	if timeLimit == 2 {
		mult = 3.0
	}
	if reward := int(float64(base) * mult); reward > 0 {
		return reward
	}
	return 1
}
