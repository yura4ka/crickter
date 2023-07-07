// Code generated by ent, DO NOT EDIT.

package commentreaction

import (
	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"github.com/google/uuid"
)

const (
	// Label holds the string label denoting the commentreaction type in the database.
	Label = "comment_reaction"
	// FieldID holds the string denoting the id field in the database.
	FieldID = "id"
	// FieldLiked holds the string denoting the liked field in the database.
	FieldLiked = "liked"
	// EdgeComment holds the string denoting the comment edge name in mutations.
	EdgeComment = "comment"
	// EdgeUser holds the string denoting the user edge name in mutations.
	EdgeUser = "user"
	// Table holds the table name of the commentreaction in the database.
	Table = "comment_reactions"
	// CommentTable is the table that holds the comment relation/edge.
	CommentTable = "comment_reactions"
	// CommentInverseTable is the table name for the Comment entity.
	// It exists in this package in order to avoid circular dependency with the "comment" package.
	CommentInverseTable = "comments"
	// CommentColumn is the table column denoting the comment relation/edge.
	CommentColumn = "comment_reactions"
	// UserTable is the table that holds the user relation/edge.
	UserTable = "comment_reactions"
	// UserInverseTable is the table name for the User entity.
	// It exists in this package in order to avoid circular dependency with the "user" package.
	UserInverseTable = "users"
	// UserColumn is the table column denoting the user relation/edge.
	UserColumn = "user_comment_reactions"
)

// Columns holds all SQL columns for commentreaction fields.
var Columns = []string{
	FieldID,
	FieldLiked,
}

// ForeignKeys holds the SQL foreign-keys that are owned by the "comment_reactions"
// table and are not defined as standalone fields in the schema.
var ForeignKeys = []string{
	"comment_reactions",
	"user_comment_reactions",
}

// ValidColumn reports if the column name is valid (part of the table columns).
func ValidColumn(column string) bool {
	for i := range Columns {
		if column == Columns[i] {
			return true
		}
	}
	for i := range ForeignKeys {
		if column == ForeignKeys[i] {
			return true
		}
	}
	return false
}

var (
	// DefaultID holds the default value on creation for the "id" field.
	DefaultID func() uuid.UUID
)

// OrderOption defines the ordering options for the CommentReaction queries.
type OrderOption func(*sql.Selector)

// ByID orders the results by the id field.
func ByID(opts ...sql.OrderTermOption) OrderOption {
	return sql.OrderByField(FieldID, opts...).ToFunc()
}

// ByLiked orders the results by the liked field.
func ByLiked(opts ...sql.OrderTermOption) OrderOption {
	return sql.OrderByField(FieldLiked, opts...).ToFunc()
}

// ByCommentField orders the results by comment field.
func ByCommentField(field string, opts ...sql.OrderTermOption) OrderOption {
	return func(s *sql.Selector) {
		sqlgraph.OrderByNeighborTerms(s, newCommentStep(), sql.OrderByField(field, opts...))
	}
}

// ByUserField orders the results by user field.
func ByUserField(field string, opts ...sql.OrderTermOption) OrderOption {
	return func(s *sql.Selector) {
		sqlgraph.OrderByNeighborTerms(s, newUserStep(), sql.OrderByField(field, opts...))
	}
}
func newCommentStep() *sqlgraph.Step {
	return sqlgraph.NewStep(
		sqlgraph.From(Table, FieldID),
		sqlgraph.To(CommentInverseTable, FieldID),
		sqlgraph.Edge(sqlgraph.M2O, true, CommentTable, CommentColumn),
	)
}
func newUserStep() *sqlgraph.Step {
	return sqlgraph.NewStep(
		sqlgraph.From(Table, FieldID),
		sqlgraph.To(UserInverseTable, FieldID),
		sqlgraph.Edge(sqlgraph.M2O, true, UserTable, UserColumn),
	)
}
