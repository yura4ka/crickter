package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addUserRouter(app *fiber.App) {
	post := app.Group("user")

	post.Get("/:id", handlers.GetUserInfo)
	post.Get("/:userId/posts", middleware.ParseAuth, handlers.GetUserPosts)
	post.Post("/:userId/follow", middleware.RequireAuth, handlers.HandleFollow)
	post.Post("/:userId/unfollow", middleware.RequireAuth, handlers.HandleUnFollow)
	post.Get("/:userId/following", middleware.ParseAuth, handlers.GetFollowing)
	post.Get("/:userId/followers", middleware.ParseAuth, handlers.GetFollowers)
}
