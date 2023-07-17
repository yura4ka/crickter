package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func CreatePost(c *fiber.Ctx) error {
	type Input struct {
		Text     string  `json:"text"`
		ParentId *string `json:"parentId"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}
	userId := c.Locals("userId").(string)

	postId, err := services.CreatePost(userId, input.Text, input.ParentId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": postId,
	})
}

func UpdatePost(c *fiber.Ctx) error {
	type Input struct {
		Id   string `json:"id"`
		Text string `json:"text"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}
	userId := c.Locals("userId").(string)

	post, err := services.GetPostById(input.Id)

	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	if post.UserId.String() != userId {
		return c.SendStatus(403)
	}

	_, err = services.UpdatePost(input.Id, input.Text)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"message": "ok",
	})
}

func GetPosts(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	posts, err := services.GetPosts(userId)

	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"posts": posts,
	})
}
