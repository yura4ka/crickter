package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func GetComments(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 0)
	postId := c.Query("postId")

	comments, err := services.GetPosts(&services.QueryParams{UserId: userId, CommentsToId: postId, Page: page, OrderBy: services.SortPopular})
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	total, hasMore, err := services.CountComments(postId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"comments": comments,
		"total":    total,
		"hasMore":  hasMore,
	})
}

func GetResponses(c *fiber.Ctx) error {
	commentId := c.Params("commentId")
	userId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 0)
	postId := c.Query("postId")

	comments, err := services.GetPosts(&services.QueryParams{UserId: userId, ResponseToId: commentId, Page: page, OrderBy: services.SortOld})
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	total, hasMore, err := services.CountResponses(commentId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	totalComments, _, err := services.CountComments(postId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"comments":      comments,
		"total":         total,
		"hasMore":       hasMore,
		"totalComments": totalComments,
	})
}
