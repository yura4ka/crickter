package services

import (
	"github.com/yura4ka/crickter/db"
	"golang.org/x/crypto/bcrypt"
)

type NewUser struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func CreateUser(user *NewUser) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), 10)

	if err != nil {
		return "", err
	}

	created, err := db.Client.User.
		Create().
		SetEmail(user.Email).
		SetUsername(user.Username).
		SetPassword(string(hashed)).
		Save(db.Ctx)

	if err != nil {
		return "", err
	}

	return created.ID.String(), err
}
