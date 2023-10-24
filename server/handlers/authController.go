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

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	access, _ := services.CreateAccessToken(services.TokenPayload{Id: user.ID})
	refresh, _ := services.CreateRefreshToken(services.TokenPayload{Id: user.ID})
	if access == "" || refresh == "" {
		log.Print("Error creating token")
		return c.SendStatus(400)
	}

	ucare, expire := services.CreateUcareToken(services.GetAccessMaxAge())

	c.Cookie(services.CreateRefreshCookie(refresh))
	return c.JSON(fiber.Map{
		"token":  access,
		"ucare":  ucare,
		"expire": expire,
		"user": fiber.Map{
			"id":       user.ID,
			"email":    user.Email,
			"username": user.Username,
			"name":     user.Name,
			"avatar":   user.Avatar,
		},
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
	}

	if err != nil || user.IsDeleted {
		c.Cookie(services.ClearRefreshCookie())
		return c.SendStatus(400)
	}

	newAccess, _ := services.CreateAccessToken(services.TokenPayload{Id: payload.Id})
	newRefresh, _ := services.CreateRefreshToken(services.TokenPayload{Id: payload.Id})
	if newAccess == "" || newRefresh == "" {
		log.Print("Error creating token")
		return c.SendStatus(400)
	}

	ucare, expire := services.CreateUcareToken(services.GetAccessMaxAge())

	c.Cookie(services.CreateRefreshCookie(newRefresh))
	return c.JSON(fiber.Map{
		"token":      newAccess,
		"ucareToken": ucare,
		"expire":     expire,
		"user": fiber.Map{
			"id":       user.ID,
			"email":    user.Email,
			"username": user.Username,
			"name":     user.Name,
			"avatar":   user.Avatar,
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

func Logout(c *fiber.Ctx) error {
	c.Cookie(services.ClearRefreshCookie())
	return c.SendStatus(200)
}

func CheckUsername(c *fiber.Ctx) error {
	type Input struct {
		Username string `json:"username"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}

	_, err := services.GetUserByUsername(input.Username)
	if err != nil {
		return c.SendStatus(200)
	}

	return c.SendStatus(400)
}
