package services

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/yura4ka/crickter/db"
)

const POSTS_PER_PAGE = 10

type Post struct {
	Id, UserId, Text       string
	ParentId               *string
	created_at, updated_at time.Time
}

func CreatePost(userId, text string, originalId, commentToId, responseToId *string) (string, error) {
	var postId string

	err := db.Client.QueryRow(`
		INSERT INTO posts (text, user_id, original_id, comment_to_id, response_to_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id;
	`, text, userId, ToNullString(originalId), ToNullString(commentToId), ToNullString(responseToId)).Scan(&postId)

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
	Id        *string `json:"id"`
	Username  *string `json:"username"`
	Name      *string `json:"name"`
	AvatarUrl *string `json:"avatarUrl"`
	IsDeleted bool    `json:"isDeleted"`
}

type postBase struct {
	Id         string   `json:"id"`
	Text       string   `json:"text"`
	User       postUser `json:"user"`
	CreatedAt  string   `json:"createdAt"`
	UpdatedAt  *string  `json:"updatedAt"`
	CanComment bool     `json:"canComment"`
	IsDeleted  bool     `json:"isDeleted"`
}

type PostsResult struct {
	postBase
	OriginalId   *string `json:"originalId"`
	CommentToId  *string `json:"commentToId"`
	ResponseToId *string `json:"responseToId"`
	Likes        int     `json:"likes"`
	Dislikes     int     `json:"dislikes"`
	Reaction     int     `json:"reaction"`
	Comments     int     `json:"comments"`
	Reposts      int     `json:"reposts"`
	IsFavorite   bool    `json:"isFavorite"`
}

type TSortBy int

const (
	SortNone TSortBy = iota
	SortNew
	SortOld
	SortPopular
)

type QueryParams struct {
	PostId, CommentsToId, ResponseToId, RequestUserId, UserId string
	Page                                                      int
	OrderBy                                                   TSortBy
	IsFavorite                                                bool
	Tag                                                       string
}

func buildPostQuery(params *QueryParams) (string, []interface{}) {
	limit := POSTS_PER_PAGE
	offset := POSTS_PER_PAGE * (params.Page - 1)
	userId := params.RequestUserId
	if userId == "" {
		userId = "00000000-0000-0000-0000-000000000000"
	}

	args := []interface{}{userId}

	query := `
		SELECT p.id, p.text, p.created_at, p.updated_at, p.can_comment, p.is_deleted,
			u.id as "userId", u.username, u.name, u.avatar_url, u.is_deleted as "userDeleted",
			o.id as "originalId", c.id as "commentToId", r.id as "responseToId",
			COALESCE(pr.likes, 0), COALESCE(pr.dislikes, 0), COALESCE(pr.reaction, 0),
			COUNT(pc.id) as comments, COUNT(post_r.id) as responses, COALESCE(reposts.count, 0),
			CASE WHEN fp.post_id IS NOT NULL THEN TRUE ELSE FALSE END as favorite
		FROM posts as p
		LEFT JOIN users as u ON p.user_id = u.id
		LEFT JOIN posts as o ON p.original_id = o.id
		LEFT JOIN posts as c ON p.comment_to_id = c.id
		LEFT JOIN posts as r ON p.response_to_id = r.id
		LEFT JOIN posts as pc ON p.id = pc.comment_to_id
		LEFT JOIN posts as post_r ON p.id = post_r.response_to_id
		LEFT JOIN (
			SELECT original_id, COUNT(id) as count
			FROM posts
			GROUP BY original_id
		) reposts ON reposts.original_id = p.id
		LEFT JOIN (
			SELECT post_id,
				SUM(case when liked = true then 1 else 0 end) AS likes,
				SUM(case when liked = false then 1 else 0 end) AS dislikes,
				SUM(case
					when user_id != $1 then 0
					when liked = true then 1
					when liked = false then -1 
				end) AS reaction
			FROM post_reactions
			GROUP BY post_id
		) pr ON p.id = pr.post_id
		LEFT JOIN favorite_posts as fp ON p.id = fp.post_id AND fp.user_id = $1`

	if params.PostId != "" {
		query += "\nWHERE p.id = $2\n"
		args = append(args, params.PostId)
	} else if params.CommentsToId != "" {
		query += "\nWHERE p.comment_to_id = $2 AND p.response_to_id is NULL\n"
		args = append(args, params.CommentsToId)
	} else if params.ResponseToId != "" {
		query += "\nWHERE p.response_to_id = $2\n"
		args = append(args, params.ResponseToId)
	} else if params.UserId != "" {
		query += "\nWHERE p.comment_to_id IS NULL AND u.id = $2\n"
		args = append(args, params.UserId)
	} else if params.IsFavorite {
		query += "\nWHERE fp.post_id IS NOT NULL\n"
	} else if params.Tag != "" {
		query += `
			RIGHT JOIN post_tags as pt ON p.id = pt.post_id
			LEFT JOIN tags as t ON pt.tag_id = t.id
			WHERE t.name = $2
			`
		args = append(args, params.Tag)
	} else {
		query += "\nWHERE p.comment_to_id IS NULL\n"
	}

	query += "GROUP BY p.id, u.id, o.id, c.id, r.id, pr.likes, pr.dislikes, pr.reaction, reposts.count, fp.post_id\n"

	switch params.OrderBy {
	case SortNew:
		query += "ORDER BY p.created_at DESC\n"
	case SortOld:
		query += "ORDER BY p.created_at ASC\n"
	case SortPopular:
		query += "ORDER BY pr.likes + pr.dislikes ASC, p.created_at ASC\n"
	}

	if params.PostId == "" {
		count := len(args) + 1
		query += fmt.Sprintf("LIMIT $%v OFFSET $%v", count, count+1)
		args = append(args, limit, offset)
	}

	query += ";"
	return query, args
}

