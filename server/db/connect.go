package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var Client *sql.DB

func Connect() {
	var err error
	Client, err = sql.Open("postgres", os.Getenv("DB_CONNECTION"))

	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}
}
