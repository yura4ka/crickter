package services

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/yura4ka/crickter/db"
	"github.com/yura4ka/crickter/scanner"
)

type MessageMedia struct {
	Type *string `json:"type"`
	Url  *string `json:"url"`
}

type CreateMessageRequest struct {
	ConversationId string        `json:"conversationId"`
	Text           *string       `json:"text"`
	OriginalId     *string       `json:"originalId"`
	ResponseToId   *string       `json:"responseToId"`
	PostId         *string       `json:"postId"`
	Media          *MessageMedia `json:"media"`
}

func isParticipant(convId, userId string) bool {
	result := false
	err := db.Client.QueryRow(`
		SELECT true
		FROM participants
		WHERE conversation_id = $1 AND user_id = $2 AND has_left = false AND is_kicked = false;
	`, convId, userId).Scan(&result)
	if err != nil {
		return false
	}
	return result
}

func CreateMessage(message *CreateMessageRequest, userId string) (string, error) {
	if !isParticipant(message.ConversationId, userId) {
		return "", ErrForbidden
	}

	c, err := getConversationById(message.ConversationId)
	if err != nil {
		return "", err
	}

	if c.ConvType == "private" {
		var receiver string
		err := db.Client.QueryRow(`
			SELECT user_id
			FROM participants
			WHERE user_id != $1
			LIMIT 1;
		`, userId).Scan(&receiver)
		if err != nil {
			return "", err
		}
		isBlocked, err := IsUserBlocked(receiver, userId)
		if err != nil {
			return "", err
		}
		if isBlocked {
			return "", ErrBlocked
		}
	}

	var mUrl, mType *string
	if message.Media != nil {
		mUrl = message.Media.Url
		mType = message.Media.Type
	}

	tx, err := db.Client.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	var id string
	err = tx.QueryRow(`
		INSERT INTO messages (user_id, conversation_id, text, original_id, response_to_id, post_id, media_type, media_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id;
	`, &userId, &message.ConversationId, &message.Text, &message.OriginalId, &message.ResponseToId, &message.PostId, &mUrl, &mType).
		Scan(&id)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(`
		INSERT INTO message_read (message_id, user_id)
		VALUES ($1, $2)
	`, id, userId)
	if err != nil {
		return "", err
	}

	return id, tx.Commit()
}

func GetMessages(convId, userId string) ([]Message, error) {
	if !isParticipant(convId, userId) {
		return nil, ErrForbidden
	}

	var result []Message

	rows, err := db.Client.Query(`
		SELECT m.*,
			CASE WHEN mr.message_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_read,
			u.id, u.username, u.name, u.avatar_url, u.avatar_type, u.is_deleted
		FROM messages AS m
		LEFT JOIN message_read AS mr ON m.id = mr.message_id AND mr.user_id = $1
		INNER JOIN USERS AS u ON m.user_id = u.id
		WHERE m.conversation_id = $2
			AND (m.is_deleted = 0 OR m.is_deleted = 2 AND m.user_id != $1)
		ORDER BY m.created_at DESC;
	`, userId, convId)

	if err != nil {
		if err == sql.ErrNoRows {
			return result, nil
		}
		return nil, err
	}

	result, err = scanner.ScanRows(result, rows)
	return result, err
}

type EditMessageRequest struct {
	Text  *string       `json:"text,omitempty"`
	Media *MessageMedia `json:"media,omitempty"`
}

func EditMessage(m *EditMessageRequest, userId, messageId string) error {
	queries := make([]string, 0)
	args := make([]any, 0)
	argsCount := 1

	if m.Text != nil {
		queries = append(queries, fmt.Sprintf("text = $%d", argsCount))
		args = append(args, ToNullString(m.Text))
		argsCount++
	}

	if m.Media != nil {
		if m.Media.Url == nil || m.Media.Type == nil {
			return ErrWrongData
		}
		if *m.Media.Url == "" {
			m.Media.Type = m.Media.Url
		}
		queries = append(queries, fmt.Sprintf("media_url = $%d, media_type = $%d", argsCount, argsCount+1))
		args = append(args, ToNullString(m.Media.Url), ToNullString(m.Media.Type))
		argsCount += 2
	}

	args = append(args, messageId, userId)

	_, err := db.Client.Exec(
		"UPDATE messages SET\n"+strings.Join(queries, ", ")+fmt.Sprintf("\nWHERE id = $%d AND user_id = $%d", argsCount, argsCount+1),
		args...,
	)

	return err
}

func ReadMessage(messageId, userId string) error {
	var convId string

	err := db.Client.QueryRow(`
		SELECT conversation_id
		FROM messages 
		WHERE id = $1;
	`, messageId).Scan(convId)

	if err != nil {
		return err
	}

	if !isParticipant(convId, userId) {
		return ErrForbidden
	}

	_, err = db.Client.Exec(`
		INSERT INTO message_read (message_id, user_id)
		VALUES ($1, $2)
	`, messageId, userId)

	return err
}

func DeleteMessage(messageId, userId string, onlyCreator bool) error {
	var deleteType int
	if onlyCreator {
		deleteType = 2
	} else {
		deleteType = 1
	}

	_, err := db.Client.Exec(`
		UPDATE messages SET is_deleted = $1
		WHERE id = $2 AND user_id = $3;
	`, deleteType, messageId, userId)

	return err
}

type MessageChange struct {
	Id        string        `json:"id"`
	CreatedAt string        `json:"createdAt"`
	Text      *string       `json:"text"`
	IsDeleted int           `json:"isDeleted"`
	Media     *MessageMedia `json:"media"`
}

func GetMessageChanges(messageId, userId string) ([]MessageChange, error) {
	rows, err := db.Client.Query(`
		SELECT c.id, c.created_at, c.text, c.is_deleted, c.media_type, c.media_url
		FROM messages AS m
		LEFT JOIN message_changes AS c ON m.id = c.message_id
		WHERE m.id = $1 AND m.user_id = $2
	`, messageId, userId)
	if err != nil {
		return nil, err
	}

	var result []MessageChange
	result, err = scanner.ScanRows(result, rows)
	return result, err
}
