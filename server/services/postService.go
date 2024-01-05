package services

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/yura4ka/crickter/db"
)

const POSTS_PER_PAGE = 10

type Post struct {
	Id, UserId, Text       string
	ParentId               *string
	created_at, updated_at time.Time
}

type PostMedia struct {
	Id           string `json:"id"`
	Url          string `json:"url"`
	UrlModifiers string `json:"urlModifiers"`
	Type         string `json:"type"`
	Mime         string `json:"mime"`
	Subtype      string `json:"subtype"`
	Width        int    `json:"width"`
	Height       int    `json:"height"`
}

type PostParams struct {
	Text         string      `json:"text"`
	OriginalId   *string     `json:"originalId"`
	CommentToId  *string     `json:"commentToId"`
	ResponseToId *string     `json:"responseToId"`
	CanComment   bool        `json:"canComment"`
	Media        []PostMedia `json:"media"`
}

func AddMedia(tx *sql.Tx, postId string, media []PostMedia) error {
	args := make([]any, 0, len(media))
	query := ""

	for i, v := range media {
		order := (i) * 9
		query += fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d), ",
			order+1, order+2, order+3, order+4, order+5, order+6, order+7, order+8, order+9)
		args = append(args, postId, v.Id, v.Url, v.UrlModifiers, v.Type, v.Mime, v.Subtype, v.Height, v.Width)
	}

	query = query[:len(query)-2]

	_, err := tx.Exec(`
		INSERT INTO post_media (post_id, id, url, url_modifiers, type, mime, subtype, height, width) VALUES
	`+query+`
		ON CONFLICT (id) DO NOTHING;
	`, args...)

	return err
}

func CreatePost(userId string, params *PostParams) (string, error) {
	if params.CommentToId != nil {
		var originalUserId string
		err := db.Client.QueryRow(`
			SELECT u.id
			FROM posts AS p
			LEFT JOIN users AS u ON p.user_id = u.id
			WHERE p.id = $1
		`, params.CommentToId).Scan(&originalUserId)
		if err != nil {
			return "", err
		}
		isBlocked, err := IsUserBlocked(originalUserId, userId)
		if err != nil {
			return "", err
		}
		if isBlocked {
			return "", ErrBlocked
		}
	}

	var postId string

	tx, err := db.Client.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	err = tx.QueryRow(`
		INSERT INTO posts (text, user_id, original_id, comment_to_id, response_to_id, can_comment)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id;
	`, params.Text, userId, ToNullString(params.OriginalId),
		ToNullString(params.CommentToId), ToNullString(params.ResponseToId), params.CanComment,
	).Scan(&postId)

	if err != nil {
		return "", err
	}

	if len(params.Media) == 0 {
		err = tx.Commit()
		return postId, err
	}

	err = AddMedia(tx, postId, params.Media)
	if err != nil {
		return "", err
	}

	err = tx.Commit()
	if err != nil {
		return "", err
	}

	return postId, nil
}

func GetPostById(id string) (*Post, error) {
	var post Post

	err := db.Client.QueryRow(`
		SELECT id, user_id, text, original_id, created_at, updated_at
		FROM posts
		WHERE id = $1;
	`, id).Scan(&post.Id, &post.UserId, &post.Text, &post.ParentId, &post.created_at, &post.updated_at)

	if err != nil {
		return nil, err
	}

	return &post, nil
}

type MediaFull struct {
	PostMedia
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	IsDeleted bool      `json:"isDeleted"`
	PostId    string    `json:"postId"`
}

func GetPostMedia(id string, all bool) ([]MediaFull, error) {
	result := make([]MediaFull, 0)

	query := "SELECT * FROM post_media WHERE post_id = $1"
	if !all {
		query += " AND is_deleted = FALSE;"
	}
	rows, err := db.Client.Query(query, id)

	if err != nil {
		return nil, err
	}

	for rows.Next() {
		temp := MediaFull{}
		err = rows.Scan(
			&temp.Id, &temp.CreatedAt, &temp.UpdatedAt, &temp.Url, &temp.IsDeleted,
			&temp.Type, &temp.PostId, &temp.UrlModifiers, &temp.Mime, &temp.Subtype,
			&temp.Width, &temp.Height,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, temp)
	}
	defer rows.Close()

	return result, nil
}

type PostUpdateRequest struct {
	Text       *string     `json:"text"`
	Media      []PostMedia `json:"media"`
	CanComment *bool       `json:"canComment"`
}

