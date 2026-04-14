package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/soseki-hpb-2026/api/internal/handler"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// --- モック ---

type mockPlayerStore struct {
	player   model.Player
	notFound bool
	storeErr error
	coins    int
	debt     int
}

func (m *mockPlayerStore) UpsertPlayer(_ context.Context, name string) (model.Player, error) {
	if m.storeErr != nil {
		return model.Player{}, m.storeErr
	}
	if m.player.Name != "" {
		return m.player, nil
	}
	return model.Player{
		Name:       name,
		Coins:      100,
		Debt:       0,
		Collection: []model.CollectionItem{},
	}, nil
}

func (m *mockPlayerStore) GetPlayer(_ context.Context, _ string) (model.Player, error) {
	if m.storeErr != nil {
		return model.Player{}, m.storeErr
	}
	if m.notFound {
		return model.Player{}, handler.ErrNotFound
	}
	return m.player, nil
}

func (m *mockPlayerStore) BorrowCoins(_ context.Context, _ string) (int, int, error) {
	if m.storeErr != nil {
		return 0, 0, m.storeErr
	}
	if m.notFound {
		return 0, 0, handler.ErrNotFound
	}
	return m.coins, m.debt, nil
}

// chiのURLパラメーターをセットするヘルパー
func withURLParam(r *http.Request, key, value string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

// --- POST /api/players ---

func TestPlayersCreate_ValidName_Returns201(t *testing.T) {
	h := handler.NewPlayers(&mockPlayerStore{})

	body := `{"name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var p model.Player
	if err := json.NewDecoder(w.Body).Decode(&p); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if p.Name != "漱石" {
		t.Errorf("expected name '漱石', got %q", p.Name)
	}
	if p.Coins != 100 {
		t.Errorf("expected coins 100, got %d", p.Coins)
	}
}

func TestPlayersCreate_ExistingPlayer_ReturnsExisting(t *testing.T) {
	existing := model.Player{Name: "漱石", Coins: 50, Debt: 200, Collection: []model.CollectionItem{}}
	h := handler.NewPlayers(&mockPlayerStore{player: existing})

	body := `{"name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", w.Code)
	}
	var p model.Player
	if err := json.NewDecoder(w.Body).Decode(&p); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if p.Coins != 50 {
		t.Errorf("expected coins 50 (existing), got %d", p.Coins)
	}
}

func TestPlayersCreate_EmptyName_Returns400(t *testing.T) {
	h := handler.NewPlayers(&mockPlayerStore{})

	body := `{"name":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestPlayersCreate_InvalidJSON_Returns400(t *testing.T) {
	h := handler.NewPlayers(&mockPlayerStore{})

	req := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString("not-json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestPlayersCreate_StoreError_Returns500(t *testing.T) {
	h := handler.NewPlayers(&mockPlayerStore{storeErr: errors.New("db error")})

	body := `{"name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

// --- GET /api/players/:name ---

func TestPlayersGet_ExistingPlayer_Returns200(t *testing.T) {
	p := model.Player{Name: "漱石", Coins: 100, Debt: 0, Collection: []model.CollectionItem{}}
	h := handler.NewPlayers(&mockPlayerStore{player: p})

	req := httptest.NewRequest(http.MethodGet, "/api/players/漱石", nil)
	req = withURLParam(req, "name", "漱石")
	w := httptest.NewRecorder()
	h.Get(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got model.Player
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if got.Name != "漱石" {
		t.Errorf("expected name '漱石', got %q", got.Name)
	}
}

func TestPlayersGet_NotFound_Returns404(t *testing.T) {
	h := handler.NewPlayers(&mockPlayerStore{notFound: true})

	req := httptest.NewRequest(http.MethodGet, "/api/players/nobody", nil)
	req = withURLParam(req, "name", "nobody")
	w := httptest.NewRecorder()
	h.Get(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestPlayersGet_StoreError_Returns500(t *testing.T) {
	h := handler.NewPlayers(&mockPlayerStore{storeErr: errors.New("db error")})

	req := httptest.NewRequest(http.MethodGet, "/api/players/漱石", nil)
	req = withURLParam(req, "name", "漱石")
	w := httptest.NewRecorder()
	h.Get(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

// --- POST /api/players/:name/borrow ---

func TestBorrow_ValidPlayer_Returns200(t *testing.T) {
	h := handler.NewBorrow(&mockPlayerStore{
		player: model.Player{Name: "漱石"},
		coins:  200,
		debt:   100,
	})

	req := httptest.NewRequest(http.MethodPost, "/api/players/漱石/borrow", nil)
	req = withURLParam(req, "name", "漱石")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var result map[string]int
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if result["coins"] != 200 {
		t.Errorf("expected coins 200, got %d", result["coins"])
	}
	if result["debt"] != 100 {
		t.Errorf("expected debt 100, got %d", result["debt"])
	}
}

func TestBorrow_NotFound_Returns404(t *testing.T) {
	h := handler.NewBorrow(&mockPlayerStore{notFound: true})

	req := httptest.NewRequest(http.MethodPost, "/api/players/nobody/borrow", nil)
	req = withURLParam(req, "name", "nobody")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestBorrow_StoreError_Returns500(t *testing.T) {
	h := handler.NewBorrow(&mockPlayerStore{storeErr: errors.New("db error")})

	req := httptest.NewRequest(http.MethodPost, "/api/players/漱石/borrow", nil)
	req = withURLParam(req, "name", "漱石")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}
