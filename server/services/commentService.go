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
