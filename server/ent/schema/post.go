package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
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
	}
}

func (Post) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("posts").Field("userId").Unique().Required(),
		edge.From("likedBy", User.Type).Ref("likedPosts"),
	}
}

func (Post) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("userId"),
	}
}
