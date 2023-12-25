package services

import (
	"time"

	"github.com/gocql/gocql"
	"github.com/yura4ka/crickter/db"
	"golang.org/x/crypto/bcrypt"
)

type c_scanner interface {
	Scan(...interface{}) error
}

type C_PostMedia struct {
	Id        string     `json:"id" cql:"id"`
	CreatedAt time.Time  `json:"createdAt" cql:"created_at"`
	UpdatedAt *time.Time `json:"updatedAt" cql:"updated_at"`
	Url       string     `json:"url" cql:"url"`
	IsDeleted bool       `json:"isDeleted" cql:"is_deleted"`
	Type      string     `json:"type" cql:"type"`
}

type C_PostBaseParams struct {
	Text        string        `json:"text"`
	Media       []C_PostMedia `json:"media"`
	UserId      string        `json:"userId"`
	Username    string        `json:"username"`
	Name        string        `json:"name"`
	UserPicture *C_PostMedia  `json:"userPicture"`
}

type C_PostParams struct {
	C_PostBaseParams
	OriginalId *string `json:"originalId"`
}

func C_CreatePost(params *C_PostParams) (string, error) {
	id := gocql.MustRandomUUID()
	createdAt := time.Now()

	if params.OriginalId != nil {
		err := db.Cassandra.Query(`
			UPDATE post_counters SET reposts_count = reposts_count + 1 
			WHERE id = ?;
		`, params.OriginalId).Exec()
		if err != nil {
			return "", err
		}
	}

	b := db.Cassandra.NewBatch(gocql.UnloggedBatch)
	b.Entries = append(b.Entries, gocql.BatchEntry{
		Stmt: `
			INSERT INTO posts_by_id (id, created_at, user_id, username, name, user_picture, text, original_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?);
		`,
		Args:       []any{id, createdAt, params.UserId, params.Username, params.Name, params.UserPicture, params.Text, params.OriginalId},
		Idempotent: true,
	})
	b.Entries = append(b.Entries, gocql.BatchEntry{
		Stmt: `
			INSERT INTO posts_by_user (user_id, id, created_at, text, original_id)
			VALUES (?, ?, ?, ?, ?);
		`,
		Args:       []any{params.UserId, id, createdAt, params.Text, params.OriginalId},
		Idempotent: true,
	})

	err := db.Cassandra.ExecuteBatch(b)
	if err != nil {
		return "", err
	}

	return id.String(), nil
}

