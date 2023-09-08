package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func GetUserInfo(c *fiber.Ctx) error {
	id := c.Params("id")
	user, err := services.GetUserInfo(id)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}
	return c.JSON(user)
}

func GetUserPosts(c *fiber.Ctx) error {
	userId := c.Params("id")
	requestUserId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)

	posts, err := services.GetPosts(&services.QueryParams{UserId: userId, RequestUserId: requestUserId, Page: page})
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	hasMore, err := services.HasUserMorePosts(userId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"posts":   posts,
		"hasMore": hasMore,
	})
}
