package db

import (
	"context"
	"log"
	"os"

	_ "github.com/lib/pq"
	"github.com/yura4ka/crickter/ent"
)

var Client *ent.Client

func Connect() {
	var err error
	Client, err = ent.Open("postgres", os.Getenv("DB_CONNECTION"))
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}

	if err := Client.Schema.Create(context.Background()); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}
}
