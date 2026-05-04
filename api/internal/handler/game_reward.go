package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/service/reward"
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

	amount := reward.CalcCoinReward(input.GameType, input.Rank, input.TimeLimit, input.Score)

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
	if errors.Is(err, apperr.ErrDuplicateGameSession) {
		writeError(w, http.StatusTooManyRequests, "reward already claimed for this session")
		return
	}
	if errors.Is(err, apperr.ErrNotFound) {
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
