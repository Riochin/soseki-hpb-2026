package model

import "time"

// Message はメッセージ寄せ書き1件を表す。
type Message struct {
	ID        int       `json:"id"`
	Author    string    `json:"author"`
	Username  *string   `json:"username,omitempty"`
	Text      string    `json:"text"`
	BgColor   string    `json:"bgColor"`
	BgStyle   string    `json:"bgStyle"`
	Font      string    `json:"font"`
	Stamp     *string   `json:"stamp,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}
