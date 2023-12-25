package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/handlers"
)

func addCassandraRouter(app *fiber.App) {
	cassandra := app.Group("cassandra")

	post := cassandra.Group("post")
	post.Post("/", handlers.C_CreatePost)
	post.Get("/", handlers.C_GetPosts)
	post.Get("/:id", handlers.C_GetPostById)
	post.Post("/:id/comment", handlers.C_CreateComment)
	post.Get("/:id/comments", handlers.C_GetComments)

	user := cassandra.Group("user")
	user.Post("/", handlers.C_CreateUser)
	user.Get("/", handlers.C_GetUsers)
	user.Get("/:id", handlers.C_GetUserById)
	user.Get("/:id/posts", handlers.C_GetUserPosts)

	comment := cassandra.Group("comment")
	comment.Post("/:id/response", handlers.C_CreateResponse)
	comment.Get("/:id/responses", handlers.C_GetResponses)

	test := app.Group("test")
	test.Post("/", handlers.T_CreatePost)
}
