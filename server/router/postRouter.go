package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addPostRouter(app *fiber.App) {
	post := app.Group("post")

	post.Get("/", middleware.ParseAuth, handlers.GetPosts)
	post.Post("/", middleware.RequireAuth, handlers.CreatePost)
	post.Patch("/:id", middleware.RequireAuth, handlers.UpdatePost)
	post.Post("/reaction", middleware.RequireAuth, handlers.ProcessReaction)
	post.Get("/favorite", middleware.RequireAuth, handlers.GetFavoritePosts)
	post.Get("/:id", middleware.ParseAuth, handlers.GetPostById)
	post.Post("/favorite", middleware.RequireAuth, handlers.ProcessFavorite)
	post.Delete("/:id", middleware.RequireAuth, handlers.DeletePost)
}
