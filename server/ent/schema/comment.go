package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type Comment struct {
	ent.Schema
}

func (Comment) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Unique().Default(uuid.New),
		field.Time("createdAt").Default(time.Now()),
		field.Time("updatedAt").Default(time.Now()).UpdateDefault(time.Now),
		field.String("text").
			SchemaType(map[string]string{
				dialect.Postgres: "VARCHAR(256)",
			}).MaxLen(256),
	}
}

func (Comment) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("post", Post.Type).Ref("comments").Unique(),
		edge.To("replies", Comment.Type).From("parent").Unique(),
		edge.To("reactions", CommentReaction.Type),
	}
}
