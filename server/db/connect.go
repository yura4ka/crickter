package db

import (
	"context"
	"log"
	"os"

	atlas "ariga.io/atlas/sql/schema"
	"entgo.io/ent/dialect/sql/schema"
	_ "github.com/lib/pq"
	"github.com/yura4ka/crickter/ent"
	"github.com/yura4ka/crickter/ent/migrate"
)

var postTsvError = `changing the generation expression for a column "post_tsv" is not supported`

var Client *ent.Client
var Ctx context.Context

func Connect() {
	var err error
	Client, err = ent.Open("postgres", os.Getenv("DB_CONNECTION"))
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}

	err = Client.Schema.Create(
		context.Background(),
		migrate.WithDropIndex(true),
		migrate.WithDropColumn(true),
		schema.WithDiffHook(postTsvDiffHook),
	)

	if err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	Ctx = context.Background()
}

func postTsvDiffHook(next schema.Differ) schema.Differ {
	return schema.DiffFunc(func(current, desired *atlas.Schema) ([]atlas.Change, error) {
		for _, table := range desired.Tables {
			if table.Name == "posts" {
				for _, column := range table.Columns {
					if column.Name == "post_tsv" {
						column.SetNull(false)
						column.SetGeneratedExpr(&atlas.GeneratedExpr{
							Expr: `to_tsvector('english', text)`,
						})
					}
				}
			}
		}

		changes, err := next.Diff(current, desired)

		if err != nil && err.Error() != postTsvError {
			return nil, err
		}

		return changes, nil
	})
}
