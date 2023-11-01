package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func GetPopularTags(c *fiber.Ctx) error {
	tags, err := services.GetTags(-1)
	if err != nil {
		return c.SendStatus(500)
	}
	return c.JSON(fiber.Map{
		"tags": tags,
	})
}

func GetTags(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	tags, err := services.GetTags(page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(500)
	}
	hasMore, err := services.HasMoreTags(page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(500)
	}
	return c.JSON(fiber.Map{
		"tags":    tags,
		"hasMore": hasMore,
	})
}

func GetTagPosts(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)
	tag := c.Params("tag")

	posts, err := services.GetPosts(
		&services.QueryParams{Tag: tag, Page: page, RequestUserId: userId, OrderBy: services.SortNew},
	)

	if err != nil {
		return c.SendStatus(400)
	}

	hasMore, err := services.HasTagMorePosts(tag, page)

	if err != nil {
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"posts":   posts,
		"hasMore": hasMore,
	})
}
