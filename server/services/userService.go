package services

import (
	"time"

	"github.com/yura4ka/crickter/db"
	"golang.org/x/crypto/bcrypt"
)

type NewUser struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

func CreateUser(user *NewUser) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), 10)

	if err != nil {
		return "", err
	}

	var id string

	err = db.Client.QueryRow(`
		INSERT INTO users (email, username, password, name)
		VALUES ($1, $2, $3, $4)
		RETURNING id;
	`, user.Email, user.Username, hashed, user.Name).Scan(&id)

	if err != nil {
		return "", err
	}

	return id, err
}

type User struct {
	ID, Email, Password, Name, Username string
	CreatedAt                           time.Time
	IsPrivate                           bool
}

func GetUserByEmail(email string) (*User, error) {
	var user User

	err := db.Client.QueryRow(`
		SELECT * FROM users
		WHERE email = $1;
	`, email).Scan(&user.ID, &user.CreatedAt, &user.Email, &user.Password, &user.Name, &user.Username, &user.IsPrivate)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserById(id string) (*User, error) {
	var user User

	err := db.Client.QueryRow(`
		SELECT * FROM users
		WHERE id = $1;
	`, id).Scan(&user.ID, &user.CreatedAt, &user.Email, &user.Password, &user.Name, &user.Username, &user.IsPrivate)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
