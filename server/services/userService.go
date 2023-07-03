package services

import (
	"github.com/google/uuid"
	"github.com/yura4ka/crickter/db"
	"github.com/yura4ka/crickter/ent"
	"github.com/yura4ka/crickter/ent/user"
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

func GetUserByEmail(email string) (*ent.User, error) {
	return db.Client.User.
		Query().
		Where(user.Email(email)).
		Only(db.Ctx)
}

func GetUserById(id string) (*ent.User, error) {
	uuid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	return db.Client.User.
		Query().
		Where(user.ID(uuid)).
		Only(db.Ctx)
}
