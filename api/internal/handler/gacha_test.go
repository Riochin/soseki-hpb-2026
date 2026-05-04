package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/soseki-hpb-2026/api/internal/apperr"
	"github.com/soseki-hpb-2026/api/internal/handler"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// --- モック ---

type mockGachaStore struct {
	result      handler.GachaResult
	multiResult handler.MultiGachaResult
	err         error
}

func (m *mockGachaStore) ExecuteGacha(_ context.Context, _ string) (handler.GachaResult, error) {
	return m.result, m.err
}

func (m *mockGachaStore) ExecuteMultiGacha(_ context.Context, _ string) (handler.MultiGachaResult, error) {
	return m.multiResult, m.err
}

// --- POST /api/gacha ---

func TestGachaCreate_ValidRequest_Returns200(t *testing.T) {
	result := handler.GachaResult{
		Item:     model.CollectionItem{ItemID: 1, Name: "伝説のメガネ", Rarity: "SSR", Icon: "🕶️", Acquired: true},
		IsNew:    true,
		NewCoins: 0,
	}
	h := handler.NewGacha(&mockGachaStore{result: result})

	body := `{"player_name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got handler.GachaResult
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if got.Item.Name != "伝説のメガネ" {
		t.Errorf("expected item name '伝説のメガネ', got %q", got.Item.Name)
	}
	if !got.IsNew {
		t.Error("expected isNew to be true")
	}
}

func TestGachaCreate_EmptyPlayerName_Returns400(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{})

	body := `{"player_name":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestGachaCreate_InvalidJSON_Returns400(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{})

	req := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString("not-json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestGachaCreate_InsufficientCoins_Returns402(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{err: apperr.ErrInsufficientCoins})

	body := `{"player_name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusPaymentRequired {
		t.Fatalf("expected 402, got %d", w.Code)
	}
}

func TestGachaCreate_PlayerNotFound_Returns404(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{err: apperr.ErrNotFound})

	body := `{"player_name":"nobody"}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestGachaCreate_StoreError_Returns500(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{err: errors.New("db error")})

	body := `{"player_name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

// --- POST /api/gacha/multi ---

func makeMultiResult(n int) handler.MultiGachaResult {
	results := make([]handler.GachaResult, n)
	for i := range results {
		results[i] = handler.GachaResult{
			Item:     model.CollectionItem{ItemID: i + 1, Name: "アイテム", Rarity: "N", Icon: "☕", Acquired: true},
			IsNew:    i == 0,
			NewCoins: 0,
		}
	}
	return handler.MultiGachaResult{Results: results, NewCoins: 0}
}

func TestGachaCreateMulti_ValidRequest_Returns200(t *testing.T) {
	multiResult := makeMultiResult(10)
	h := handler.NewGacha(&mockGachaStore{multiResult: multiResult})

	body := `{"player_name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha/multi", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.CreateMulti(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var got handler.MultiGachaResult
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(got.Results) != 10 {
		t.Errorf("expected 10 results, got %d", len(got.Results))
	}
}

func TestGachaCreateMulti_EmptyPlayerName_Returns400(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{})

	body := `{"player_name":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha/multi", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.CreateMulti(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestGachaCreateMulti_InvalidJSON_Returns400(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{})

	req := httptest.NewRequest(http.MethodPost, "/api/gacha/multi", bytes.NewBufferString("not-json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.CreateMulti(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestGachaCreateMulti_InsufficientCoins_Returns402(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{err: apperr.ErrInsufficientCoins})

	body := `{"player_name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha/multi", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.CreateMulti(w, req)

	if w.Code != http.StatusPaymentRequired {
		t.Fatalf("expected 402, got %d", w.Code)
	}
}

func TestGachaCreateMulti_PlayerNotFound_Returns404(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{err: apperr.ErrNotFound})

	body := `{"player_name":"nobody"}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha/multi", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.CreateMulti(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestGachaCreateMulti_StoreError_Returns500(t *testing.T) {
	h := handler.NewGacha(&mockGachaStore{err: errors.New("db error")})

	body := `{"player_name":"漱石"}`
	req := httptest.NewRequest(http.MethodPost, "/api/gacha/multi", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.CreateMulti(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

