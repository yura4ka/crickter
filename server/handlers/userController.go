package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func GetUserInfo(c *fiber.Ctx) error {
	id := c.Params("id")
	requestUserId, _ := c.Locals("userId").(string)
	user, err := services.GetUserInfo(id, requestUserId)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}
	return c.JSON(user)
}

func GetUserPosts(c *fiber.Ctx) error {
	userId := c.Params("userId")
	requestUserId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)

	posts, err := services.GetPosts(
		&services.QueryParams{UserId: userId, RequestUserId: requestUserId, Page: page, OrderBy: services.SortNew},
	)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	hasMore, err := services.HasUserMorePosts(userId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"posts":   posts,
		"hasMore": hasMore,
	})
}

func FollowHandler(c *fiber.Ctx, follow bool) error {
	userId := c.Params("userId")
	followerId, _ := c.Locals("userId").(string)
	if userId == followerId {
		return c.SendStatus(400)
	}

	var err error
	if follow {
		err = services.HandleFollow(userId, followerId)
	} else {
		err = services.HandleUnFollow(userId, followerId)
	}

	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.SendStatus(200)
}

func HandleFollow(c *fiber.Ctx) error {
	return FollowHandler(c, true)
}

func HandleUnFollow(c *fiber.Ctx) error {
	return FollowHandler(c, false)
}

func GetFollowing(c *fiber.Ctx) error {
	userId := c.Params("userId")
	requestUserId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)

	following, err := services.GetFollowing(userId, requestUserId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	hasMore, err := services.HasMoreFollowing(userId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"users":   following,
		"hasMore": hasMore,
	})
}

func GetFollowers(c *fiber.Ctx) error {
	userId := c.Params("userId")
	requestUserId, _ := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)

	followers, err := services.GetFollowers(userId, requestUserId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	hasMore, err := services.HasMoreFollowers(userId, page)
	if err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"users":   followers,
		"hasMore": hasMore,
	})
}
