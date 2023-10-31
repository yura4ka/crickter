package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
	"github.com/yura4ka/crickter/middleware"
)

func addConversationRouter(app *fiber.App) {
	conversation := app.Group("conversation")

	conversation.Get("/", middleware.RequireAuth, handlers.GetConversations)
	conversation.Post("/", middleware.RequireAuth, handlers.CreateConversation)
	conversation.Post("/:id/add", middleware.RequireAuth, handlers.AddUsersToConversation)
	conversation.Post("/:id/kick", middleware.RequireAuth, handlers.KickUser)
	conversation.Post("/:id/leave", middleware.RequireAuth, handlers.LeaveConversation)
	conversation.Post("/:id/join", middleware.RequireAuth, handlers.JoinConversation)
	conversation.Get("/:id", middleware.RequireAuth, handlers.GetConversationInfo)
}
