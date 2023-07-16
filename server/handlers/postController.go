package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func CreatePost(c *fiber.Ctx) error {
	type Input struct {
		Text     string  `json:"text"`
		ParentId *string `json:"parentId"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}
	userId := c.Locals("userId").(string)

	postId, err := services.CreatePost(userId, input.Text, input.ParentId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": postId,
	})
}
