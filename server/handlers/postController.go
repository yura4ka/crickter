package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func CreatePost(c *fiber.Ctx) error {
	type Input struct {
		Text         string  `json:"text"`
		OriginalId   *string `json:"originalId"`
		CommentToId  *string `json:"commentToId"`
		ResponseToId *string `json:"responseToId"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}
	userId := c.Locals("userId").(string)

	postId, err := services.CreatePost(userId, input.Text, input.OriginalId, input.CommentToId, input.ResponseToId)
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

	if post.UserId != userId {
		return c.SendStatus(403)
	}

	err = services.UpdatePost(input.Id, input.Text)
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
	page := c.QueryInt("page", 0)

	posts, err := services.GetPosts(&services.QueryParams{UserId: userId, Page: page, OrderBy: services.SortNew})
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	hasMore, err := services.HasMorePosts(page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"posts":   posts,
		"hasMore": hasMore,
	})
}

func ProcessReaction(c *fiber.Ctx) error {
	type Input struct {
		PostId string `json:"postId"`
		Liked  bool   `json:"liked"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}
	userId := c.Locals("userId").(string)

	err := services.ProcessReaction(userId, input.PostId, input.Liked)
	if err != nil {
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func GetPostById(c *fiber.Ctx) error {
	id := c.Params("id")
	userId, _ := c.Locals("userId").(string)

	post, err := services.QueryPostById(id, userId)

	if err != nil {
		return c.SendStatus(400)
	}

	return c.JSON(post)
}
