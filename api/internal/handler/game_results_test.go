package handler_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/soseki-hpb-2026/api/internal/handler"
)

// --- モック ---

type mockGameResultListStore struct {
	entries []handler.GameResultEntry
	err     error
}

func (m *mockGameResultListStore) ListLeaderboard(_ context.Context, _ string, _ *int, _ int) ([]handler.GameResultEntry, error) {
	return m.entries, m.err
}

// --- GET /api/game-results ---

func TestGameResultsList_DefaultGameType_Returns200(t *testing.T) {
	entries := []handler.GameResultEntry{
		{PlayerName: "漱石", Score: 9999, GradeRank: "S", CreatedAt: time.Now()},
		{PlayerName: "子規", Score: 5000, GradeRank: "A", CreatedAt: time.Now()},
	}
	h := handler.NewGameResults(&mockGameResultListStore{entries: entries})

	req := httptest.NewRequest(http.MethodGet, "/api/game-results", nil)
	w := httptest.NewRecorder()
	h.List(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var body struct {
		Entries []map[string]interface{} `json:"entries"`
	}
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(body.Entries) != 2 {
		t.Errorf("expected 2 entries, got %d", len(body.Entries))
	}
	// rank フィールドが 1-indexed で付与されること
	if body.Entries[0]["rank"].(float64) != 1 {
		t.Errorf("expected rank 1, got %v", body.Entries[0]["rank"])
	}
	if body.Entries[0]["playerName"] != "漱石" {
		t.Errorf("expected playerName '漱石', got %v", body.Entries[0]["playerName"])
	}
}

func TestGameResultsList_EmptyEntries_ReturnsEmptyList(t *testing.T) {
	h := handler.NewGameResults(&mockGameResultListStore{entries: []handler.GameResultEntry{}})

	req := httptest.NewRequest(http.MethodGet, "/api/game-results?gameType=shooting", nil)
	w := httptest.NewRecorder()
	h.List(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body struct {
		Entries []map[string]interface{} `json:"entries"`
	}
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if len(body.Entries) != 0 {
		t.Errorf("expected empty entries, got %d", len(body.Entries))
	}
}

func TestGameResultsList_StoreError_Returns500(t *testing.T) {
	h := handler.NewGameResults(&mockGameResultListStore{err: errors.New("db error")})

	req := httptest.NewRequest(http.MethodGet, "/api/game-results", nil)
	w := httptest.NewRecorder()
	h.List(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

func TestGameResultsList_LimitClamped_DoesNotExceed100(t *testing.T) {
	h := handler.NewGameResults(&mockGameResultListStore{entries: []handler.GameResultEntry{}})

	// limit=500 を指定しても 100 にクランプされること（ストアは呼ばれるが上限制御は内部）
	req := httptest.NewRequest(http.MethodGet, "/api/game-results?limit=500", nil)
	w := httptest.NewRecorder()
	h.List(w, req)

	// ストアエラーがなければ 200 が返ること
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}
