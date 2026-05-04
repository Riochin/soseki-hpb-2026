package apperr

import "errors"

var ErrNotFound = errors.New("not found")
var ErrInsufficientCoins = errors.New("insufficient coins")
var ErrDuplicateGameSession = errors.New("duplicate game session")
var ErrNotGiftable = errors.New("item is not giftable")
var ErrAlreadyConsumed = errors.New("item already consumed")
