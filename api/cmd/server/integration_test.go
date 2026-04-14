package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/soseki-hpb-2026/api/internal/db"
	"github.com/soseki-hpb-2026/api/internal/model"
)

// integrationDB は統合テスト用 DB 接続を確立する。
// DATABASE_URL が未設定の場合はテストをスキップする。
func integrationDB(t *testing.T) *db.DB {
	t.Helper()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL が未設定のため統合テストをスキップします")
	}
	database, err := db.New(context.Background(), databaseURL)
	if err != nil {
		t.Fatalf("DB 接続失敗: %v", err)
	}
	t.Cleanup(database.Close)
	return database
}

// cleanTables はテスト間の干渉を防ぐためテスト用テーブルをクリアする。
func cleanTables(t *testing.T, database *db.DB) {
	t.Helper()
	ctx := context.Background()
	tables := []string{"collections", "messages", "players"}
	for _, tbl := range tables {
		if _, err := database.Pool.Exec(ctx, "DELETE FROM "+tbl); err != nil {
			t.Fatalf("テーブル %s のクリア失敗: %v", tbl, err)
		}
	}
}

// --- メッセージ往復テスト ---

// TestIntegration_Messages_PostThenGet: POST→GET で保存したメッセージが取得できることを検証する
func TestIntegration_Messages_PostThenGet(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	// POST /api/messages
	body := `{"author":"テスト太郎","text":"漱石おめでとう！"}`
	req := httptest.NewRequest(http.MethodPost, "/api/messages", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("POST /api/messages: expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var created model.Message
	if err := json.NewDecoder(w.Body).Decode(&created); err != nil {
		t.Fatalf("POST レスポンス decode 失敗: %v", err)
	}
	if created.Author != "テスト太郎" {
		t.Errorf("author: expected 'テスト太郎', got %q", created.Author)
	}
	if created.Text != "漱石おめでとう！" {
		t.Errorf("text: expected '漱石おめでとう！', got %q", created.Text)
	}

	// GET /api/messages
	req2 := httptest.NewRequest(http.MethodGet, "/api/messages", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("GET /api/messages: expected 200, got %d", w2.Code)
	}

	var msgs []model.Message
	if err := json.NewDecoder(w2.Body).Decode(&msgs); err != nil {
		t.Fatalf("GET レスポンス decode 失敗: %v", err)
	}
	if len(msgs) != 1 {
		t.Fatalf("expected 1 message, got %d", len(msgs))
	}
	if msgs[0].ID != created.ID {
		t.Errorf("message ID mismatch: expected %d, got %d", created.ID, msgs[0].ID)
	}
	if msgs[0].Text != "漱石おめでとう！" {
		t.Errorf("text mismatch: expected '漱石おめでとう！', got %q", msgs[0].Text)
	}
}

// TestIntegration_Messages_EmptyAuthor_Returns400: author 空文字で 400 を返すことを検証する
func TestIntegration_Messages_EmptyAuthor_Returns400(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	body := `{"author":"","text":"テスト"}`
	req := httptest.NewRequest(http.MethodPost, "/api/messages", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

// --- プレイヤー upsert テスト ---

// TestIntegration_Players_NewPlayer_Gets100Coins: 新規プレイヤーは coins=100 で作成されることを検証する
func TestIntegration_Players_NewPlayer_Gets100Coins(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	body := `{"name":"漱石テスト"}`
	req := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("POST /api/players: expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var player model.Player
	if err := json.NewDecoder(w.Body).Decode(&player); err != nil {
		t.Fatalf("decode 失敗: %v", err)
	}
	if player.Name != "漱石テスト" {
		t.Errorf("name: expected '漱石テスト', got %q", player.Name)
	}
	if player.Coins != 100 {
		t.Errorf("coins: expected 100, got %d", player.Coins)
	}
	if player.Debt != 0 {
		t.Errorf("debt: expected 0, got %d", player.Debt)
	}
}

// TestIntegration_Players_ExistingPlayer_ReturnsSameData: 既存プレイヤーを再登録しても同じデータが返ることを検証する（upsert）
func TestIntegration_Players_ExistingPlayer_ReturnsSameData(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	body := `{"name":"漱石テスト2"}`

	// 1回目: 新規作成
	req1 := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(body))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusCreated {
		t.Fatalf("1回目: expected 201, got %d", w1.Code)
	}
	var p1 model.Player
	if err := json.NewDecoder(w1.Body).Decode(&p1); err != nil {
		t.Fatalf("1回目 decode 失敗: %v", err)
	}

	// 2回目: 同名で再登録（upsert - 既存データを返す）
	req2 := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(body))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusCreated {
		t.Fatalf("2回目: expected 201, got %d", w2.Code)
	}
	var p2 model.Player
	if err := json.NewDecoder(w2.Body).Decode(&p2); err != nil {
		t.Fatalf("2回目 decode 失敗: %v", err)
	}

	// 同じプレイヤーデータが返ること（コインが増えていない）
	if p2.Name != p1.Name {
		t.Errorf("name mismatch: expected %q, got %q", p1.Name, p2.Name)
	}
	if p2.Coins != p1.Coins {
		t.Errorf("coins should not change on upsert: expected %d, got %d", p1.Coins, p2.Coins)
	}
}

// --- ガチャ統合テスト ---

// TestIntegration_Gacha_CoinsDecreasedAndCollectionUpdated: ガチャ実行後にコイン消費とコレクション追加がアトミックに行われることを検証する
func TestIntegration_Gacha_CoinsDecreasedAndCollectionUpdated(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	// プレイヤー作成（coins=100）
	playerBody := `{"name":"ガチャテスト"}`
	req1 := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(playerBody))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusCreated {
		t.Fatalf("プレイヤー作成失敗: %d", w1.Code)
	}

	// ガチャ実行
	gachaBody := `{"player_name":"ガチャテスト"}`
	req2 := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(gachaBody))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("POST /api/gacha: expected 200, got %d: %s", w2.Code, w2.Body.String())
	}

	var result struct {
		Item struct {
			ItemID   int    `json:"itemId"`
			Name     string `json:"name"`
			Rarity   string `json:"rarity"`
			Acquired bool   `json:"acquired"`
		} `json:"item"`
		IsNew    bool `json:"isNew"`
		NewCoins int  `json:"newCoins"`
	}
	if err := json.NewDecoder(w2.Body).Decode(&result); err != nil {
		t.Fatalf("gacha decode 失敗: %v", err)
	}

	// コイン消費の確認: 100 → 0
	if result.NewCoins != 0 {
		t.Errorf("newCoins: expected 0 (100-100), got %d", result.NewCoins)
	}
	if !result.IsNew {
		// 初回ガチャなので必ず新規アイテム
		t.Error("expected isNew=true for first gacha")
	}

	// GET /api/players/ガチャテスト でコレクションとコインを確認（アトミック性の検証）
	req3 := httptest.NewRequest(http.MethodGet, "/api/players/ガチャテスト", nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Fatalf("GET /api/players/ガチャテスト: expected 200, got %d", w3.Code)
	}

	var player model.Player
	if err := json.NewDecoder(w3.Body).Decode(&player); err != nil {
		t.Fatalf("player decode 失敗: %v", err)
	}

	// コインが正確に 100 減っていること
	if player.Coins != 0 {
		t.Errorf("player.Coins: expected 0, got %d", player.Coins)
	}

	// 獲得したアイテムがコレクションに存在すること（アトミック性）
	acquiredCount := 0
	for _, item := range player.Collection {
		if item.Acquired {
			acquiredCount++
		}
	}
	if acquiredCount != 1 {
		t.Errorf("collection acquired count: expected 1, got %d", acquiredCount)
	}

	// 獲得アイテムが gacha 結果と一致すること
	found := false
	for _, item := range player.Collection {
		if item.Acquired && item.ItemID == result.Item.ItemID {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("gacha で獲得したアイテム（ID=%d）がコレクションに見つからない", result.Item.ItemID)
	}
}

// TestIntegration_Gacha_InsufficientCoins_Returns402: コイン不足時に 402 を返し、状態が変化しないことを検証する
func TestIntegration_Gacha_InsufficientCoins_Returns402(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	// プレイヤー作成（coins=100）→ ガチャ1回で 0 にする
	playerBody := `{"name":"貧乏テスト"}`
	req1 := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(playerBody))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusCreated {
		t.Fatalf("プレイヤー作成失敗: %d", w1.Code)
	}

	// 1回目ガチャ（coins 100→0）
	gachaBody := `{"player_name":"貧乏テスト"}`
	req2 := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(gachaBody))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("1回目ガチャ失敗: %d", w2.Code)
	}

	// 2回目ガチャ（coins=0 → 402 が返るはず）
	req3 := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(gachaBody))
	req3.Header.Set("Content-Type", "application/json")
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)

	if w3.Code != http.StatusPaymentRequired {
		t.Fatalf("expected 402, got %d: %s", w3.Code, w3.Body.String())
	}

	// コインが変化していないこと（0 のまま）
	req4 := httptest.NewRequest(http.MethodGet, "/api/players/貧乏テスト", nil)
	w4 := httptest.NewRecorder()
	r.ServeHTTP(w4, req4)
	if w4.Code != http.StatusOK {
		t.Fatalf("GET player: expected 200, got %d", w4.Code)
	}
	var player model.Player
	if err := json.NewDecoder(w4.Body).Decode(&player); err != nil {
		t.Fatalf("player decode 失敗: %v", err)
	}
	if player.Coins != 0 {
		t.Errorf("coins should remain 0 after failed gacha, got %d", player.Coins)
	}
}
