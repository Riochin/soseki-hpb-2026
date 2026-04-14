package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/soseki-hpb-2026/api/internal/model"
)

// MessageStore はメッセージの永続化操作を定義するインターフェース。
type MessageStore interface {
	ListMessages(ctx context.Context) ([]model.Message, error)
	CreateMessage(ctx context.Context, author, text string) (model.Message, error)
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

	// nil スライスではなく空配列を返す
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
		Author string `json:"author"`
		Text   string `json:"text"`
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

	msg, err := h.store.CreateMessage(r.Context(), input.Author, input.Text)
	if err != nil {
		log.Printf("messages.Create: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(msg)
}

// writeError は JSON エラーレスポンスを書き込む。
func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
