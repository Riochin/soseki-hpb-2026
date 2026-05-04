package reward

// CalcCoinReward はゲーム種別に応じた報酬計算関数へ委譲する。
func CalcCoinReward(gameType, rank string, timeLimit, score int) int {
	switch gameType {
	case "typing":
		return calcTypingReward(rank, timeLimit)
	case "shooting":
		return calcShootingReward(rank)
	case "face_memory":
		return calcFaceMemoryReward(rank, timeLimit)
	case "quiz":
		return calcQuizReward(rank)
	case "animal_tower":
		return calcAnimalTowerReward(score)
	default:
		return 5
	}
}

// calcAnimalTowerReward は積み上げ数をそのまま Credit に換算する。
// 100 coins = 1 Credit なので score * 100。最低 1 Credit 保証。
func calcAnimalTowerReward(score int) int {
	if score < 1 {
		return 100
	}
	return (score / 2) * 100
}

// calcShootingReward はランクからシューティングゲームのコイン報酬を算出する。
//
// S=1500(15Cr), A=800(8Cr), B=400(4Cr), C=200(2Cr), D=100(1Cr)
func calcShootingReward(rank string) int {
	rewards := map[string]int{"S": 1500, "A": 800, "B": 400, "C": 200, "D": 100}
	if r, ok := rewards[rank]; ok {
		return r
	}
	return 100
}

// calcTypingReward はランクと制限時間からタイピングゲームのコイン報酬を算出する。
//
// 基準コイン (60s):
//
//	S=1000, A=500, B=300, C=200, D=100
//
// 難易度倍率:
//
//	30s → ×3.0, 60s → ×2.0, 120s → ×1.0
func calcTypingReward(rank string, timeLimit int) int {
	base := map[string]int{"S": 1000, "A": 500, "B": 300, "C": 200, "D": 100}[rank]
	if base == 0 {
		base = 5
	}
	var mult float64
	switch timeLimit {
	case 30:
		mult = 3.0
	case 120:
		mult = 1.0
	default: // 60 または未知
		mult = 2.0
	}
	if reward := int(float64(base) * mult); reward > 0 {
		return reward
	}
	return 1
}

// calcQuizReward は効果測定（〇×クイズ）のコイン報酬を算出する。
//
// S=1000(10Cr), A=600(6Cr), B=300(3Cr), C=150(1.5Cr), D=100(1Cr)
func calcQuizReward(rank string) int {
	rewards := map[string]int{"S": 1000, "A": 600, "B": 300, "C": 150, "D": 100}
	if r, ok := rewards[rank]; ok {
		return r
	}
	return 100
}

// calcFaceMemoryReward は名場面神経衰弱のコイン報酬を算出する。
// 基準（EASY, timeLimit=1）: S=1200(12Cr), A=700, B=400, C=250, D=100
// ムズすぎるな（timeLimit=2）は獲得コインを3倍。
func calcFaceMemoryReward(rank string, timeLimit int) int {
	base := map[string]int{"S": 1200, "A": 700, "B": 400, "C": 250, "D": 100}[rank]
	if base == 0 {
		base = 100
	}
	mult := 1.0
	if timeLimit == 2 {
		mult = 3.0
	}
	if reward := int(float64(base) * mult); reward > 0 {
		return reward
	}
	return 1
}
