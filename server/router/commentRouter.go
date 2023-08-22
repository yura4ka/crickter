package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addCommentRouter(app *fiber.App) {
	comment := app.Group("comment")

	comment.Get("/:postId", middleware.ParseAuth, handlers.GetComments)
	comment.Post("/:postId", middleware.RequireAuth, handlers.PostComment)
}
