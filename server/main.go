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

	if mode := os.Getenv("MODE"); mode == "PROD" {
		return
	}

	err := godotenv.Load()
	if err != nil {
		log.Print("Error loading .env file")
	}
}

func main() {
	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("CLIENT_ADDR"),
		AllowCredentials: true,
	}))

	db.Connect()
	router.SetupRouter(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = ":8000"
	} else {
		port = ":" + port
	}

	log.Fatal(app.Listen(port))
}
