package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"testing"

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
	h := handler.NewGacha(&mockGachaStore{err: handler.ErrInsufficientCoins})

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
	h := handler.NewGacha(&mockGachaStore{err: handler.ErrNotFound})

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
	h := handler.NewGacha(&mockGachaStore{err: handler.ErrInsufficientCoins})

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
	h := handler.NewGacha(&mockGachaStore{err: handler.ErrNotFound})

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

// --- SelectWeightedItem の抽選ロジックテスト ---

func TestSelectWeightedItem_SingleItem_AlwaysReturnsIt(t *testing.T) {
	items := []model.Item{
		{ID: 1, Name: "唯一アイテム", Rarity: "UR", Weight: 100},
	}
	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 100; i++ {
		got := handler.SelectWeightedItem(items, rng)
		if got.ID != 1 {
			t.Fatalf("expected item ID 1, got %d", got.ID)
		}
	}
}

func TestSelectWeightedItem_OneItemHasAllWeight_AlwaysPicksIt(t *testing.T) {
	items := []model.Item{
		{ID: 1, Name: "レア", Rarity: "UR", Weight: 0},
		{ID: 2, Name: "普通", Rarity: "N", Weight: 100},
		{ID: 3, Name: "普通2", Rarity: "N", Weight: 0},
	}
	rng := rand.New(rand.NewSource(0))

	for i := 0; i < 100; i++ {
		got := handler.SelectWeightedItem(items, rng)
		if got.ID != 2 {
			t.Fatalf("expected item ID 2 (all weight), got %d", got.ID)
		}
	}
}

func TestSelectWeightedItem_DistributionMatchesWeights(t *testing.T) {
	// UR=1, SSR=4, R=20, N=75 (合計100) — 設計書の重み
	items := []model.Item{
		{ID: 1, Name: "UR", Rarity: "UR", Weight: 1},
		{ID: 2, Name: "SSR", Rarity: "SSR", Weight: 4},
		{ID: 3, Name: "R", Rarity: "R", Weight: 20},
		{ID: 4, Name: "N", Rarity: "N", Weight: 75},
	}
	rng := rand.New(rand.NewSource(12345))

	counts := map[int]int{}
	const trials = 100000
	for i := 0; i < trials; i++ {
		got := handler.SelectWeightedItem(items, rng)
		counts[got.ID]++
	}

	// 各レアリティが期待範囲内に収まることを確認（±3%の誤差を許容）
	checkRate := func(itemID int, expectedPct float64) {
		t.Helper()
		actual := float64(counts[itemID]) / trials * 100
		if actual < expectedPct-3 || actual > expectedPct+3 {
			t.Errorf("item %d: expected ~%.1f%%, got %.2f%%", itemID, expectedPct, actual)
		}
	}
	checkRate(1, 1)
	checkRate(2, 4)
	checkRate(3, 20)
	checkRate(4, 75)
}
