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
