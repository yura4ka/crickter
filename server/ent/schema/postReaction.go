package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

type PostReaction struct {
	ent.Schema
}

func (PostReaction) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Unique().Default(uuid.New),
		field.Bool("liked"),
	}
}

func (PostReaction) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("post", Post.Type).Ref("reactions").Unique(),
		edge.From("user", User.Type).Ref("postReactions").Unique(),
	}
}

func (PostReaction) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("post", "user").Unique(),
	}
}
