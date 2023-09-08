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

type BaseUser struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"createdAt"`
	IsPrivate bool      `json:"isPrivate"`
}

type User struct {
	BaseUser
	Password string `json:"password"`
	Email    string `json:"email"`
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

func GetUserByUsername(username string) (*User, error) {
	var user User

	err := db.Client.QueryRow(`
		SELECT * FROM users
		WHERE username = $1;
	`, username).Scan(&user.ID, &user.CreatedAt, &user.Email, &user.Password, &user.Name, &user.Username, &user.IsPrivate)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

type UserInfo struct {
	BaseUser
	Followers int `json:"followers"`
	Following int `json:"following"`
}

func GetUserInfo(id string) (*UserInfo, error) {
	var u UserInfo
	err := db.Client.QueryRow(`
		SELECT u.id, u.created_at, u.name, u.username, u.is_private,
			COALESCE(COUNT(f1.*), 0) AS followers, COALESCE(COUNT(f2.*), 0) AS following
		FROM users AS u
		LEFT JOIN users_followers AS f1 ON u.id = f1.user_id
		LEFT JOIN users_followers AS f2 ON u.id = f2.follower_id
		WHERE u.id = $1
		GROUP BY u.id, u.created_at, u.name, u.username;
	`, &id).Scan(&u.ID, &u.CreatedAt, &u.Name, &u.Username, &u.IsPrivate, &u.Followers, &u.Following)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func HasUserMorePosts(userId string, page int) (bool, error) {
	var total int
	err := db.Client.QueryRow(`SELECT COUNT(*) FROM posts WHERE user_id = $1 AND comment_to_id IS NULL;`, &userId).
		Scan(&total)
	if err != nil {
		return false, err
	}
	return total > page*POSTS_PER_PAGE, nil
}
