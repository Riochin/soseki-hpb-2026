package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
)

// TestHealthCheck: GET /health が 200 と "ok" を返すことを検証する
func TestHealthCheck(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/health", healthHandler)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	body := w.Body.String()
	if body != `{"status":"ok"}` {
		t.Fatalf("unexpected body: %q", body)
	}
}
