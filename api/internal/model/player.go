package model

// Player はプレイヤー1人分の状態を表す。
type Player struct {
	Name       string           `json:"name"`
	Coins      int              `json:"coins"`
	Debt       int              `json:"debt"`
	Collection []CollectionItem `json:"collection"`
}

// CollectionItem は全アイテムの一覧と獲得状態を表す。
type CollectionItem struct {
	ItemID     int     `json:"itemId"`
	Name       string  `json:"name"`
	Rarity     string  `json:"rarity"`
	Icon       string  `json:"icon"`
	Acquired   bool    `json:"acquired"`
	IsGiftable bool    `json:"is_giftable"`
	ProposedBy *string `json:"proposed_by"`
	IsConsumed bool    `json:"is_consumed"`
}
