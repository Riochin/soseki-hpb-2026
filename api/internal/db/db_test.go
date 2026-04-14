package db_test

import (
	"context"
	"testing"

	"github.com/soseki-hpb-2026/api/internal/db"
)

// TestNew_InvalidURL: 不正なURLでは New がエラーを返すことを検証する
func TestNew_InvalidURL(t *testing.T) {
	_, err := db.New(context.Background(), "not-a-valid-url")
	if err == nil {
		t.Fatal("expected error for invalid DATABASE_URL, got nil")
	}
}

// TestNew_EmptyURL: 空文字列では New がエラーを返すことを検証する
func TestNew_EmptyURL(t *testing.T) {
	_, err := db.New(context.Background(), "")
	if err == nil {
		t.Fatal("expected error for empty DATABASE_URL, got nil")
	}
}
