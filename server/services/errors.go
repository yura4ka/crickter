package services

import "errors"

var ErrDeletedUser = errors.New("requested user is deleted")
var ErrInvalidPassword = errors.New("invalid password")
var ErrWrongPassword = errors.New("wrong password")
var ErrWrongAvatarData = errors.New("wrong avatar data")
var ErrEmptyString = errors.New("empty string")
var ErrPrivateConversation = errors.New("cannot add users to the private conversation")
var ErrCannotAddUser = errors.New("cannot add users to this conversation")
var ErrAlreadyExists = errors.New("already exists")
var ErrCannotKick = errors.New("cannot kick user")
var ErrForbidden = errors.New("forbidden")
var ErrUserKicked = errors.New("user has been kicked")
