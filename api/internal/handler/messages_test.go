package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/soseki-hpb-2026/api/internal/handler"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// --- モック ---

type mockMessageStore struct {
	messages []model.Message
	err      error
}

func (m *mockMessageStore) ListMessages(_ context.Context) ([]model.Message, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.messages, nil
}

func (m *mockMessageStore) CreateMessage(
	_ context.Context,
	author string,
	username *string,
	text string,
	bgColor string,
	bgStyle string,
	font string,
	stamp *string,
) (model.Message, error) {
	if m.err != nil {
		return model.Message{}, m.err
	}
	msg := model.Message{
		ID:        len(m.messages) + 1,
		Author:    author,
		Username:  username,
		Text:      text,
		BgColor:   bgColor,
		BgStyle:   bgStyle,
		Font:      font,
		Stamp:     stamp,
		CreatedAt: time.Now(),
	}
	m.messages = append(m.messages, msg)
	return msg, nil
}

// --- GET /api/messages ---

func TestList_ReturnsEmptyArray(t *testing.T) {
	h := handler.NewMessages(&mockMessageStore{messages: []model.Message{}})

	req := httptest.NewRequest(http.MethodGet, "/api/messages", nil)
	w := httptest.NewRecorder()
	h.List(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var msgs []model.Message
	if err := json.NewDecoder(w.Body).Decode(&msgs); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(msgs) != 0 {
		t.Errorf("expected 0 messages, got %d", len(msgs))
	}
}

func TestList_ReturnsMessages(t *testing.T) {
	seed := []model.Message{
		{ID: 1, Author: "漱石", Text: "吾輩は猫である", CreatedAt: time.Now()},
		{ID: 2, Author: "鴎外", Text: "舞姫", CreatedAt: time.Now()},
	}
	h := handler.NewMessages(&mockMessageStore{messages: seed})

	req := httptest.NewRequest(http.MethodGet, "/api/messages", nil)
	w := httptest.NewRecorder()
	h.List(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var msgs []model.Message
	if err := json.NewDecoder(w.Body).Decode(&msgs); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(msgs) != 2 {
		t.Errorf("expected 2 messages, got %d", len(msgs))
	}
}

func TestList_StoreError_Returns500(t *testing.T) {
	h := handler.NewMessages(&mockMessageStore{err: errors.New("db error")})

	req := httptest.NewRequest(http.MethodGet, "/api/messages", nil)
	w := httptest.NewRecorder()
	h.List(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

// --- POST /api/messages ---

func TestCreate_ValidRequest_Returns201(t *testing.T) {
	h := handler.NewMessages(&mockMessageStore{messages: []model.Message{}})

	body := `{"author":"漱石","text":"誕生日おめでとう"}`
	req := httptest.NewRequest(http.MethodPost, "/api/messages", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var msg model.Message
	if err := json.NewDecoder(w.Body).Decode(&msg); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if msg.Author != "漱石" {
		t.Errorf("expected author '漱石', got %q", msg.Author)
	}
	if msg.Text != "誕生日おめでとう" {
		t.Errorf("expected text '誕生日おめでとう', got %q", msg.Text)
	}
}

func TestCreate_EmptyAuthor_Returns400(t *testing.T) {
	h := handler.NewMessages(&mockMessageStore{messages: []model.Message{}})

	body := `{"author":"","text":"誕生日おめでとう"}`
	req := httptest.NewRequest(http.MethodPost, "/api/messages", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreate_EmptyText_Returns400(t *testing.T) {
	h := handler.NewMessages(&mockMessageStore{messages: []model.Message{}})

	body := `{"author":"漱石","text":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/messages", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreate_InvalidJSON_Returns400(t *testing.T) {
	h := handler.NewMessages(&mockMessageStore{messages: []model.Message{}})

	req := httptest.NewRequest(http.MethodPost, "/api/messages", bytes.NewBufferString("not-json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreate_StoreError_Returns500(t *testing.T) {
	h := handler.NewMessages(&mockMessageStore{err: errors.New("db error")})

	body := `{"author":"漱石","text":"テスト"}`
	req := httptest.NewRequest(http.MethodPost, "/api/messages", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}
