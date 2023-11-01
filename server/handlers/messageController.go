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

func EditMessage(c *fiber.Ctx) error {
	input := new(services.EditMessageRequest)
	if err := c.BodyParser(&input); err != nil {
		return c.SendStatus(400)
	}
	userId, _ := c.Locals("userId").(string)
	messageId := c.Params("id")

	err := services.EditMessage(input, userId, messageId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.SendStatus(200)
}

func DeleteMessage(c *fiber.Ctx) error {
	type Input struct {
		OnlyCreator bool `json:"onlyCreator"`
	}
	input := new(Input)
	if err := c.BodyParser(&input); err != nil {
		return c.SendStatus(400)
	}
	userId, _ := c.Locals("userId").(string)
	messageId := c.Params("id")

	err := services.DeleteMessage(messageId, userId, input.OnlyCreator)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.SendStatus(200)
}

func GetMessageChanges(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	messageId := c.Params("id")

	changes, err := services.GetMessageChanges(messageId, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"changes": changes,
	})
}
