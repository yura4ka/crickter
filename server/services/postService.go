package services

import (
	"strings"

	"github.com/google/uuid"
	"github.com/yura4ka/crickter/db"
	"github.com/yura4ka/crickter/ent"
	"github.com/yura4ka/crickter/ent/post"
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
	Id   string   `json:"id"`
	Text string   `json:"text"`
	User postUser `json:"user"`
}

type PostsResult struct {
	postBase
	CreatedAt string    `json:"created_at"`
	UpdatedAt *string   `json:"updated_at"`
	Original  *postBase `json:"original"`
	Likes     int       `json:"liked"`
	Dislikes  int       `json:"disliked"`
	Reaction  int       `json:"reaction"`
}

func GetPosts(userId string) ([]PostsResult, error) {
	if userId == "" {
		userId = "00000000-0000-0000-0000-000000000000"
	}

	rows, err := db.Client.QueryContext(db.Ctx,
		`SELECT p.id, p.text, p.created_at, p.updated_at,
			u.id as "userId", u.username,
			o.id as "parentId", o.text as "parentText", ou.id as "parentUserId", ou.username as "parentUsername",
			SUM(case when pr.liked = true then 1 else 0 end) AS likes,
			SUM(case when pr.liked = false then 1 else 0 end) AS dislikes,
			SUM(case
				when pr.user_post_reactions != $1 then 0
				when pr.liked = true then 1
				when pr.liked = false then -1 end) AS reaction
		FROM posts as p
		LEFT JOIN users as u ON p.user_id = u.id
		LEFT JOIN posts as o ON p.post_reposts = o.id
		LEFT JOIN users as ou ON o.user_id = ou.id
		LEFT JOIN post_reactions as pr ON p.id = pr.post_reactions
		GROUP BY p.id, u.id, o.id, ou.id
		ORDER BY p.created_at DESC;`,
		userId,
	)
	defer rows.Close()

	if err != nil {
		return nil, err
	}

	result := make([]PostsResult, 0)
	for rows.Next() {
		var id, text, userId, username, createdAt, updatedAt string
		var parentId, parentText, parentUserId, parentUsername *string
		var likes, dislikes int
		var reaction *int
		err := rows.Scan(
			&id, &text, &createdAt, &updatedAt,
			&userId, &username,
			&parentId, &parentText, &parentUserId, &parentUsername,
			&likes, &dislikes, &reaction,
		)
		if err != nil {
			return nil, err
		}
		row := PostsResult{
			postBase:  postBase{Id: id, Text: text, User: postUser{Id: userId, Username: username}},
			CreatedAt: createdAt,
			Likes:     likes,
			Dislikes:  dislikes,
		}

		if parentId != nil {
			row.Original = &postBase{
				Id: *parentId, Text: *parentText, User: postUser{Id: *parentUserId, Username: *parentUsername},
			}
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
