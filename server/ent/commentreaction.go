// Code generated by ent, DO NOT EDIT.

package ent

import (
	"fmt"
	"strings"

	"entgo.io/ent"
	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"
	"github.com/yura4ka/crickter/ent/comment"
	"github.com/yura4ka/crickter/ent/commentreaction"
	"github.com/yura4ka/crickter/ent/user"
)

// CommentReaction is the model entity for the CommentReaction schema.
type CommentReaction struct {
	config `json:"-"`
	// ID of the ent.
	ID uuid.UUID `json:"id,omitempty"`
	// Liked holds the value of the "liked" field.
	Liked bool `json:"liked,omitempty"`
	// Edges holds the relations/edges for other nodes in the graph.
	// The values are being populated by the CommentReactionQuery when eager-loading is set.
	Edges                  CommentReactionEdges `json:"edges"`
	comment_reactions      *uuid.UUID
	user_comment_reactions *uuid.UUID
	selectValues           sql.SelectValues
}

// CommentReactionEdges holds the relations/edges for other nodes in the graph.
type CommentReactionEdges struct {
	// Comment holds the value of the comment edge.
	Comment *Comment `json:"comment,omitempty"`
	// User holds the value of the user edge.
	User *User `json:"user,omitempty"`
	// loadedTypes holds the information for reporting if a
	// type was loaded (or requested) in eager-loading or not.
	loadedTypes [2]bool
}

// CommentOrErr returns the Comment value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e CommentReactionEdges) CommentOrErr() (*Comment, error) {
	if e.loadedTypes[0] {
		if e.Comment == nil {
			// Edge was loaded but was not found.
			return nil, &NotFoundError{label: comment.Label}
		}
		return e.Comment, nil
	}
	return nil, &NotLoadedError{edge: "comment"}
}

// UserOrErr returns the User value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e CommentReactionEdges) UserOrErr() (*User, error) {
	if e.loadedTypes[1] {
		if e.User == nil {
			// Edge was loaded but was not found.
			return nil, &NotFoundError{label: user.Label}
		}
		return e.User, nil
	}
	return nil, &NotLoadedError{edge: "user"}
}

// scanValues returns the types for scanning values from sql.Rows.
func (*CommentReaction) scanValues(columns []string) ([]any, error) {
	values := make([]any, len(columns))
	for i := range columns {
		switch columns[i] {
		case commentreaction.FieldLiked:
			values[i] = new(sql.NullBool)
		case commentreaction.FieldID:
			values[i] = new(uuid.UUID)
		case commentreaction.ForeignKeys[0]: // comment_reactions
			values[i] = &sql.NullScanner{S: new(uuid.UUID)}
		case commentreaction.ForeignKeys[1]: // user_comment_reactions
			values[i] = &sql.NullScanner{S: new(uuid.UUID)}
		default:
			values[i] = new(sql.UnknownType)
		}
	}
	return values, nil
}

// assignValues assigns the values that were returned from sql.Rows (after scanning)
// to the CommentReaction fields.
func (cr *CommentReaction) assignValues(columns []string, values []any) error {
	if m, n := len(values), len(columns); m < n {
		return fmt.Errorf("mismatch number of scan values: %d != %d", m, n)
	}
	for i := range columns {
		switch columns[i] {
		case commentreaction.FieldID:
			if value, ok := values[i].(*uuid.UUID); !ok {
				return fmt.Errorf("unexpected type %T for field id", values[i])
			} else if value != nil {
				cr.ID = *value
			}
		case commentreaction.FieldLiked:
			if value, ok := values[i].(*sql.NullBool); !ok {
				return fmt.Errorf("unexpected type %T for field liked", values[i])
			} else if value.Valid {
				cr.Liked = value.Bool
			}
		case commentreaction.ForeignKeys[0]:
			if value, ok := values[i].(*sql.NullScanner); !ok {
				return fmt.Errorf("unexpected type %T for field comment_reactions", values[i])
			} else if value.Valid {
				cr.comment_reactions = new(uuid.UUID)
				*cr.comment_reactions = *value.S.(*uuid.UUID)
			}
		case commentreaction.ForeignKeys[1]:
			if value, ok := values[i].(*sql.NullScanner); !ok {
				return fmt.Errorf("unexpected type %T for field user_comment_reactions", values[i])
			} else if value.Valid {
				cr.user_comment_reactions = new(uuid.UUID)
				*cr.user_comment_reactions = *value.S.(*uuid.UUID)
			}
		default:
			cr.selectValues.Set(columns[i], values[i])
		}
	}
	return nil
}

// Value returns the ent.Value that was dynamically selected and assigned to the CommentReaction.
// This includes values selected through modifiers, order, etc.
func (cr *CommentReaction) Value(name string) (ent.Value, error) {
	return cr.selectValues.Get(name)
}

// QueryComment queries the "comment" edge of the CommentReaction entity.
func (cr *CommentReaction) QueryComment() *CommentQuery {
	return NewCommentReactionClient(cr.config).QueryComment(cr)
}

// QueryUser queries the "user" edge of the CommentReaction entity.
func (cr *CommentReaction) QueryUser() *UserQuery {
	return NewCommentReactionClient(cr.config).QueryUser(cr)
}

// Update returns a builder for updating this CommentReaction.
// Note that you need to call CommentReaction.Unwrap() before calling this method if this CommentReaction
// was returned from a transaction, and the transaction was committed or rolled back.
func (cr *CommentReaction) Update() *CommentReactionUpdateOne {
	return NewCommentReactionClient(cr.config).UpdateOne(cr)
}

// Unwrap unwraps the CommentReaction entity that was returned from a transaction after it was closed,
// so that all future queries will be executed through the driver which created the transaction.
func (cr *CommentReaction) Unwrap() *CommentReaction {
	_tx, ok := cr.config.driver.(*txDriver)
	if !ok {
		panic("ent: CommentReaction is not a transactional entity")
	}
	cr.config.driver = _tx.drv
	return cr
}

// String implements the fmt.Stringer.
func (cr *CommentReaction) String() string {
	var builder strings.Builder
	builder.WriteString("CommentReaction(")
	builder.WriteString(fmt.Sprintf("id=%v, ", cr.ID))
	builder.WriteString("liked=")
	builder.WriteString(fmt.Sprintf("%v", cr.Liked))
	builder.WriteByte(')')
	return builder.String()
}

// CommentReactions is a parsable slice of CommentReaction.
type CommentReactions []*CommentReaction
