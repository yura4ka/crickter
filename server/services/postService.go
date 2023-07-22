package services

import (
	"database/sql"
	"strings"

	"github.com/google/uuid"
	"github.com/yura4ka/crickter/db"
	"github.com/yura4ka/crickter/ent"
	"github.com/yura4ka/crickter/ent/post"
	"github.com/yura4ka/crickter/ent/postreaction"
	"github.com/yura4ka/crickter/ent/user"
)

func CreatePost(userId, text string, parentId *string) (*ent.Post, error) {
	var parentUuid *uuid.UUID
	if parentId != nil {
		temp, _ := uuid.Parse(*parentId)
		parentUuid = &temp
	}
	userUuid, _ := uuid.Parse(userId)

	return db.Client.Post.Create().
		SetUserID(userUuid).
		SetText(strings.TrimSpace(text)).
		SetNillableOriginalID(parentUuid).
		Save(db.Ctx)
}

func GetPostById(id string) (*ent.Post, error) {
	uuid, _ := uuid.Parse(id)
	return db.Client.Post.Query().Where(post.IDEQ(uuid)).Only(db.Ctx)
}

func UpdatePost(id, text string) (*ent.Post, error) {
	uuid, _ := uuid.Parse(id)
	return db.Client.Post.UpdateOneID(uuid).SetText(strings.TrimSpace(text)).Save(db.Ctx)
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

func GetPosts(id, userId string) ([]PostsResult, error) {
	if userId == "" {
		userId = "00000000-0000-0000-0000-000000000000"
	}

	query := `
		SELECT p.id, p.text, p.created_at, p.updated_at,
			u.id as "userId", u.username,
			o.id as "parentId",
			SUM(case when pr.liked = true then 1 else 0 end) AS likes,
			SUM(case when pr.liked = false then 1 else 0 end) AS dislikes,
			SUM(case
				when pr.user_post_reactions != $1 then 0
				when pr.liked = true then 1
				when pr.liked = false then -1 end) AS reaction,
			COUNT(c.id) AS comments
		FROM posts as p
		LEFT JOIN users as u ON p.user_id = u.id
		LEFT JOIN posts as o ON p.post_reposts = o.id
		LEFT JOIN post_reactions as pr ON p.id = pr.post_reactions
		LEFT JOIN comments as c ON p.id = c.post_comments`

	if id != "" {
		query += "\nWHERE p.id = $2\n"
	}

	query += `
		GROUP BY p.id, u.id, o.id, c.id
		ORDER BY p.created_at DESC;`

	var rows *sql.Rows
	var err error

	if id != "" {
		rows, err = db.Client.QueryContext(db.Ctx, query, userId, id)
	} else {
		rows, err = db.Client.QueryContext(db.Ctx, query, userId)
	}

	defer rows.Close()

	if err != nil {
		return nil, err
	}

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

func ProcessReaction(userId, postId string, liked bool) error {
	uid, _ := uuid.Parse(userId)
	pid, _ := uuid.Parse(postId)

	r, _ := db.Client.PostReaction.Query().Where(
		postreaction.HasPostWith(post.IDEQ(pid)),
		postreaction.HasUserWith(user.IDEQ(uid)),
	).Only(db.Ctx)

	if r == nil {
		_, err := db.Client.PostReaction.Create().SetLiked(liked).SetPostID(pid).SetUserID(uid).Save(db.Ctx)
		return err
	}

	if r.Liked != liked {
		_, err := r.Update().SetLiked(liked).Save(db.Ctx)
		return err
	}

	return db.Client.PostReaction.DeleteOne(r).Exec(db.Ctx)
}
