package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func Register(c *fiber.Ctx) error {
	input := new(services.NewUser)

	if err := c.BodyParser(input); err != nil {
		log.Fatal(err)
		return c.SendStatus(400)
	}

	id, err := services.CreateUser(input)

	if err != nil {
		log.Fatal(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": id,
	})
}

func Login(c *fiber.Ctx) error {
	return c.SendString("login")
}

func Refresh(c *fiber.Ctx) error {
	return c.SendString("refresh")
}
