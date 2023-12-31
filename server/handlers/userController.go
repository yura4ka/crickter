package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/crickter/services"
)

func GetUserInfo(c *fiber.Ctx) error {
	id := c.Params("userId")
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

func ChangeUser(c *fiber.Ctx) error {
	input := new(services.ChangeUserRequest)
	if err := c.BodyParser(input); err != nil {
		log.Print(err)
		return c.SendStatus(400)
	}
	userId, _ := c.Locals("userId").(string)

	if err := services.ChangeUser(userId, input); err != nil {
		c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func DeleteUser(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	err := services.DeleteUser(userId)
	if err != nil {
		log.Print(err)
		c.SendStatus(400)
	}

	c.Cookie(services.ClearRefreshCookie())
	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func BlockUser(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	blockUser := c.Params("userId")

	err := services.BlockUser(userId, blockUser)
	if err != nil {
		log.Print(err)
		c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func UnblockUser(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	blockUser := c.Params("userId")

	err := services.UnblockUser(userId, blockUser)
	if err != nil {
		log.Print(err)
		c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func IsUserBlocked(c *fiber.Ctx) error {
	userId, _ := c.Locals("userId").(string)
	checkUser := c.Params("userId")
	isMeBlocked := c.Params("type") == "me"

	var err error
	var isBlocked bool

	if isMeBlocked {
		isBlocked, err = services.IsUserBlocked(checkUser, userId)
	} else {
		isBlocked, err = services.IsUserBlocked(userId, checkUser)
	}

	if err != nil {
		log.Print(err)
		c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"isBlocked": isBlocked,
	})
}
