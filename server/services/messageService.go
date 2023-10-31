package services

import "github.com/yura4ka/crickter/db"

type MessageMedia struct {
	Url  string `json:"url"`
	Type string `json:"type"`
}

type CreateMessageRequest struct {
	ConversationId string  `json:"conversationId"`
	Text           *string `json:"text"`
	OriginalId     *string `json:"originalId"`
	ResponseToId   *string `json:"responseToId"`
	PostId         *string `json:"postId"`
}

func CreateMessage(message *CreateMessageRequest, userId string) (string, error) {
	var id string
	err := db.Client.QueryRow(`
		INSERT INTO messages (user_id, conversation_id, text, original_id, response_to_id, post_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id;
	`, &userId, &message.ConversationId, &message.Text, &message.OriginalId, &message.ResponseToId, &message.PostId).
		Scan(&id)
	return id, err
}
