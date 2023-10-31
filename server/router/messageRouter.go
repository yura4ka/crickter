package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addMessageRouter(app *fiber.App) {
	message := app.Group("message")

	message.Post("/", middleware.RequireAuth, handlers.CreateMessage)
}
