package model

import "time"

// Message はメッセージ寄せ書き1件を表す。
type Message struct {
	ID        int       `json:"id"`
	Author    string    `json:"author"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"createdAt"`
}
