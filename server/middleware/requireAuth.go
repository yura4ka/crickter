package middleware

import (
	"errors"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/yura4ka/crickter/services"
)

func RequireAuth(c *fiber.Ctx) error {
	cookie := strings.Split(c.Get("Authorization"), " ")
	if len(cookie) != 2 || cookie[0] != "Bearer" {
		return c.SendStatus(401)
	}

	payload, err := services.VerifyAccessToken(cookie[1])
	if errors.Is(err, jwt.ErrTokenExpired) {
		return c.SendStatus(401)
	} else if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	c.Locals("userId", payload.Id)
	return c.Next()
}
