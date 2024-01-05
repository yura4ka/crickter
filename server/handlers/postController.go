package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func CreatePost(c *fiber.Ctx) error {
	input := new(services.PostParams)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}
	userId := c.Locals("userId").(string)

	if len(input.Text) == 0 && len(input.Media) == 0 {
		return c.SendStatus(400)
	}

	postId, err := services.CreatePost(userId, input)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": postId,
	})
}

func UpdatePost(c *fiber.Ctx) error {
	input := new(services.PostUpdateRequest)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}
	userId := c.Locals("userId").(string)
	id := c.Params("id")

	post, err := services.GetPostById(id)

	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	if post.UserId != userId {
		return c.SendStatus(403)
	}

	err = services.UpdatePost(id, input)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func GetPosts(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)

	posts, err := services.GetPosts(&services.QueryParams{RequestUserId: userId, Page: page, OrderBy: services.SortNew})
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
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(post)
}

func ProcessFavorite(c *fiber.Ctx) error {
	type Input struct {
		PostId string `json:"postId"`
	}

	input := new(Input)
	if err := c.BodyParser(input); err != nil {
		return c.SendStatus(400)
	}

	userId, _ := c.Locals("userId").(string)

	if err := services.ProcessFavorite(input.PostId, userId); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func GetFavoritePosts(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)

	posts, err := services.GetFavoritePosts(userId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}
	hasMore, err := services.HasMoreFavorite(userId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"posts":   posts,
		"hasMore": hasMore,
	})
}

func DeletePost(c *fiber.Ctx) error {
	postId := c.Params("id")
	userId, _ := c.Locals("userId").(string)

	err := services.DeletePost(postId, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func GetPostHistory(c *fiber.Ctx) error {
	postId := c.Params("id")
	userId, _ := c.Locals("userId").(string)

	post, err := services.GetPostById(postId)
	if err != nil || post.UserId != userId {
		return c.SendStatus(400)
	}

	history, err := services.GetPostHistory(postId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"changes": history.Changes,
		"media":   history.Media,
	})
}

func GetPostsBySearch(c *fiber.Ctx) error {
	q := c.Query("q")
	if q == "" {
		return c.SendStatus(400)
	}
	userId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)

	posts, err := services.SearchPosts(q, page, userId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	hasMore, err := services.HasSearchMorePosts(q, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"posts":   posts,
		"hasMore": hasMore,
	})
}
