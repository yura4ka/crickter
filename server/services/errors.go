package services

import "errors"

var ErrDeletedUser = errors.New("requested user is deleted")
var ErrInvalidPassword = errors.New("invalid password")
var ErrWrongPassword = errors.New("wrong password")
var ErrWrongAvatarData = errors.New("wrong avatar data")
