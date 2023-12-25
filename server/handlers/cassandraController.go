package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func C_CreatePost(c *fiber.Ctx) error {
	input := new(services.C_PostParams)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	postId, err := services.C_CreatePost(input)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": postId,
	})
}

func C_GetPosts(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 1)
	userId, _ := c.Locals("userId").(string)
	posts, err := services.C_GetPosts(limit, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(posts)
}

func C_GetPostById(c *fiber.Ctx) error {
	id := c.Params("id")
	userId, _ := c.Locals("userId").(string)
	post, err := services.C_GetPostById(id, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(post)
}

func C_CreateComment(c *fiber.Ctx) error {
	id := c.Params("id")
	input := new(services.C_CommentParams)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	commentId, err := services.C_CreateComment(id, input)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": commentId,
	})
}

func C_GetComments(c *fiber.Ctx) error {
	id := c.Params("id")
	userId, _ := c.Locals("userId").(string)
	comments, err := services.C_GetComments(id, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(comments)
}

func C_CreateUser(c *fiber.Ctx) error {
	input := new(services.C_UserParams)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	userId, err := services.C_CreateUser(input)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": userId,
	})
}

func C_GetUserById(c *fiber.Ctx) error {
	id := c.Params("id")
	user, err := services.C_GetUserById(id)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(user)
}

func C_GetUsers(c *fiber.Ctx) error {
	users, err := services.C_GetUsers()
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(users)
}

func C_GetUserPosts(c *fiber.Ctx) error {
	id := c.Params("id")
	userId, _ := c.Locals("userId").(string)
	posts, err := services.C_GetUserPosts(id, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(posts)
}

func C_CreateResponse(c *fiber.Ctx) error {
	id := c.Params("id")
	input := new(services.C_ResponseParams)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	responseId, err := services.C_CreateResponse(id, input)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": responseId,
	})
}

func C_GetResponses(c *fiber.Ctx) error {
	id := c.Params("id")
	userId, _ := c.Locals("userId").(string)
	responses, err := services.C_GetResponses(id, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(responses)
}

func T_CreatePost(c *fiber.Ctx) error {
	type Input struct {
		services.PostParams
		UserId string `json:"userId"`
	}
	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	postId, err := services.CreatePost(input.UserId, &input.PostParams)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": postId,
	})
}
