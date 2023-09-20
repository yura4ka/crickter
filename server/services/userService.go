package services

import (
	"database/sql"
	"strconv"
	"time"

	"github.com/yura4ka/crickter/db"
	"golang.org/x/crypto/bcrypt"
)

const (
	USERS_PER_PAGE = 20
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
	Followers    int  `json:"followers"`
	Following    int  `json:"following"`
	IsSubscribed bool `json:"isSubscribed"`
	PostCount    int  `json:"postCount"`
}

func GetUserInfo(id, requestUserId string) (*UserInfo, error) {
	var u UserInfo
	err := db.Client.QueryRow(`
		SELECT u.id, u.created_at, u.name, u.username, u.is_private,
			COALESCE(COUNT(f1.*), 0) AS followers, COALESCE(f2.count, 0) AS following,
			COALESCE(p.count, 0) AS post_count
		FROM users AS u
		LEFT JOIN users_followers AS f1 ON u.id = f1.user_id
		LEFT JOIN (
			SELECT follower_id, COUNT(*) AS count
			FROM users_followers
			GROUP BY follower_id
		) f2 ON u.id = f2.follower_id
		LEFT JOIN (
			SELECT user_id, COUNT(*) AS count
			FROM posts
			WHERE comment_to_id IS NULL
			GROUP BY user_id
		) p ON u.id = p.user_id
		WHERE u.id = $1
		GROUP BY u.id, u.created_at, u.name, u.username, f2.count, p.count;
	`, id).Scan(&u.ID, &u.CreatedAt, &u.Name, &u.Username, &u.IsPrivate, &u.Followers, &u.Following, &u.PostCount)
	if err != nil {
		return nil, err
	}

	if requestUserId != "" && id != requestUserId {
		err := db.Client.QueryRow(`
			SELECT CASE WHEN COUNT(uf) != 0 THEN true ELSE false END is_subscribed
			FROM users_followers uf
			WHERE user_id = $1 AND follower_id = $2;
		`, id, requestUserId).Scan(&u.IsSubscribed)
		if err != nil {
			return nil, err
		}
	}

	return &u, nil
}

func HasUserMorePosts(userId string, page int) (bool, error) {
	var total int
	err := db.Client.QueryRow(`SELECT COUNT(*) FROM posts WHERE user_id = $1 AND comment_to_id IS NULL;`, userId).
		Scan(&total)
	if err != nil {
		return false, err
	}
	return total > page*POSTS_PER_PAGE, nil
}

func HandleFollow(userId, followerId string) error {
	_, err := db.Client.Exec(`
		INSERT INTO users_followers (user_id, follower_id)
		VALUES ($1, $2);
	`, userId, followerId)
	return err
}

func HandleUnFollow(userId, followerId string) error {
	_, err := db.Client.Exec(`
		DELETE FROM users_followers WHERE user_id = $1 AND follower_id = $2;
	`, userId, followerId)
	return err
}

type FollowInfo struct {
	BaseUser
	IsSubscribed bool `json:"isSubscribed"`
}

func getIsSubscribeMap(userId string) (map[string]bool, error) {
	isSubscribed := make(map[string]bool)
	if userId == "" {
		return isSubscribed, nil
	}
	requestFollowing, err := GetFollowing(userId, "", 0)
	if err != nil {
		return nil, err
	}
	for _, u := range requestFollowing {
		isSubscribed[u.ID] = true
	}
	return isSubscribed, nil
}

func parseFollowInfo(rows *sql.Rows, isSubscribed map[string]bool) ([]FollowInfo, error) {
	result := make([]FollowInfo, 0)

	for rows.Next() {
		row := FollowInfo{}
		err := rows.Scan(&row.ID, &row.Name, &row.Username, &row.CreatedAt, &row.IsPrivate)
		if err != nil {
			return nil, err
		}
		row.IsSubscribed = isSubscribed[row.ID]
		result = append(result, row)
	}

	return result, nil
}

func GetFollowing(userId, requestUserId string, page int) ([]FollowInfo, error) {
	isSubscribed, err := getIsSubscribeMap(requestUserId)
	if err != nil {
		return nil, err
	}

	var offset int
	limit := ""
	if page != 0 {
		limit = strconv.Itoa(USERS_PER_PAGE)
		offset = USERS_PER_PAGE * (page - 1)
	}

	rows, err := db.Client.Query(`
		SELECT u.id, u.name, u.username, u.created_at, u.is_private
		FROM users_followers AS f
		INNER JOIN users AS u ON f.user_id = u.id
		WHERE f.follower_id = $1
		ORDER BY u.username
		LIMIT $2 OFFSET $3;
	`, userId, ToNullString(&limit), offset)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	return parseFollowInfo(rows, isSubscribed)
}

func GetFollowers(userId, requestUserId string, page int) ([]FollowInfo, error) {
	isSubscribed, err := getIsSubscribeMap(requestUserId)
	if err != nil {
		return nil, err
	}

	rows, err := db.Client.Query(`
		SELECT u.id, u.name, u.username, u.created_at, u.is_private
		FROM users_followers AS f
		INNER JOIN users AS u ON f.follower_id = u.id
		WHERE f.user_id = $1
		ORDER BY u.username
		LIMIT $2 OFFSET $3;
	`, userId, USERS_PER_PAGE, USERS_PER_PAGE*(page-1))

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	return parseFollowInfo(rows, isSubscribed)
}

func HasMoreFollowing(userId string, page int) (bool, error) {
	var count int
	err := db.Client.QueryRow(`
		SELECT COUNT(u.*) 
		FROM users_followers AS f
		INNER JOIN users AS u ON f.follower_id = u.id
		WHERE f.user_id = $1;
	`, userId).Scan(&count)
	if err != nil {
		return false, nil
	}
	return count > page*USERS_PER_PAGE, nil
}

func HasMoreFollowers(userId string, page int) (bool, error) {
	var count int
	err := db.Client.QueryRow(`
		SELECT COUNT(u.*) 
		FROM users_followers AS f
		INNER JOIN users AS u ON f.user_id = u.id
		WHERE f.follower_id = $1;
	`, userId).Scan(&count)
	if err != nil {
		return false, nil
	}
	return count > page*USERS_PER_PAGE, nil
}
