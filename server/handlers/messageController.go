package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func CreateMessage(c *fiber.Ctx) error {
	input := new(services.CreateMessageRequest)
	if err := c.BodyParser(&input); err != nil {
		return c.SendStatus(400)
	}
	userId, _ := c.Locals("userId").(string)

	id, err := services.CreateMessage(input, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(id)
}
