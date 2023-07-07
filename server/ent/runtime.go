// Code generated by ent, DO NOT EDIT.

package ent

import (
	"time"

	"github.com/google/uuid"
	"github.com/yura4ka/crickter/ent/comment"
	"github.com/yura4ka/crickter/ent/commentreaction"
	"github.com/yura4ka/crickter/ent/post"
	"github.com/yura4ka/crickter/ent/postreaction"
	"github.com/yura4ka/crickter/ent/schema"
	"github.com/yura4ka/crickter/ent/user"
)

// The init function reads all schema descriptors with runtime code
// (default values, validators, hooks and policies) and stitches it
// to their package variables.
func init() {
	commentFields := schema.Comment{}.Fields()
	_ = commentFields
	// commentDescCreatedAt is the schema descriptor for createdAt field.
	commentDescCreatedAt := commentFields[1].Descriptor()
	// comment.DefaultCreatedAt holds the default value on creation for the createdAt field.
	comment.DefaultCreatedAt = commentDescCreatedAt.Default.(time.Time)
	// commentDescUpdatedAt is the schema descriptor for updatedAt field.
	commentDescUpdatedAt := commentFields[2].Descriptor()
	// comment.DefaultUpdatedAt holds the default value on creation for the updatedAt field.
	comment.DefaultUpdatedAt = commentDescUpdatedAt.Default.(time.Time)
	// comment.UpdateDefaultUpdatedAt holds the default value on update for the updatedAt field.
	comment.UpdateDefaultUpdatedAt = commentDescUpdatedAt.UpdateDefault.(func() time.Time)
	// commentDescText is the schema descriptor for text field.
	commentDescText := commentFields[3].Descriptor()
	// comment.TextValidator is a validator for the "text" field. It is called by the builders before save.
	comment.TextValidator = commentDescText.Validators[0].(func(string) error)
	// commentDescID is the schema descriptor for id field.
	commentDescID := commentFields[0].Descriptor()
	// comment.DefaultID holds the default value on creation for the id field.
	comment.DefaultID = commentDescID.Default.(func() uuid.UUID)
	commentreactionFields := schema.CommentReaction{}.Fields()
	_ = commentreactionFields
	// commentreactionDescID is the schema descriptor for id field.
	commentreactionDescID := commentreactionFields[0].Descriptor()
	// commentreaction.DefaultID holds the default value on creation for the id field.
	commentreaction.DefaultID = commentreactionDescID.Default.(func() uuid.UUID)
	postFields := schema.Post{}.Fields()
	_ = postFields
	// postDescCreatedAt is the schema descriptor for createdAt field.
	postDescCreatedAt := postFields[1].Descriptor()
	// post.DefaultCreatedAt holds the default value on creation for the createdAt field.
	post.DefaultCreatedAt = postDescCreatedAt.Default.(time.Time)
	// postDescUpdatedAt is the schema descriptor for updatedAt field.
	postDescUpdatedAt := postFields[2].Descriptor()
	// post.DefaultUpdatedAt holds the default value on creation for the updatedAt field.
	post.DefaultUpdatedAt = postDescUpdatedAt.Default.(time.Time)
	// post.UpdateDefaultUpdatedAt holds the default value on update for the updatedAt field.
	post.UpdateDefaultUpdatedAt = postDescUpdatedAt.UpdateDefault.(func() time.Time)
	// postDescText is the schema descriptor for text field.
	postDescText := postFields[3].Descriptor()
	// post.TextValidator is a validator for the "text" field. It is called by the builders before save.
	post.TextValidator = postDescText.Validators[0].(func(string) error)
	// postDescID is the schema descriptor for id field.
	postDescID := postFields[0].Descriptor()
	// post.DefaultID holds the default value on creation for the id field.
	post.DefaultID = postDescID.Default.(func() uuid.UUID)
	postreactionFields := schema.PostReaction{}.Fields()
	_ = postreactionFields
	// postreactionDescID is the schema descriptor for id field.
	postreactionDescID := postreactionFields[0].Descriptor()
	// postreaction.DefaultID holds the default value on creation for the id field.
	postreaction.DefaultID = postreactionDescID.Default.(func() uuid.UUID)
	userFields := schema.User{}.Fields()
	_ = userFields
	// userDescEmail is the schema descriptor for email field.
	userDescEmail := userFields[1].Descriptor()
	// user.EmailValidator is a validator for the "email" field. It is called by the builders before save.
	user.EmailValidator = userDescEmail.Validators[0].(func(string) error)
	// userDescPassword is the schema descriptor for password field.
	userDescPassword := userFields[2].Descriptor()
	// user.PasswordValidator is a validator for the "password" field. It is called by the builders before save.
	user.PasswordValidator = userDescPassword.Validators[0].(func(string) error)
	// userDescUsername is the schema descriptor for username field.
	userDescUsername := userFields[3].Descriptor()
	// user.UsernameValidator is a validator for the "username" field. It is called by the builders before save.
	user.UsernameValidator = userDescUsername.Validators[0].(func(string) error)
	// userDescCreatedAt is the schema descriptor for createdAt field.
	userDescCreatedAt := userFields[4].Descriptor()
	// user.DefaultCreatedAt holds the default value on creation for the createdAt field.
	user.DefaultCreatedAt = userDescCreatedAt.Default.(func() time.Time)
	// userDescIsPrivate is the schema descriptor for isPrivate field.
	userDescIsPrivate := userFields[5].Descriptor()
	// user.DefaultIsPrivate holds the default value on creation for the isPrivate field.
	user.DefaultIsPrivate = userDescIsPrivate.Default.(bool)
	// userDescID is the schema descriptor for id field.
	userDescID := userFields[0].Descriptor()
	// user.DefaultID holds the default value on creation for the id field.
	user.DefaultID = userDescID.Default.(func() uuid.UUID)
}
