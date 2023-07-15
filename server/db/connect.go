package db

import (
	"context"
	"log"
	"os"

	_ "github.com/lib/pq"
	"github.com/yura4ka/crickter/ent"
	"github.com/yura4ka/crickter/ent/migrate"
)

var Client *ent.Client
var Ctx context.Context

func Connect() {
	var err error
	Client, err = ent.Open("postgres", os.Getenv("DB_CONNECTION"))
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}

	err = Client.Debug().Schema.Create(
		context.Background(),
		migrate.WithDropIndex(true),
		migrate.WithDropColumn(true),
	)

	if err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	Ctx = context.Background()
}
