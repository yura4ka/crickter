package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
)

func addAuthRouter(app *fiber.App) {
	auth := app.Group("auth")

	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Get("/refresh", handlers.Refresh)
	auth.Post("/checkEmail", handlers.CheckEmail)
	auth.Get("/logout", handlers.Logout)
	auth.Post("/checkUsername", handlers.CheckUsername)
}
