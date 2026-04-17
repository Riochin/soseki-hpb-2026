package handler_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/handler"
)

// --- モック ---

type mockConsumeStore struct {
	err error
}

func (m *mockConsumeStore) ConsumeItem(_ context.Context, _ string, _ int) error {
	return m.err
}

// newConsumeRequest は chi のルーターにマウントした上でリクエストを発行するヘルパー。
func newConsumeRequest(playerName, itemID string) (*httptest.ResponseRecorder, *http.Request) {
	req := httptest.NewRequest(http.MethodPost, "/api/players/"+playerName+"/items/"+itemID+"/consume", nil)

	// chi の URLParam を機能させるためにルーターコンテキストを設定する
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("name", playerName)
	rctx.URLParams.Add("item_id", itemID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	return httptest.NewRecorder(), req
}

// --- POST /api/players/{name}/items/{item_id}/consume ---

func TestConsumeCreate_ValidRequest_Returns200(t *testing.T) {
	h := handler.NewConsume(&mockConsumeStore{err: nil})

	w, req := newConsumeRequest("漱石", "1")
	h.Create(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestConsumeCreate_InvalidItemID_Returns400(t *testing.T) {
	h := handler.NewConsume(&mockConsumeStore{})

	w, req := newConsumeRequest("漱石", "abc")
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestConsumeCreate_ZeroItemID_Returns400(t *testing.T) {
	h := handler.NewConsume(&mockConsumeStore{})

	w, req := newConsumeRequest("漱石", "0")
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestConsumeCreate_PlayerNotFound_Returns404(t *testing.T) {
	h := handler.NewConsume(&mockConsumeStore{err: handler.ErrNotFound})

	w, req := newConsumeRequest("nobody", "1")
	h.Create(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestConsumeCreate_NotGiftable_Returns400(t *testing.T) {
	h := handler.NewConsume(&mockConsumeStore{err: handler.ErrNotGiftable})

	w, req := newConsumeRequest("漱石", "1")
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestConsumeCreate_AlreadyConsumed_Returns409(t *testing.T) {
	h := handler.NewConsume(&mockConsumeStore{err: handler.ErrAlreadyConsumed})

	w, req := newConsumeRequest("漱石", "1")
	h.Create(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", w.Code)
	}
}

func TestConsumeCreate_StoreError_Returns500(t *testing.T) {
	h := handler.NewConsume(&mockConsumeStore{err: errors.New("db error")})

	w, req := newConsumeRequest("漱石", "1")
	h.Create(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}
