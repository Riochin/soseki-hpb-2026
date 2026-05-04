package gacha

import (
	"math/rand"
	"testing"

	"github.com/soseki-hpb-2026/api/internal/model"
)

func TestSelectWeightedItem_SingleItem_AlwaysReturnsIt(t *testing.T) {
	items := []model.Item{
		{ID: 1, Name: "唯一アイテム", Rarity: "UR", Weight: 100},
	}
	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 100; i++ {
		got := SelectWeightedItem(items, rng)
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
		got := SelectWeightedItem(items, rng)
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
		got := SelectWeightedItem(items, rng)
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
