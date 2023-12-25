package db

import (
	"database/sql"
	"log"
	"os"

	"github.com/gocql/gocql"
	_ "github.com/lib/pq"
)

var Client *sql.DB
var Cassandra *gocql.Session

func Connect() {
	var err error
	Client, err = sql.Open("postgres", os.Getenv("DB_CONNECTION"))

	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}

	cluster := gocql.NewCluster("localhost:9042")
	cluster.Keyspace = "db"
	cluster.Consistency = gocql.Quorum
	Cassandra, err = cluster.CreateSession()
	if err != nil {
		log.Fatal(err)
	}
}
