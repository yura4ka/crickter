package main

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"github.com/yura4ka/crickter/db"
	"github.com/yura4ka/crickter/router"
)

func init() {
	location, _ := time.LoadLocation("UTC")
	time.Local = location

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
}

func main() {
	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowCredentials: true,
	}))

	db.Connect()
	router.SetupRouter(app)

	log.Fatal(app.Listen(os.Getenv("SERVER_ADDR")))
}
