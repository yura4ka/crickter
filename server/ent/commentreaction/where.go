// Code generated by ent, DO NOT EDIT.

package commentreaction

import (
	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"github.com/google/uuid"
	"github.com/yura4ka/crickter/ent/predicate"
)

// ID filters vertices based on their ID field.
func ID(id uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldEQ(FieldID, id))
}

// IDEQ applies the EQ predicate on the ID field.
func IDEQ(id uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldEQ(FieldID, id))
}

// IDNEQ applies the NEQ predicate on the ID field.
func IDNEQ(id uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldNEQ(FieldID, id))
}

// IDIn applies the In predicate on the ID field.
func IDIn(ids ...uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldIn(FieldID, ids...))
}

// IDNotIn applies the NotIn predicate on the ID field.
func IDNotIn(ids ...uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldNotIn(FieldID, ids...))
}

// IDGT applies the GT predicate on the ID field.
func IDGT(id uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldGT(FieldID, id))
}

// IDGTE applies the GTE predicate on the ID field.
func IDGTE(id uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldGTE(FieldID, id))
}

// IDLT applies the LT predicate on the ID field.
func IDLT(id uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldLT(FieldID, id))
}

// IDLTE applies the LTE predicate on the ID field.
func IDLTE(id uuid.UUID) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldLTE(FieldID, id))
}

// Liked applies equality check predicate on the "liked" field. It's identical to LikedEQ.
func Liked(v bool) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldEQ(FieldLiked, v))
}

// LikedEQ applies the EQ predicate on the "liked" field.
func LikedEQ(v bool) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldEQ(FieldLiked, v))
}

// LikedNEQ applies the NEQ predicate on the "liked" field.
func LikedNEQ(v bool) predicate.CommentReaction {
	return predicate.CommentReaction(sql.FieldNEQ(FieldLiked, v))
}

// HasComment applies the HasEdge predicate on the "comment" edge.
func HasComment() predicate.CommentReaction {
	return predicate.CommentReaction(func(s *sql.Selector) {
		step := sqlgraph.NewStep(
			sqlgraph.From(Table, FieldID),
			sqlgraph.Edge(sqlgraph.M2O, true, CommentTable, CommentColumn),
		)
		sqlgraph.HasNeighbors(s, step)
	})
}

// HasCommentWith applies the HasEdge predicate on the "comment" edge with a given conditions (other predicates).
func HasCommentWith(preds ...predicate.Comment) predicate.CommentReaction {
	return predicate.CommentReaction(func(s *sql.Selector) {
		step := newCommentStep()
		sqlgraph.HasNeighborsWith(s, step, func(s *sql.Selector) {
			for _, p := range preds {
				p(s)
			}
		})
	})
}

// HasUser applies the HasEdge predicate on the "user" edge.
func HasUser() predicate.CommentReaction {
	return predicate.CommentReaction(func(s *sql.Selector) {
		step := sqlgraph.NewStep(
			sqlgraph.From(Table, FieldID),
			sqlgraph.Edge(sqlgraph.M2O, true, UserTable, UserColumn),
		)
		sqlgraph.HasNeighbors(s, step)
	})
}

// HasUserWith applies the HasEdge predicate on the "user" edge with a given conditions (other predicates).
func HasUserWith(preds ...predicate.User) predicate.CommentReaction {
	return predicate.CommentReaction(func(s *sql.Selector) {
		step := newUserStep()
		sqlgraph.HasNeighborsWith(s, step, func(s *sql.Selector) {
			for _, p := range preds {
				p(s)
			}
		})
	})
}

// And groups predicates with the AND operator between them.
func And(predicates ...predicate.CommentReaction) predicate.CommentReaction {
	return predicate.CommentReaction(func(s *sql.Selector) {
		s1 := s.Clone().SetP(nil)
		for _, p := range predicates {
			p(s1)
		}
		s.Where(s1.P())
	})
}

// Or groups predicates with the OR operator between them.
func Or(predicates ...predicate.CommentReaction) predicate.CommentReaction {
	return predicate.CommentReaction(func(s *sql.Selector) {
		s1 := s.Clone().SetP(nil)
		for i, p := range predicates {
			if i > 0 {
				s1.Or()
			}
			p(s1)
		}
		s.Where(s1.P())
	})
}

// Not applies the not operator on the given predicate.
func Not(p predicate.CommentReaction) predicate.CommentReaction {
	return predicate.CommentReaction(func(s *sql.Selector) {
		p(s.Not())
	})
}