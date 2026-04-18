package main

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.uber.org/dig"

	"github.com/soseki-hpb-2026/api/internal/db"
	"github.com/soseki-hpb-2026/api/internal/handler"
)

// corsAllowedOrigin は dig 上で CORS 許可オリジンを他の string と区別するための型。
type corsAllowedOrigin string

// registerHandlers は *db.DB と各コンストラクタを dig に登録する。
func registerHandlers(c *dig.Container, database *db.DB, allowedOrigin string) error {
	if err := c.Provide(func() *db.DB { return database }); err != nil {
		return err
	}
	if err := c.Provide(func() corsAllowedOrigin { return corsAllowedOrigin(allowedOrigin) }); err != nil {
		return err
	}

	if err := c.Provide(handler.NewDBMessageStore); err != nil {
		return err
	}
	if err := c.Provide(handler.NewMessages); err != nil {
		return err
	}
	if err := c.Provide(handler.NewDBPlayerStore); err != nil {
		return err
	}
	if err := c.Provide(handler.NewPlayers); err != nil {
		return err
	}
	if err := c.Provide(handler.NewBorrow); err != nil {
		return err
	}
	if err := c.Provide(handler.NewDBGameRewardStore); err != nil {
		return err
	}
	if err := c.Provide(handler.NewGameReward); err != nil {
		return err
	}
	if err := c.Provide(handler.NewDBGameResultListStore); err != nil {
		return err
	}
	if err := c.Provide(handler.NewGameResults); err != nil {
		return err
	}
	if err := c.Provide(handler.NewDBGachaStore); err != nil {
		return err
	}
	if err := c.Provide(handler.NewGacha); err != nil {
		return err
	}
	if err := c.Provide(handler.NewDBConsumeStore); err != nil {
		return err
	}
	if err := c.Provide(handler.NewConsume); err != nil {
		return err
	}
	if err := c.Provide(handler.NewDBCounterStore); err != nil {
		return err
	}
	if err := c.Provide(handler.NewCounter); err != nil {
		return err
	}
	return nil
}

// buildRouter は dig でハンドラーを組み立て、chi ルーターを返す（テストからも利用）。
func buildRouter(allowedOrigin string, database *db.DB) *chi.Mux {
	c := dig.New()
	if err := registerHandlers(c, database, allowedOrigin); err != nil {
		panic(err)
	}
	var mux *chi.Mux
	err := c.Invoke(func(
		origin corsAllowedOrigin,
		msg *handler.Messages,
		players *handler.Players,
		borrow *handler.Borrow,
		gameReward *handler.GameReward,
		gameResults *handler.GameResults,
		gacha *handler.Gacha,
		consume *handler.Consume,
		counter *handler.Counter,
	) {
		mux = mountRoutes(string(origin), msg, players, borrow, gameReward, gameResults, gacha, consume, counter)
	})
	if err != nil {
		panic(err)
	}
	return mux
}

func mountRoutes(
	allowedOrigin string,
	msg *handler.Messages,
	players *handler.Players,
	borrow *handler.Borrow,
	gameReward *handler.GameReward,
	gameResults *handler.GameResults,
	gacha *handler.Gacha,
	consume *handler.Consume,
	counter *handler.Counter,
) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{allowedOrigin},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", healthHandler)

	r.Get("/api/messages", msg.List)
	r.Post("/api/messages", msg.Create)

	r.Post("/api/players", players.Create)
	r.Get("/api/players/{name}", players.Get)
	r.Post("/api/players/{name}/borrow", borrow.Create)
	r.Post("/api/players/{name}/game-reward", gameReward.Create)

	r.Get("/api/game-results", gameResults.List)

	r.Post("/api/gacha", gacha.Create)
	r.Post("/api/gacha/multi", gacha.CreateMulti)

	r.Post("/api/players/{name}/items/{item_id}/consume", consume.Create)

	r.Post("/api/counter", counter.Create)

	return r
}
