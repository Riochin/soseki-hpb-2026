package handler

import "testing"

func TestCalcFaceMemoryReward(t *testing.T) {
	tests := []struct {
		rank      string
		timeLimit int
		want      int
	}{
		{"S", 1, 1200},
		{"S", 2, 3600}, // 1200 * 3
		{"D", 1, 100},
		{"D", 2, 300},
		{"", 1, 100},
	}
	for _, tt := range tests {
		got := calcFaceMemoryReward(tt.rank, tt.timeLimit)
		if got != tt.want {
			t.Errorf("calcFaceMemoryReward(%q, %d) = %d; want %d", tt.rank, tt.timeLimit, got, tt.want)
		}
	}
}
