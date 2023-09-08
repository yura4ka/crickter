package router

import "github.com/gofiber/fiber/v2"

func SetupRouter(app *fiber.App) {
	addAuthRouter(app)
	addPostRouter(app)
	addCommentRouter(app)
	addUserRouter(app)
}
