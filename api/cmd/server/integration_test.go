package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
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
	tables := []string{"collections", "game_result", "messages", "players"}
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

// TestIntegration_Players_NewPlayer_Gets500Coins: 新規プレイヤーは coins=500 で作成されることを検証する
func TestIntegration_Players_NewPlayer_Gets500Coins(t *testing.T) {
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
	if player.Coins != 500 {
		t.Errorf("coins: expected 500, got %d", player.Coins)
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

	// プレイヤー作成（coins=500）
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

	// コイン消費の確認: 500 → 400
	if result.NewCoins != 400 {
		t.Errorf("newCoins: expected 400 (500-100), got %d", result.NewCoins)
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
	if player.Coins != 400 {
		t.Errorf("player.Coins: expected 400, got %d", player.Coins)
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

	// プレイヤー作成（coins=500）→ ガチャ5回で 0 にする
	playerBody := `{"name":"貧乏テスト"}`
	req1 := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(playerBody))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusCreated {
		t.Fatalf("プレイヤー作成失敗: %d", w1.Code)
	}

	// 1〜5回目ガチャ（coins 500→0）
	gachaBody := `{"player_name":"貧乏テスト"}`
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/gacha", bytes.NewBufferString(gachaBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("%d回目ガチャ失敗: %d", i+1, w.Code)
		}
	}

	// 6回目ガチャ（coins=0 → 402 が返るはず）
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

// --- ミニゲーム報酬・ランキング ---

// TestIntegration_GameReward_SavesResultAndEarnsCoins: game_result 保存とコイン加算が一括で行われることを検証する
func TestIntegration_GameReward_SavesResultAndEarnsCoins(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	playerName := "報酬テスト"
	reqP := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(fmt.Sprintf(`{"name":%q}`, playerName)))
	reqP.Header.Set("Content-Type", "application/json")
	wP := httptest.NewRecorder()
	r.ServeHTTP(wP, reqP)
	if wP.Code != http.StatusCreated {
		t.Fatalf("プレイヤー作成: %d", wP.Code)
	}
	var created model.Player
	if err := json.NewDecoder(wP.Body).Decode(&created); err != nil {
		t.Fatalf("decode: %v", err)
	}

	sessionID := "11111111-1111-1111-1111-111111111111"
	body := fmt.Sprintf(`{"gameType":"shooting","rank":"D","score":42,"sessionId":%q}`, sessionID)
	path := "/api/players/" + playerName + "/game-reward"
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("game-reward: expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var out struct {
		CoinsEarned int   `json:"coinsEarned"`
		NewCoins    int   `json:"newCoins"`
		ResultID    int64 `json:"resultId"`
	}
	if err := json.NewDecoder(w.Body).Decode(&out); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if out.CoinsEarned != 100 {
		t.Errorf("coinsEarned: expected 100 (D rank shooting), got %d", out.CoinsEarned)
	}
	if out.NewCoins != created.Coins+out.CoinsEarned {
		t.Errorf("newCoins: expected %d, got %d", created.Coins+out.CoinsEarned, out.NewCoins)
	}
	if out.ResultID == 0 {
		t.Error("resultId should be non-zero")
	}

	reqG := httptest.NewRequest(http.MethodGet, "/api/game-results?gameType=shooting&limit=5", nil)
	wG := httptest.NewRecorder()
	r.ServeHTTP(wG, reqG)
	if wG.Code != http.StatusOK {
		t.Fatalf("game-results: %d", wG.Code)
	}
	var board struct {
		Entries []struct {
			Rank       int    `json:"rank"`
			PlayerName string `json:"playerName"`
			Score      int    `json:"score"`
			GradeRank  string `json:"gradeRank"`
		} `json:"entries"`
	}
	if err := json.NewDecoder(wG.Body).Decode(&board); err != nil {
		t.Fatalf("decode board: %v", err)
	}
	if len(board.Entries) != 1 {
		t.Fatalf("entries: expected 1, got %d", len(board.Entries))
	}
	if board.Entries[0].PlayerName != playerName || board.Entries[0].Score != 42 || board.Entries[0].GradeRank != "D" {
		t.Errorf("unexpected entry: %+v", board.Entries[0])
	}
}

