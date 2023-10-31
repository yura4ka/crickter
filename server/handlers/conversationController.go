package handlers

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func CreateConversation(c *fiber.Ctx) error {
	input := new(services.CreateConversationRequest)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}
	userId := c.Locals("userId").(string)

	id, err := services.CreateConversation(userId, input)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(id)
}

func GetConversations(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	conv, err := services.GetConversations(userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(conv)
}

func AddUsersToConversation(c *fiber.Ctx) error {
	type Input struct {
		Users []string `json:"users"`
	}
	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	userId := c.Locals("userId").(string)
	convId := c.Params("id")

	err := services.AddUsersToConversation(userId, convId, input.Users)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.SendStatus(200)
}

func KickUser(c *fiber.Ctx) error {
	type Input struct {
		UserId string `json:"userId"`
	}
	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	userId := c.Locals("userId").(string)
	convId := c.Params("id")

	err := services.KickUser(convId, input.UserId, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.SendStatus(200)
}

func LeaveConversation(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	convId := c.Params("id")

	err := services.LeaveConversation(convId, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.SendStatus(200)
}

func GetConversationInfo(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	convId := c.Params("id")
	info, err := services.GetConversationInfo(convId, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}
	return c.JSON(info)
}

func JoinConversation(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	convId := c.Params("id")
	err := services.JoinConversation(convId, userId)
	if err != nil {
		log.Print(err)
		if errors.Is(err, services.ErrUserKicked) {
			return c.Status(400).JSON(fiber.Map{
				"error": "user has been kicked from the conversation",
			})
		}
		return c.SendStatus(400)
	}
	return c.SendStatus(200)
}