func UpdatePost(id string, post *PostUpdateRequest) error {
	queries := make([]string, 0)
	args := make([]any, 0)
	argsCount := 1

	if post.Text != nil {
		queries = append(queries, fmt.Sprintf("text = $%d", argsCount))
		args = append(args, *post.Text)
		argsCount++
	}

	if post.CanComment != nil {
		queries = append(queries, fmt.Sprintf("can_comment = $%d", argsCount))
		args = append(args, *post.CanComment)
		argsCount++
	}

	tx, err := db.Client.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if post.Media != nil {
		postMediaMap := make(map[string]bool)
		toDelete := make([]string, 0)

		media, err := GetPostMedia(id, false)
		if err != nil {
			return err
		}

		for _, v := range post.Media {
			postMediaMap[v.Url] = true
		}

		for _, v := range media {
			if _, ok := postMediaMap[v.Url]; !ok {
				toDelete = append(toDelete, fmt.Sprintf(`'%v'`, v.Url))
			}
		}

		if len(toDelete) != 0 {
			_, err = tx.Exec(
				fmt.Sprintf("UPDATE post_media SET is_deleted = TRUE WHERE url IN (%v);", strings.Join(toDelete, ", ")),
			)
			if err != nil {
				return err
			}
		}

		if len(post.Media) != 0 {
			err = AddMedia(tx, id, post.Media)
			if err != nil {
				return err
			}
		}
	}

	args = append(args, id)

	_, err = tx.Exec(
		"UPDATE posts SET\n"+strings.Join(queries, ", ")+fmt.Sprintf("\nWHERE id = $%d", argsCount),
		args...,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

type postUser struct {
	Id        *string `json:"id,omitempty"`
	Username  *string `json:"username,omitempty"`
	Name      *string `json:"name,omitempty"`
	Avatar    *Avatar `json:"avatar,omitempty"`
	IsDeleted bool    `json:"isDeleted"`
}

type postBase struct {
	Id        string   `json:"id"`
	Text      *string  `json:"text,omitempty"`
	User      postUser `json:"user"`
	CreatedAt string   `json:"createdAt"`
	UpdatedAt *string  `json:"updatedAt,omitempty"`
}

type postInfo struct {
	CanComment   bool    `json:"canComment"`
	IsDeleted    bool    `json:"isDeleted"`
	OriginalId   *string `json:"originalId,omitempty"`
	CommentToId  *string `json:"commentToId,omitempty"`
	ResponseToId *string `json:"responseToId,omitempty"`
	Likes        int     `json:"likes"`
	Dislikes     int     `json:"dislikes"`
	Reaction     int     `json:"reaction"`
	Comments     int     `json:"comments"`
	Responses    int     `json:"responseCount"`
	Reposts      int     `json:"reposts"`
	IsFavorite   bool    `json:"isFavorite"`
}

type PostsResult struct {
	postBase
	postInfo
	Media []PostMedia `json:"media"`
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
	Search                                                    string
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
			u.id as "userId", u.username, u.name, u.avatar_url, u.avatar_type, u.is_deleted as user_deleted,
			o.id as "originalId", c.id as "commentToId", r.id as "responseToId",
			COALESCE(pr.likes, 0), COALESCE(pr.dislikes, 0), COALESCE(pr.reaction, 0),
			COUNT(pc.id) as comments, COUNT(post_r.id) as responses, COALESCE(reposts.count, 0),
			CASE WHEN fp.post_id IS NOT NULL THEN TRUE ELSE FALSE END as favorite,
			m.media
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
		LEFT JOIN favorite_posts as fp ON p.id = fp.post_id AND fp.user_id = $1
		LEFT JOIN (
			SELECT post_id, jsonb_agg(jsonb_build_object(
				'id', id,
				'url', url,
				'urlModifiers', url_modifiers,
				'type', type,
				'mime', mime,
				'subtype', subtype,
				'width', width,
				'height', height
			)) as media
			FROM post_media
			WHERE is_deleted = FALSE
			GROUP BY post_id
		) m ON p.id = m.post_id`

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
		query += "\nWHERE p.comment_to_id IS NULL AND u.id = $2 AND p.is_deleted = FALSE\n"
		args = append(args, params.UserId)
	} else if params.IsFavorite {
		query += "\nWHERE fp.post_id IS NOT NULL\n"
	} else if params.Tag != "" {
		query += `
			RIGHT JOIN post_tags as pt ON p.id = pt.post_id
			LEFT JOIN tags as t ON pt.tag_id = t.id
			WHERE t.name = $2 AND p.is_deleted = FALSE
			`
		args = append(args, params.Tag)
	} else if params.Search != "" {
		query += "\nWHERE plainto_tsquery($2) @@ p.post_tsv\n"
		args = append(args, params.Search)
	} else {
		query += "\nWHERE p.comment_to_id IS NULL AND p.is_deleted = FALSE\n"
	}

	query += `
		GROUP BY p.id, u.id, o.id, c.id, r.id, pr.likes, pr.dislikes, pr.reaction, reposts.count, fp.post_id, m.media
	`

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

func parsePosts(rows *sql.Rows) ([]PostsResult, error) {
	result := make([]PostsResult, 0)
	for rows.Next() {
		var text, updatedAt string
		var avatarUrl, avatarType, userId, username, name, mediaJson *string
		row := PostsResult{}

		err := rows.Scan(
			&row.Id, &text, &row.CreatedAt, &updatedAt, &row.CanComment, &row.IsDeleted,
			&userId, &username, &name, &avatarUrl, &avatarType, &row.User.IsDeleted,
			&row.OriginalId, &row.CommentToId, &row.ResponseToId,
			&row.Likes, &row.Dislikes, &row.Reaction, &row.Comments, &row.Responses, &row.Reposts, &row.IsFavorite,
			&mediaJson,
		)

		if err != nil {
			return nil, err
		}

		if row.IsDeleted {
			result = append(result, row)
			continue
		}

		if !row.User.IsDeleted {
			row.User = postUser{Id: userId, Username: username, Name: name}
			if avatarUrl != nil {
				row.User.Avatar = &Avatar{Url: *avatarUrl, Type: *avatarType}
			}
		}

		if updatedAt != row.CreatedAt {
			row.UpdatedAt = &updatedAt
		}

		row.Text = &text

		if mediaJson == nil {
			row.Media = []PostMedia{}
		} else {
			err = json.Unmarshal([]byte(*mediaJson), &row.Media)
			if err != nil {
				return nil, err
			}

			if row.Media[0].Id == "" {
				row.Media = []PostMedia{}
			}
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

	result, err := parsePosts(rows)
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

	result, err := parsePosts(rows)
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
	err := db.Client.QueryRow(`
		SELECT COUNT(*) FROM posts WHERE comment_to_id IS NULL AND is_deleted = FALSE;
	`).Scan(&total)
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
	defer rows.Close()
	return parsePosts(rows)
}

func HasMoreFavorite(userId string, page int) (bool, error) {
	var total int
	err := db.Client.QueryRow("SELECT COUNT(*) FROM favorite_posts WHERE user_id = $1;", userId).Scan(&total)
	if err != nil {
		return false, err
	}
	return total > page*POSTS_PER_PAGE, nil
}

func DeletePost(postId, userId string) error {
	_, err := db.Client.Exec(`
		UPDATE posts SET is_deleted = TRUE
		WHERE id = $1 AND user_id = $2;
	`, postId, userId)

	return err
}

type PostChange struct {
	Id        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Text      string    `json:"text"`
	IsDeleted bool      `json:"isDeleted"`
}

type PostHistory struct {
	Changes []PostChange `json:"changes"`
	Media   []MediaFull  `json:"media"`
}

func GetPostHistory(postId string) (*PostHistory, error) {
	rows, err := db.Client.Query(`
		SELECT id, created_at, text, is_deleted
		FROM post_changes
		WHERE post_id = $1;
	`, postId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := PostHistory{Changes: []PostChange{}}

	for rows.Next() {
		change := PostChange{}
		err := rows.Scan(&change.Id, &change.CreatedAt, &change.Text, &change.IsDeleted)
		if err != nil {
			return nil, err
		}
		result.Changes = append(result.Changes, change)
	}

	result.Media, err = GetPostMedia(postId, true)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func SearchPosts(q string, page int, userId string) ([]PostsResult, error) {
	query, args := buildPostQuery(&QueryParams{RequestUserId: userId, Search: q, Page: page, OrderBy: SortNew})
	rows, err := db.Client.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return parsePosts(rows)
}

func HasSearchMorePosts(q string, page int) (bool, error) {
	var total int
	err := db.Client.QueryRow("SELECT COUNT(*) FROM posts WHERE plainto_tsquery($1) @@ post_tsv;", q).Scan(&total)
	if err != nil {
		return false, err
	}
	return total > page*POSTS_PER_PAGE, nil
}
