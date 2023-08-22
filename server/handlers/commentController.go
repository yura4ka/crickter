package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func GetComments(c *fiber.Ctx) error {
	postId := c.Params("postId")
	userId, _ := c.Locals("userId").(string)

	return c.JSON(fiber.Map{
		"id":     postId,
		"userId": userId,
	})
}

func PostComment(c *fiber.Ctx) error {
	type Input struct {
		Text     string  `json:"text"`
		ParentId *string `json:"parentId"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}

	postId := c.Params("postId")
	userId, _ := c.Locals("userId").(string)

	id, err := services.CreateComment(postId, userId, input.Text, input.ParentId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": id,
	})
}
