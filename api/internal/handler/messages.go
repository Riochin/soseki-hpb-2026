package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/model"
)

var validBgColors = map[string]bool{"white": true, "beige": true, "purple": true}
var validBgStyles = map[string]bool{"normal": true, "line": true, "grid": true}
var validFonts = map[string]bool{"noto-sans": true, "tanuki": true, "fude-ji": true, "fude": true}
var validStamps = map[string]bool{
	"dio": true, "joseph": true, "jotaro": true, "kakyoin": true, "DIO": true,
	"josuke": true, "rohan": true, "bucciarati": true, "giorno": true,
	"diavolo": true, "jolyne": true, "anasui": true,
}

// MessageStore はメッセージの永続化操作を定義するインターフェース。
type MessageStore interface {
	ListMessages(ctx context.Context) ([]model.Message, error)
	CreateMessage(ctx context.Context, author string, username *string, text string, bgColor string, bgStyle string, font string, stamp *string) (model.Message, error)
	DeleteMessage(ctx context.Context, id int, username string) (bool, error)
	UpdateMessage(ctx context.Context, id int, username string, newAuthor *string, newText *string) (model.Message, bool, error)
}

// Messages はメッセージ CRUD エンドポイントのハンドラー群を保持する。
type Messages struct {
	store MessageStore
}

// NewMessages は Messages ハンドラーを生成して返す。
func NewMessages(store MessageStore) *Messages {
	return &Messages{store: store}
}

// List は GET /api/messages を処理し、全件を作成日降順で返す。
func (h *Messages) List(w http.ResponseWriter, r *http.Request) {
	msgs, err := h.store.ListMessages(r.Context())
	if err != nil {
		log.Printf("messages.List: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if msgs == nil {
		msgs = []model.Message{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(msgs)
}

// Create は POST /api/messages を処理し、新規メッセージを保存して 201 で返す。
func (h *Messages) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Author   string  `json:"author"`
		Username *string `json:"username"`
		Text     string  `json:"text"`
		BgColor  string  `json:"bgColor"`
		BgStyle  string  `json:"bgStyle"`
		Font     string  `json:"font"`
		Stamp    *string `json:"stamp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if input.Author == "" {
		writeError(w, http.StatusBadRequest, "author is required")
		return
	}
	if input.Text == "" {
		writeError(w, http.StatusBadRequest, "text is required")
		return
	}
	if input.BgColor == "" {
		input.BgColor = "white"
	}
	if input.BgStyle == "" {
		input.BgStyle = "normal"
	}
	if input.Font == "" {
		input.Font = "noto-sans"
	}

	if !validBgColors[input.BgColor] {
		writeError(w, http.StatusBadRequest, "invalid bgColor")
		return
	}
	if !validBgStyles[input.BgStyle] {
		writeError(w, http.StatusBadRequest, "invalid bgStyle")
		return
	}
	if !validFonts[input.Font] {
		writeError(w, http.StatusBadRequest, "invalid font")
		return
	}
	if input.Stamp != nil && !validStamps[*input.Stamp] {
		writeError(w, http.StatusBadRequest, "invalid stamp")
		return
	}

	msg, err := h.store.CreateMessage(
		r.Context(),
		input.Author, input.Username, input.Text,
		input.BgColor, input.BgStyle, input.Font, input.Stamp,
	)
	if err != nil {
		log.Printf("messages.Create: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(msg)
}

// Delete は DELETE /api/messages/{id} を処理し、自分の投稿を削除する。
func (h *Messages) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.Username == "" {
		writeError(w, http.StatusBadRequest, "username is required")
		return
	}

	deleted, err := h.store.DeleteMessage(r.Context(), id, input.Username)
	if err != nil {
		log.Printf("messages.Delete: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if !deleted {
		writeError(w, http.StatusNotFound, "message not found or unauthorized")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UpdateAuthor は PATCH /api/messages/{id} を処理し、author・text を更新して返す。
func (h *Messages) UpdateAuthor(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input struct {
		Username string  `json:"username"`
		Author   *string `json:"author"`
		Text     *string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.Username == "" {
		writeError(w, http.StatusBadRequest, "username is required")
		return
	}
	if input.Author == nil && input.Text == nil {
		writeError(w, http.StatusBadRequest, "author or text is required")
		return
	}
	if input.Author != nil && *input.Author == "" {
		writeError(w, http.StatusBadRequest, "author must not be empty")
		return
	}
	if input.Text != nil && *input.Text == "" {
		writeError(w, http.StatusBadRequest, "text must not be empty")
		return
	}

	msg, found, err := h.store.UpdateMessage(r.Context(), id, input.Username, input.Author, input.Text)
	if err != nil {
		log.Printf("messages.UpdateAuthor: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if !found {
		writeError(w, http.StatusNotFound, "message not found or unauthorized")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(msg)
}

// writeError は JSON エラーレスポンスを書き込む。
func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
