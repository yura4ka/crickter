package services

import (
	"github.com/google/uuid"
	"github.com/yura4ka/crickter/db"
	"github.com/yura4ka/crickter/ent"
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
		SetText(text).
		SetNillableOriginalID(parentUuid).
		Save(db.Ctx)
}