type C_PostBase struct {
	Id            string     `json:"id"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     *time.Time `json:"updatedAt"`
	Text          string     `json:"text"`
	reactions     map[string]bool
	Media         []C_PostMedia `json:"media"`
	LikesCount    int           `json:"likesCount"`
	DislikesCount int           `json:"dislikesCount"`
	Reaction      int           `json:"reaction"`
	IsFavorite    bool          `json:"isFavorite"`
}

type C_PostBaseUser struct {
	C_PostBase
	UserId      string       `json:"userId"`
	Username    *string      `json:"username"`
	Name        *string      `json:"name"`
	UserPicture *C_PostMedia `json:"userPicture"`
}

type C_Post struct {
	C_PostBaseUser
	CommentsCount int `json:"commentsCount"`
	RepostsCount  int `json:"repostsCount"`
	favorite      map[string]bool
	OriginalId    *string `json:"originalId"`
}

func GetPostCounters(result *C_Post, userId string) error {
	err := db.Cassandra.Query(`
		SELECT * FROM post_counters WHERE id = ?;
	`, result.Id).
		Scan(&result.Id, &result.CommentsCount, &result.DislikesCount, &result.LikesCount, &result.RepostsCount)

	if err != nil && err != gocql.ErrNotFound {
		return err
	}

	_, result.IsFavorite = result.favorite[userId]
	liked, reacted := result.reactions[userId]
	if reacted && liked {
		result.Reaction = 1
	} else if reacted && !liked {
		result.Reaction = -1
	}

	return nil
}

func C_GetPosts(limit int, userId string) ([]C_Post, error) {
	result := make([]C_Post, 0)
	scanner := db.Cassandra.Query("SELECT * FROM posts_by_id LIMIT ?", limit).Iter().Scanner()

	for scanner.Next() {
		temp := C_Post{}
		err := scanner.Scan(
			&temp.Id,
			&temp.CreatedAt,
			&temp.favorite,
			&temp.Media,
			&temp.Name,
			&temp.OriginalId,
			&temp.reactions,
			&temp.Text,
			&temp.UpdatedAt,
			&temp.UserId,
			&temp.UserPicture,
			&temp.Username,
		)
		if err != nil {
			return nil, err
		}
		err = GetPostCounters(&temp, userId)
		if err != nil {
			return nil, err
		}
		result = append(result, temp)
	}

	return result, nil
}

func C_GetPostById(id, userId string) (*C_Post, error) {
	result := C_Post{}
	err := db.Cassandra.Query(`
		SELECT * FROM posts_by_id WHERE id = ?;
	`, id).Scan(
		&result.Id,
		&result.CreatedAt,
		&result.favorite,
		&result.Media,
		&result.Name,
		&result.OriginalId,
		&result.reactions,
		&result.Text,
		&result.UpdatedAt,
		&result.UserId,
		&result.UserPicture,
		&result.Username,
	)

	if err != nil {
		return nil, err
	}

	err = GetPostCounters(&result, userId)
	return &result, err
}

type C_CommentParams struct {
	C_PostBaseParams
}

func C_CreateComment(postId string, params *C_CommentParams) (string, error) {
	id := gocql.MustRandomUUID()
	createdAt := time.Now()

	err := db.Cassandra.Query(`
		UPDATE post_counters SET comments_count = comments_count + 1 
		WHERE id = ?;
	`, postId).Exec()

	if err != nil {
		return "", err
	}

	err = db.Cassandra.Query(`
		INSERT INTO comments_by_post (post_id, id, created_at, user_id, username, name, user_picture, text)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?);
	`, postId, id, createdAt, params.UserId, params.Username, params.Name, params.UserPicture, params.Text).Exec()

	if err != nil {
		return "", err
	}

	return id.String(), nil
}

func GetCommentCounters(result *C_Comment, userId string) error {
	var temp int
	err := db.Cassandra.Query(`
		SELECT * FROM post_counters WHERE id = ?;
	`, result.Id).
		Scan(&result.Id, &result.ResponsesCount, &result.DislikesCount, &result.LikesCount, &temp)

	if err != nil && err != gocql.ErrNotFound {
		return err
	}

	liked, reacted := result.reactions[userId]
	if reacted && liked {
		result.Reaction = 1
	} else if reacted && !liked {
		result.Reaction = -1
	}

	return nil
}

type C_Comment struct {
	C_PostBaseUser
	PostId         string `json:"postId"`
	ResponsesCount int    `json:"responsesCount"`
}

func C_GetComments(id, userId string) ([]C_Comment, error) {
	result := make([]C_Comment, 0)
	scanner := db.Cassandra.Query("SELECT * FROM comments_by_post WHERE post_id = ?;", id).Iter().Scanner()
	for scanner.Next() {
		var comment C_Comment
		err := scanner.Scan(
			&comment.PostId,
			&comment.CreatedAt,
			&comment.Id,
			&comment.Media,
			&comment.Name,
			&comment.reactions,
			&comment.Text,
			&comment.UpdatedAt,
			&comment.UserId,
			&comment.UserPicture,
			&comment.Username,
		)
		if err != nil {
			return nil, err
		}
		err = GetCommentCounters(&comment, userId)
		if err != nil {
			return nil, err
		}
		result = append(result, comment)
	}
	return result, nil
}

type C_UserParams struct {
	Email    string       `json:"email"`
	Password string       `json:"password"`
	Name     string       `json:"name"`
	Username string       `json:"username"`
	Avatar   *C_PostMedia `json:"avatar"`
	Bio      *string      `json:"bio"`
}

func C_CreateUser(params *C_UserParams) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(params.Password), 10)
	if err != nil {
		return "", err
	}

	id := gocql.MustRandomUUID()
	createdAt := time.Now()

	err = db.Cassandra.Query(`
		INSERT INTO users_by_id (id, created_at, email, password, name, username, avatar, bio)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?);
	`, id, createdAt, params.Email, hashed, params.Name, params.Username, params.Avatar, params.Bio).
		Exec()
	if err != nil {
		return "", err
	}

	return id.String(), nil
}

type C_User struct {
	Id        string     `json:"id"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt"`
	email     string
	password  string
	Name      string       `json:"name"`
	Username  string       `json:"username"`
	Avatar    *C_PostMedia `json:"avatar"`
	Bio       *string      `json:"bio"`
}

func scanUser(scanner c_scanner) (*C_User, error) {
	user := C_User{}
	err := scanner.
		Scan(
			&user.Id,
			&user.Avatar,
			&user.Bio,
			&user.CreatedAt,
			&user.email,
			&user.Name,
			&user.password,
			&user.UpdatedAt,
			&user.Username,
		)
	return &user, err
}

