package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addMessageRouter(app *fiber.App) {
	message := app.Group("message")

	message.Post("/", middleware.RequireAuth, handlers.CreateMessage)
	message.Patch("/:id", middleware.RequireAuth, handlers.EditMessage)
	message.Delete("/:id", middleware.RequireAuth, handlers.DeleteMessage)
	message.Get("/:id/changes", middleware.RequireAuth, handlers.GetMessageChanges)
}
