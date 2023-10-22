package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addTagRouter(app *fiber.App) {
	tag := app.Group("tags")

	tag.Get("/popular", handlers.GetPopularTags)
	tag.Get("/", handlers.GetTags)
	tag.Get("/:tag/posts", middleware.ParseAuth, handlers.GetTagPosts)
}
