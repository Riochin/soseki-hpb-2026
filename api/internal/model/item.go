package model

// Item はガチャのアイテムマスターデータを表す。
type Item struct {
	ID         int     `json:"id"`
	Name       string  `json:"name"`
	Rarity     string  `json:"rarity"`
	Icon       string  `json:"icon"`
	Weight     int     `json:"weight"`
	ProposedBy *string `json:"proposed_by"`
	IsGiftable bool    `json:"is_giftable"`
}
