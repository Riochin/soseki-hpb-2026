package gacha

import (
	"math/rand"

	"github.com/soseki-hpb-2026/api/internal/model"
)

// SelectWeightedItem は重み付きランダム抽選でアイテムを1件選ぶ。
// items は空であってはならない。weight=0 のアイテムは選ばれない。
func SelectWeightedItem(items []model.Item, rng *rand.Rand) model.Item {
	total := 0
	for _, item := range items {
		total += item.Weight
	}

	n := rng.Intn(total)
	cumulative := 0
	for _, item := range items {
		cumulative += item.Weight
		if n < cumulative {
			return item
		}
	}
	// ここには到達しないはず（total > 0 が前提）
	return items[len(items)-1]
}
