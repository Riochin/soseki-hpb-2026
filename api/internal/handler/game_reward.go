package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/repository"
	"github.com/soseki-hpb-2026/api/internal/service/reward"
)

// GameReward は POST /api/players/:name/game-reward エンドポイントのハンドラーを保持する。
type GameReward struct {
	commiter repository.GameRewardCommiter
}

// NewGameReward は GameReward ハンドラーを生成して返す。
func NewGameReward(c repository.GameRewardCommiter) *GameReward {
	return &GameReward{commiter: c}
}

// gameRewardInput はクライアントから送られるゲーム結果。
type gameRewardInput struct {
	GameType  string `json:"gameType"`
	Rank      string `json:"rank"`
	TimeLimit int    `json:"timeLimit"`
	Score     int    `json:"score"`
	SessionID string `json:"sessionId"`
}

// Create は POST /api/players/:name/game-reward を処理する。
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

	commit := repository.GameRewardCommit{
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
