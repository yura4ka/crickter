package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addUserRouter(app *fiber.App) {
	user := app.Group("user")

	user.Get("/:userId", middleware.ParseAuth, handlers.GetUserInfo)
	user.Get("/:userId/posts", middleware.ParseAuth, handlers.GetUserPosts)
	user.Post("/:userId/follow", middleware.RequireAuth, handlers.HandleFollow)
	user.Post("/:userId/unfollow", middleware.RequireAuth, handlers.HandleUnFollow)
	user.Get("/:userId/following", middleware.ParseAuth, handlers.GetFollowing)
	user.Get("/:userId/followers", middleware.ParseAuth, handlers.GetFollowers)
	user.Post("/:userId/block", middleware.RequireAuth, handlers.BlockUser)
	user.Post("/:userId/unblock", middleware.RequireAuth, handlers.UnblockUser)
	user.Get("/:userId/blocked/:type", middleware.RequireAuth, handlers.IsUserBlocked)
	user.Patch("/", middleware.RequireAuth, handlers.ChangeUser)
	user.Delete("/", middleware.RequireAuth, handlers.DeleteUser)
}