// TestIntegration_GameReward_DuplicateSession_Returns429: 同一 sessionId の2回目は 429 となりコインが増えないことを検証する
func TestIntegration_GameReward_DuplicateSession_Returns429(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	playerName := "二重テスト"
	reqP := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(fmt.Sprintf(`{"name":%q}`, playerName)))
	reqP.Header.Set("Content-Type", "application/json")
	wP := httptest.NewRecorder()
	r.ServeHTTP(wP, reqP)
	if wP.Code != http.StatusCreated {
		t.Fatalf("プレイヤー作成: %d", wP.Code)
	}

	sessionID := "22222222-2222-2222-2222-222222222222"
	body := fmt.Sprintf(`{"gameType":"shooting","rank":"C","score":10,"sessionId":%q}`, sessionID)
	path := "/api/players/" + playerName + "/game-reward"

	req1 := httptest.NewRequest(http.MethodPost, path, bytes.NewBufferString(body))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("1回目: %d %s", w1.Code, w1.Body.String())
	}

	var first struct {
		NewCoins int `json:"newCoins"`
	}
	if err := json.NewDecoder(w1.Body).Decode(&first); err != nil {
		t.Fatalf("1回目 decode: %v", err)
	}

	req2 := httptest.NewRequest(http.MethodPost, path, bytes.NewBufferString(body))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusTooManyRequests {
		t.Fatalf("2回目: expected 429, got %d: %s", w2.Code, w2.Body.String())
	}

	req3 := httptest.NewRequest(http.MethodGet, "/api/players/"+playerName, nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	var p model.Player
	if err := json.NewDecoder(w3.Body).Decode(&p); err != nil {
		t.Fatalf("get player: %v", err)
	}
	if p.Coins != first.NewCoins {
		t.Errorf("2回目失敗後もコインは変わらないこと: expected %d, got %d", first.NewCoins, p.Coins)
	}
}

// TestIntegration_GameResults_Leaderboard_OneRowPerPlayer: 同一プレイヤーの複数プレイは最高スコア1件のみがランキングに載る
func TestIntegration_GameResults_Leaderboard_OneRowPerPlayer(t *testing.T) {
	database := integrationDB(t)
	cleanTables(t, database)
	r := buildRouter("*", database)

	playerName := "HS同一"
	reqP := httptest.NewRequest(http.MethodPost, "/api/players", bytes.NewBufferString(fmt.Sprintf(`{"name":%q}`, playerName)))
	reqP.Header.Set("Content-Type", "application/json")
	wP := httptest.NewRecorder()
	r.ServeHTTP(wP, reqP)
	if wP.Code != http.StatusCreated {
		t.Fatalf("プレイヤー作成: %d", wP.Code)
	}

	path := "/api/players/" + playerName + "/game-reward"
	post := func(sessionID, body string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(http.MethodPost, path, bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w
	}

	w1 := post("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", fmt.Sprintf(`{"gameType":"shooting","rank":"D","score":10,"sessionId":%q}`, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
	if w1.Code != http.StatusOK {
		t.Fatalf("1プレイ目: %d %s", w1.Code, w1.Body.String())
	}
	w2 := post("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", fmt.Sprintf(`{"gameType":"shooting","rank":"S","score":9999,"sessionId":%q}`, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"))
	if w2.Code != http.StatusOK {
		t.Fatalf("2プレイ目: %d %s", w2.Code, w2.Body.String())
	}

	reqG := httptest.NewRequest(http.MethodGet, "/api/game-results?gameType=shooting&limit=10", nil)
	wG := httptest.NewRecorder()
	r.ServeHTTP(wG, reqG)
	if wG.Code != http.StatusOK {
		t.Fatalf("game-results: %d", wG.Code)
	}
	var board struct {
		Entries []struct {
			Rank       int    `json:"rank"`
			PlayerName string `json:"playerName"`
			Score      int    `json:"score"`
			GradeRank  string `json:"gradeRank"`
		} `json:"entries"`
	}
	if err := json.NewDecoder(wG.Body).Decode(&board); err != nil {
		t.Fatalf("decode board: %v", err)
	}
	if len(board.Entries) != 1 {
		t.Fatalf("entries: expected 1 row per player, got %d", len(board.Entries))
	}
	if board.Entries[0].Score != 9999 || board.Entries[0].GradeRank != "S" {
		t.Errorf("expected best score row, got %+v", board.Entries[0])
	}
}