func parsePosts(rows *sql.Rows, isComment bool) ([]PostsResult, error) {
	result := make([]PostsResult, 0)
	for rows.Next() {
		var updatedAt string
		var avatarUrl, userId, username, name *string
		var comments, responses int
		row := PostsResult{}

		err := rows.Scan(
			&row.Id, &row.Text, &row.CreatedAt, &updatedAt, &row.CanComment, &row.IsDeleted,
			&userId, &username, &name, &avatarUrl, &row.User.IsDeleted,
			&row.OriginalId, &row.CommentToId, &row.ResponseToId,
			&row.Likes, &row.Dislikes, &row.Reaction, &comments, &responses, &row.Reposts, &row.IsFavorite,
		)
		if err != nil {
			return nil, err
		}

		if !row.User.IsDeleted {
			row.User = postUser{Id: userId, Username: username, Name: name, AvatarUrl: avatarUrl}
		}

		if updatedAt != row.CreatedAt {
			row.UpdatedAt = &updatedAt
		}

		if isComment {
			row.Comments = responses
		} else {
			row.Comments = comments
		}
		result = append(result, row)
	}

	return result, nil
}

func GetPosts(params *QueryParams) ([]PostsResult, error) {
	query, args := buildPostQuery(params)
	rows, err := db.Client.Query(query, args...)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	result, err := parsePosts(rows, params.CommentsToId != "" || params.ResponseToId != "")
	if err != nil {
		return nil, err
	}
	return result, err
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
		`, liked, postId, userId)
		return err
	}

	if err != nil {
		return err
	}

	if r.Liked != liked {
		_, err := db.Client.Exec(`
			UPDATE post_reactions SET liked = $1 
			WHERE post_id = $2 AND user_id = $3;
		`, liked, postId, userId)
		return err
	}

	_, err = db.Client.Exec(`
		DELETE FROM post_reactions
		WHERE post_id = $1 AND user_id = $2;
	`, postId, userId)

	return err
}

func QueryPostById(postId, userId string) (*PostsResult, error) {
	query, args := buildPostQuery(&QueryParams{PostId: postId, RequestUserId: userId})
	rows, err := db.Client.Query(query, args...)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	result, err := parsePosts(rows, false)
	if err != nil {
		return nil, err
	}

	if len(result) != 1 {
		return nil, errors.New("post not found")
	}

	return &result[0], nil
}

func HasMorePosts(page int) (bool, error) {
	var total int
	err := db.Client.QueryRow(`SELECT COUNT(*) FROM posts WHERE comment_to_id IS NULL;`).Scan(&total)
	if err != nil {
		return false, err
	}
	return total > page*POSTS_PER_PAGE, nil
}

func CountComments(postId string, page int) (int, bool, error) {
	var total, filtered int
	err := db.Client.QueryRow(`
		SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE response_to_id IS NULL) AS filtered 
		FROM posts WHERE comment_to_id = $1;
	`, postId).Scan(&total, &filtered)

	if err != nil {
		return 0, false, err
	}

	return total, filtered > page*POSTS_PER_PAGE, nil
}

func CountResponses(commentId string, page int) (int, bool, error) {
	var total int
	err := db.Client.QueryRow(`SELECT COUNT(*) FROM posts WHERE response_to_id = $1;`, commentId).Scan(&total)
	if err != nil {
		return 0, false, err
	}
	return total, total > page*POSTS_PER_PAGE, nil
}

func ProcessFavorite(postId, userId string) error {
	result, err := db.Client.Exec(
		"DELETE FROM favorite_posts WHERE post_id = $1 AND user_id = $2",
		postId, userId)

	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 1 {
		return nil
	}

	_, err = db.Client.Exec(
		"INSERT INTO favorite_posts (post_id, user_id) VALUES ($1, $2);",
		postId, userId)

	return err
}

func GetFavoritePosts(userId string, page int) ([]PostsResult, error) {
	query, args := buildPostQuery(&QueryParams{RequestUserId: userId, IsFavorite: true, Page: page, OrderBy: SortNew})
	rows, err := db.Client.Query(query, args...)
	if err != nil {
		return nil, err
	}
	return parsePosts(rows, false)
}

func HasMoreFavorite(userId string, page int) (bool, error) {
	var total int
	err := db.Client.QueryRow("SELECT COUNT(*) FROM favorite_posts WHERE user_id = $1;", userId).Scan(&total)
	if err != nil {
		return false, err
	}
	return total > page*POSTS_PER_PAGE, nil
}
