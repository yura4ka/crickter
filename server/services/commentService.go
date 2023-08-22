package services

import "github.com/yura4ka/crickter/db"

func GetComments(postId, userId string) {
	db.Client.Query(`
		SELECT c.id as id, 
		FROM comments as c
		LEFT JOIN comment_reactions as cr
		ON c.id = cr.comment_reactions
		WHERE post_comments = $1
	`)
}

func CreateComment(postId, userId, text string, parentId *string) (string, error) {
	var id string

	err := db.Client.QueryRow(
		`
			INSERT INTO comments (text, post_id, user_id, parent_id)
			VALUES ($1, $2, $3, $4)
			RETURNING id;
		`, &text, &postId, &userId, ToNullString(parentId)).Scan(&id)

	return id, err
}
