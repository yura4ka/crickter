package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *fiber.Ctx) error {
	input := new(services.NewUser)

	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	id, err := services.CreateUser(input)

	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": id,
	})
}

func Login(c *fiber.Ctx) error {
	type Input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}

	user, err := services.GetUserByEmail(input.Email)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)) != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	access, _ := services.CreateAccessToken(services.TokenPayload{Id: user.ID.String()})
	refresh, _ := services.CreateRefreshToken(services.TokenPayload{Id: user.ID.String()})
	if access == "" || refresh == "" {
		log.Print("Error creating token")
		return c.SendStatus(400)
	}

	c.Cookie(services.CreateRefreshCookie(refresh))
	return c.JSON(fiber.Map{
		"access": access,
	})
}

func Refresh(c *fiber.Ctx) error {
	refresh := c.Cookies("refresh_token")
	payload, err := services.VerifyRefreshToken(refresh)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	user, err := services.GetUserById(payload.Id)
	if err != nil {
		log.Print(err)
		c.ClearCookie()
		return c.SendStatus(400)
	}

	newAccess, _ := services.CreateAccessToken(services.TokenPayload{Id: payload.Id})
	newRefresh, _ := services.CreateRefreshToken(services.TokenPayload{Id: payload.Id})
	if newAccess == "" || newRefresh == "" {
		log.Print("Error creating token")
		return c.SendStatus(400)
	}

	c.Cookie(services.CreateRefreshCookie(newRefresh))
	return c.JSON(fiber.Map{
		"token": newAccess,
		"user": fiber.Map{
			"email":    user.Email,
			"username": user.Username,
		},
	})
}

func CheckEmail(c *fiber.Ctx) error {
	type Input struct {
		Email string `json:"email"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}

	_, err := services.GetUserByEmail(input.Email)
	if err != nil {
		return c.SendStatus(200)
	}
	return c.SendStatus(400)

}
