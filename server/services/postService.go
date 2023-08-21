package services

import (
	"database/sql"
	"errors"
	"time"

	"github.com/yura4ka/crickter/db"
)

const POSTS_PER_PAGE = 5

type Post struct {
	Id, UserId, Text       string
	ParentId               *string
	created_at, updated_at time.Time
}

func CreatePost(userId, text string, parentId *string) (string, error) {
	var postId string

	err := db.Client.QueryRow(`
		INSERT INTO posts (text, user_id, parent_id)
		VALUES ($1, $2, $3)
		RETURNING id;
	`, text, userId, ToNullString(parentId)).Scan(&postId)

	if err != nil {
		return "", err
	}

	return postId, nil
}

func GetPostById(id string) (*Post, error) {
	var post Post

	err := db.Client.QueryRow(`
		SELECT id, user_id, text, parent_id, created_at, updated_at
		FROM posts
		WHERE id = $1;
	`, id).Scan(&post.Id, &post.UserId, &post.Text, &post.ParentId, &post.created_at, &post.updated_at)

	if err != nil {
		return nil, err
	}

	return &post, nil
}

func UpdatePost(id, text string) error {
	_, err := db.Client.Exec(`
		UPDATE posts SET text = $1
		WHERE id = $2;
	`)

	return err
}

type postUser struct {
	Id       string `json:"id"`
	Username string `json:"username"`
}

type postBase struct {
	Id        string   `json:"id"`
	Text      string   `json:"text"`
	User      postUser `json:"user"`
	CreatedAt string   `json:"createdAt"`
	UpdatedAt *string  `json:"updatedAt"`
	Comments  int      `json:"comments"`
}

type PostsResult struct {
	postBase
	Original *string `json:"originalId"`
	Likes    int     `json:"likes"`
	Dislikes int     `json:"dislikes"`
	Reaction int     `json:"reaction"`
}

func buildPostQuery(id, userId string, page int) (string, []interface{}) {
	limit := POSTS_PER_PAGE
	offset := POSTS_PER_PAGE * (page - 1)

	args := []interface{}{ToNullString(&userId)}

	query := `
		SELECT p.id, p.text, p.created_at, p.updated_at,
			u.id as "userId", u.username,
			o.id as "parentId",
			SUM(case when pr.liked = true then 1 else 0 end) AS likes,
			SUM(case when pr.liked = false then 1 else 0 end) AS dislikes,
			SUM(case
				when pr.user_id != $1 then 0
				when pr.liked = true then 1
				when pr.liked = false then -1 end) AS reaction,
			COUNT(c.id) AS comments
		FROM posts as p
		LEFT JOIN users as u ON p.user_id = u.id
		LEFT JOIN posts as o ON p.parent_id = o.id
		LEFT JOIN post_reactions as pr ON p.id = pr.post_id
		LEFT JOIN comments as c ON p.id = c.post_id`

	if id != "" {
		query += "\nWHERE p.id = $2\n"
		args = append(args, id)
	}

	query += `
		GROUP BY p.id, u.id, o.id, c.id
		ORDER BY p.created_at DESC`

	if id == "" {
		query += "\nLIMIT $2 OFFSET $3"
		args = append(args, limit, offset)
	}

	query += ";"
	return query, args
}

func parsePosts(rows *sql.Rows) ([]PostsResult, error) {
	result := make([]PostsResult, 0)
	for rows.Next() {
		var id, text, createdAt, updatedAt, userId, username string
		var parentId *string
		var likes, dislikes, comments int
		var reaction *int
		err := rows.Scan(
			&id, &text, &createdAt, &updatedAt,
			&userId, &username,
			&parentId,
			&likes, &dislikes, &reaction, &comments,
		)
		if err != nil {
			return nil, err
		}
		row := PostsResult{
			postBase: postBase{
				Id:        id,
				Text:      text,
				CreatedAt: createdAt,
				User:      postUser{Id: userId, Username: username},
			},
			Likes:    likes,
			Dislikes: dislikes,
		}

		if parentId != nil {
			row.Original = parentId
		}

		if reaction != nil {
			row.Reaction = *reaction
		} else {
			row.Reaction = 0
		}

		if updatedAt != createdAt {
			row.UpdatedAt = &updatedAt
		}
		result = append(result, row)
	}

	return result, nil
}

func GetPosts(userId string, page int) ([]PostsResult, bool, error) {
	query, args := buildPostQuery("", userId, page)
	rows, err := db.Client.Query(query, args...)

	if err != nil {
		return nil, false, err
	}

	defer rows.Close()

	result, err := parsePosts(rows)
	if err != nil {
		return nil, false, err
	}

	var total int
	err = db.Client.QueryRow(`SELECT COUNT(*) FROM posts;`).Scan(&total)

	if err != nil {
		return nil, false, err
	}

	return result, total > page*POSTS_PER_PAGE, err
}

type PostReaction struct {
	Liked          bool
	PostId, UserId string
}

func ProcessReaction(userId, postId string, liked bool) error {
	var r PostReaction
	err := db.Client.QueryRow(`
		SELECT liked, post_id, user_id
		FROM post_reactions
		WHERE user_id = $1 AND post_id = $2;
	`, userId, postId).Scan(&r.Liked, &r.PostId, &r.UserId)

	if err == sql.ErrNoRows {
		_, err = db.Client.Exec(`
			INSERT INTO post_reactions (liked, post_id, user_id)
			VALUES ($1, $2, $3);
		`, &liked, &postId, &userId)
		return err
	}

	if err != nil {
		return err
	}

	if r.Liked != liked {
		_, err := db.Client.Exec(`
			UPDATE post_reactions SET liked = $1 
			WHERE post_id = $2 AND user_id = $3;
		`, &liked, &postId, &userId)
		return err
	}

	_, err = db.Client.Exec(`
		DELETE FROM post_reactions
		WHERE post_id = $1 AND user_id = $2;
	`, &postId, &userId)

	return err
}

func QueryPostById(postId, userId string) (*PostsResult, error) {
	query, args := buildPostQuery(postId, userId, 0)
	rows, err := db.Client.Query(query, args...)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	result, err := parsePosts(rows)
	if err != nil {
		return nil, err
	}

	if len(result) != 1 {
		return nil, errors.New("post not found")
	}

	return &result[0], nil
}