func C_GetUserById(id string) (*C_User, error) {
	return scanUser(
		db.Cassandra.Query(`SELECT * FROM users_by_id WHERE id = ?;`, id),
	)
}

func C_GetUsers() ([]C_User, error) {
	result := make([]C_User, 0)
	scanner := db.Cassandra.Query("SELECT * FROM users_by_id;").Iter().Scanner()
	for scanner.Next() {
		user, err := scanUser(scanner)
		if err != nil {
			return nil, err
		}
		result = append(result, *user)
	}
	scanner.Err()

	return result, nil
}

func C_GetUserPosts(id, userId string) ([]C_Post, error) {
	result := make([]C_Post, 0)
	user, err := C_GetUserById(id)
	if err != nil {
		return nil, err
	}

	scanner := db.Cassandra.Query(`
		SELECT * FROM posts_by_user WHERE user_id = ?;
	`, id).Iter().Scanner()

	for scanner.Next() {
		var post C_Post
		err = scanner.Scan(
			&post.UserId,
			&post.CreatedAt,
			&post.favorite,
			&post.Id,
			&post.Media,
			&post.OriginalId,
			&post.reactions,
			&post.Text,
			&post.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		err = GetPostCounters(&post, userId)
		if err != nil {
			return nil, err
		}
		post.Username = &user.Username
		post.Name = &user.Name
		post.UserPicture = user.Avatar
		result = append(result, post)
	}

	return result, nil
}

type C_ResponseParams struct {
	C_PostBaseParams
	PostId     string  `json:"postId"`
	OriginalId *string `json:"originalId"`
}

func C_CreateResponse(commentId string, params *C_ResponseParams) (string, error) {
	id := gocql.MustRandomUUID()
	createdAt := time.Now()

	b := db.Cassandra.NewBatch(gocql.UnloggedBatch)
	b.Entries = append(b.Entries, gocql.BatchEntry{
		Stmt: `
			UPDATE post_counters SET comments_count = comments_count + 1 
			WHERE id = ?;
		`,
		Args:       []any{params.PostId},
		Idempotent: true,
	}, gocql.BatchEntry{
		Stmt: `
			UPDATE post_counters SET comments_count = comments_count + 1 
			WHERE id = ?;
		`,
		Args:       []any{commentId},
		Idempotent: true,
	})

	if params.OriginalId != nil {
		b.Entries = append(b.Entries, gocql.BatchEntry{
			Stmt: `
				UPDATE post_counters SET comments_count = comments_count + 1 
				WHERE id = ?;
			`,
			Args:       []any{params.OriginalId},
			Idempotent: true,
		})
	}

	err := db.Cassandra.ExecuteBatch(b)
	if err != nil {
		return "", err
	}

	err = db.Cassandra.Query(`
		INSERT INTO responses_by_comment (comment_id, post_id, id, created_at, user_id, username, name, user_picture, text, original_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	`, commentId, params.PostId, id, createdAt, params.UserId, params.Username, params.Name, params.UserPicture, params.Text, params.OriginalId).Exec()

	if err != nil {
		return "", err
	}

	return id.String(), nil
}

func GetResponseCounters(result *C_Response, userId string) error {
	var temp int
	err := db.Cassandra.Query(`
		SELECT * FROM post_counters WHERE id = ?;
	`, result.Id).
		Scan(&result.Id, &result.ResponsesCount, &result.DislikesCount, &result.LikesCount, &temp)

	if err != nil && err != gocql.ErrNotFound {
		return err
	}

	liked, reacted := result.reactions[userId]
	if reacted && liked {
		result.Reaction = 1
	} else if reacted && !liked {
		result.Reaction = -1
	}

	return nil
}

type C_Response struct {
	C_Comment
	CommentId  string  `json:"commentId"`
	OriginalId *string `json:"originalId"`
}

func C_GetResponses(id, userId string) ([]C_Response, error) {
	result := make([]C_Response, 0)
	scanner := db.Cassandra.Query("SELECT * FROM responses_by_comment WHERE comment_id = ?;", id).Iter().Scanner()
	for scanner.Next() {
		var response C_Response
		err := scanner.Scan(
			&response.CommentId,
			&response.CreatedAt,
			&response.Id,
			&response.Media,
			&response.Name,
			&response.OriginalId,
			&response.PostId,
			&response.reactions,
			&response.Text,
			&response.UpdatedAt,
			&response.UserId,
			&response.UserPicture,
			&response.Username,
		)
		if err != nil {
			return nil, err
		}
		err = GetResponseCounters(&response, userId)
		if err != nil {
			return nil, err
		}
		result = append(result, response)
	}
	return result, nil
}
