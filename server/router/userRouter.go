package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addUserRouter(app *fiber.App) {
	post := app.Group("user")

	post.Get("/:id", handlers.GetUserInfo)
	post.Get("/:id/posts", middleware.ParseAuth, handlers.GetUserPosts)
}
