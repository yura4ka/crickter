package schema

import (
	"regexp"
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type User struct {
	ent.Schema
}

func (User) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Unique().Default(uuid.New),
		field.String("email").Unique().Match(regexp.MustCompile(`^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$`)),
		field.String("password"),
		field.String("username").MaxLen(20),
		field.Time("createdAt").Default(time.Now),
	}
}

func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("posts", Post.Type),
		edge.To("likedPosts", Post.Type),
		edge.To("following", User.Type).From("followers"),
	}
}
