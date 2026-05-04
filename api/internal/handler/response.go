package handler

import (
	"encoding/json"
	"net/http"
)

// writeError は JSON エラーレスポンスを書き込む。
func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
