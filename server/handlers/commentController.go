package handlers

import "github.com/gofiber/fiber/v2"

func GetComments(c *fiber.Ctx) error {
	postId := c.Params("postId")
	userId, _ := c.Locals("userId").(string)

	return c.JSON(fiber.Map{
		"id":     postId,
		"userId": userId,
	})
}
