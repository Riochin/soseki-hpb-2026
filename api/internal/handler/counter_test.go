package handler_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/soseki-hpb-2026/api/internal/handler"
)

// --- モック ---

type mockCounterStore struct {
	count int
	err   error
}

func (m *mockCounterStore) Increment(_ context.Context) (int, error) {
	if m.err != nil {
		return 0, m.err
	}
	m.count++
	return m.count, nil
}

// --- POST /api/counter ---

func TestCounterCreate_Returns200WithCount(t *testing.T) {
	h := handler.NewCounter(&mockCounterStore{count: 41})

	req := httptest.NewRequest(http.MethodPost, "/api/counter", nil)
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var result map[string]int
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if result["count"] != 42 {
		t.Errorf("expected count 42, got %d", result["count"])
	}
}

func TestCounterCreate_MultipleIncrements_CountsCorrectly(t *testing.T) {
	store := &mockCounterStore{count: 0}
	h := handler.NewCounter(store)

	for i := 1; i <= 5; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/counter", nil)
		w := httptest.NewRecorder()
		h.Create(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("call %d: expected 200, got %d", i, w.Code)
		}
		var result map[string]int
		if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
			t.Fatalf("call %d: decode error: %v", i, err)
		}
		if result["count"] != i {
			t.Errorf("call %d: expected count %d, got %d", i, i, result["count"])
		}
	}
}

func TestCounterCreate_StoreError_Returns500(t *testing.T) {
	h := handler.NewCounter(&mockCounterStore{err: errors.New("db error")})

	req := httptest.NewRequest(http.MethodPost, "/api/counter", nil)
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}
