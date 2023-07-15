package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/aymericbeaumet/go-tsvector"
	"github.com/google/uuid"
)

type Post struct {
	ent.Schema
}

func (Post) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Unique().Default(uuid.New),
		field.Time("createdAt").Default(time.Now()),
		field.Time("updatedAt").Default(time.Now()).UpdateDefault(time.Now),
		field.String("text").MaxLen(512),
		field.UUID("userId", uuid.UUID{}),
		field.Other("postTsv", &tsvector.TSVector{}).
			SchemaType(map[string]string{
				dialect.Postgres: "tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED",
			}),
	}
}

func (Post) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("posts").Field("userId").Unique().Required(),
		edge.To("reposts", Post.Type).From("original").Unique(),
		edge.To("comments", Comment.Type),
		edge.To("reactions", PostReaction.Type),
	}
}

func (Post) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("userId"),
		index.Fields("postTsv").Annotations(entsql.IndexType("GIN")),
	}
}
