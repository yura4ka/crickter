package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

type CommentReaction struct {
	ent.Schema
}

func (CommentReaction) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Unique().Default(uuid.New),
		field.Bool("liked"),
	}
}

func (CommentReaction) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("comment", Comment.Type).Ref("reactions").Unique(),
		edge.From("user", User.Type).Ref("commentReactions").Unique(),
	}
}

func (CommentReaction) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("comment", "user").Unique(),
	}
}
