package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func ParseAuth(c *fiber.Ctx) error {
	cookie := strings.Split(c.Get("Authorization"), " ")
	if len(cookie) != 2 || cookie[0] != "Bearer" {
		c.Locals("userId", "")
		return c.Next()
	}

	payload, err := services.VerifyAccessToken(cookie[1])
	if err != nil {
		c.Locals("userId", "")
		return c.Next()
	}

	c.Locals("userId", payload.Id)
	return c.Next()
}
