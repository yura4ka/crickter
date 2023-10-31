package services

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/yura4ka/crickter/db"
	"github.com/yura4ka/crickter/scanner"
)

type CreateConversationRequest struct {
	ConvType  string `json:"type"`
	Name      string `json:"name"`
	AddUserId string `json:"addUserId"`
}

func CreateConversation(creatorId string, params *CreateConversationRequest) (string, error) {
	if creatorId == params.AddUserId {
		return "", ErrAlreadyExists
	}

	params.Name = strings.TrimSpace(params.Name)
	if params.ConvType == "private" {
		params.Name = ""
	} else if len(params.Name) == 0 {
		return "", ErrEmptyString
	}

	if params.ConvType == "private" {
		var count int
		err := db.Client.QueryRow(`
			SELECT COUNT(c.*)
			FROM conversations AS c
			INNER JOIN participants AS p1 ON c.id = p1.conversation_id AND p1.user_id = $1
			INNER JOIN participants AS p2 ON c.id = p2.conversation_id AND p2.user_id = $2
			WHERE c.type = 'private'
		`, creatorId, params.AddUserId).Scan(&count)
		if err != nil {
			return "", err
		}
		if count != 0 {
			return "", ErrAlreadyExists
		}
	}

	var id string

	tx, err := db.Client.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	err = tx.QueryRow(`
		INSERT INTO conversations (creator_id, type, name)
		VALUES ($1, $2, $3)
		RETURNING id;
	`, creatorId, params.ConvType, ToNullString(&params.Name)).Scan(&id)
	if err != nil {
		return "", err
	}

	query := "VALUES ($1, $2)"
	args := make([]any, 0)
	args = append(args, id, creatorId)

	if params.ConvType == "private" {
		query += ", ($1, $3)"
		args = append(args, params.AddUserId)
	}

	_, err = tx.Exec(`
		INSERT INTO participants (conversation_id, user_id)
	`+query, args...)
	if err != nil {
		return "", err
	}

	err = tx.Commit()
	if err != nil {
		return "", err
	}

	return id, err
}

func GetConversations(userId string) ([]Conversation, error) {
	rows, err := db.Client.Query(`
		SELECT c.id, c.type, c.name,
			u.*,
			CASE
				WHEN COUNT(m.*) = 0 THEN 0 
			ELSE
				COUNT(CASE WHEN mr.message_id IS NULL AND m.is_deleted != 1 THEN 1 ELSE 0 END)
			END AS unread,
			lm.*
		FROM conversations AS c
		INNER JOIN participants AS o ON c.id = o.conversation_id AND o.user_id = $1
		LEFT JOIN messages AS m ON c.id = m.conversation_id
		LEFT JOIN message_read AS mr ON m.id = mr.message_id AND mr.user_id = $1
		LEFT JOIN LATERAL (
			SELECT u.id AS user_id, u.username, u.name, u.avatar_url, u.avatar_type, u.is_deleted AS user_deleted
			FROM participants AS p
			LEFT JOIN users AS u ON p.user_id = u.id
			WHERE p.conversation_id = c.id AND p.user_id != $1
			LIMIT 1
		) u ON true
		LEFT JOIN (
			SELECT conversation_id, text, lm.created_at,
				CASE WHEN media_url IS NULL THEN FALSE ELSE TRUE END AS is_media,
				CASE WHEN original_id IS NULL THEN FALSE ELSE TRUE END AS is_repost,
				CASE WHEN post_id IS NULL THEN FALSE ELSE TRUE END AS is_post,
				u.id AS m_user_id, u.username AS m_username, u.name AS m_name, u.avatar_url AS m_avatar_url,
				u.avatar_type AS m_avatar_type, u.is_deleted AS m_user_deleted
			FROM messages AS lm
			LEFT JOIN USERS AS u ON lm.user_id = u.id
			ORDER BY lm.created_at DESC
			LIMIT 1
		) lm ON lm.conversation_id = c.id
		GROUP BY c.id, u.user_id, u.username, u.name, u.avatar_url, u.avatar_type, u.user_deleted,
			lm.conversation_id, lm.text, lm.created_at, lm.is_media, lm.is_repost, lm.is_post,
			lm.m_user_id, lm.m_username, lm.m_name, lm.m_avatar_url, lm.m_avatar_type, lm.m_user_deleted
		ORDER BY c.created_at DESC, lm.created_at DESC;
	`, userId)

	if err != nil {
		return nil, err
	}

	var result []Conversation
	result, err = scanner.ScanRows(result, rows)
	if err != nil {
		return nil, err
	}

	return result, nil
}

type convSmall struct {
	ConvType, CreatorId string
	CanAddUsers         bool
}

func getConversationById(id string) (*convSmall, error) {
	var c convSmall

	row := db.Client.QueryRow(`
		SELECT type, creator_id, can_add_users
		FROM conversations
		WHERE id = $1;
	`, id)

	err := scanner.Scan(row, &c)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func AddUsersToConversation(userId, convId string, users []string) error {
	c, err := getConversationById(convId)
	if err != nil {
		return err
	}

	if c.ConvType == "private" {
		return ErrPrivateConversation
	}

	if !c.CanAddUsers && userId != c.CreatorId {
		return ErrCannotAddUser
	} else if c.CanAddUsers && userId != c.CreatorId {
		var found string
		err := db.Client.QueryRow(`
			SELECT p.user_id 
			FROM conversations AS c 
			INNER JOIN participants AS p ON c.id = p.conversation_id
			WHERE c.id = $1 AND p.user_id = $2 AND p.has_left = false AND p.is_kicked = false;
		`, convId, userId).Scan(&found)
		if err != nil {
			return err
		}
	}

	args := make([]any, 1, len(users)+1)
	args[0] = convId
	argCount := 2
	queries := make([]string, 0, len(users))

	for _, u := range users {
		queries = append(queries, fmt.Sprintf("($1, $%d)", argCount))
		args = append(args, u)
		argCount++
	}

	_, err = db.Client.Exec(`
		INSERT INTO participants (conversation_id, user_id) VALUES 
	`+strings.Join(queries, ", ")+`
		ON CONFLICT ON CONSTRAINT participants_pkey DO UPDATE SET is_kicked = false;
	`, args...)

	return err
}

func KickUser(convId, userId, requestUserId string) error {
	if userId == requestUserId {
		return ErrCannotKick
	}

	c, err := getConversationById(convId)
	if err != nil {
		return err
	}

	if c.ConvType == "private" || c.CreatorId != requestUserId {
		return ErrCannotKick
	}

	_, err = db.Client.Exec(`
		UPDATE participants SET is_kicked = true
		WHERE conversation_id = $1 AND user_id = $2
	`, convId, userId)
	return err
}

func LeaveConversation(convId, userId string) error {
	c, err := getConversationById(convId)
	if err != nil {
		return err
	}

	if c.ConvType == "private" {
		return ErrPrivateConversation
	}

	tx, err := db.Client.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = db.Client.Exec(`
			UPDATE participants SET has_left = true
			WHERE conversation_id = $1 AND user_id = $2;
		`, convId, userId)
	if err != nil {
		return err
	}

	if c.CreatorId != userId {
		return tx.Commit()
	}

	var newCreatorId string
	err = db.Client.QueryRow(`
		SELECT p.user_id
		FROM conversations AS c
		INNER JOIN participants AS p ON c.id = p.conversation_id
		WHERE p.user_id != $1 AND p.has_left = false AND p.is_kicked = false
		LIMIT 1;
	`).Scan(&newCreatorId)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if err == sql.ErrNoRows {
		_, err = tx.Exec(`
			UPDATE conversations SET is_deleted = 1
			WHERE id = $1;
		`, convId)

		return err
	}

	_, err = tx.Exec(`
		UPDATE conversations SET creator_id = $1
		WHERE id = $2;
	`, newCreatorId, convId)
	if err != nil {
		return err
	}

	return tx.Commit()
}

type ConversationInfo struct {
	Id            string        `json:"id"`
	Name          *string       `json:"name,omitempty"`
	CanAddUsers   bool          `json:"canAddUsers"`
	HasInviteLink bool          `json:"hasInviteLink"`
	Users         []MessageUser `json:"users" noscan:""`
}

func GetConversationInfo(convId, userId string) (*ConversationInfo, error) {
	rows, err := db.Client.Query(`
		SELECT c.id, c.name, c.can_add_users, c.has_invite_link,
			u.id AS user_id, u.username, u.name, u.avatar_url, u.avatar_type, u.is_deleted
		FROM conversations AS c
		LEFT JOIN participants AS p ON c.id = p.conversation_id
		LEFT JOIN users AS u ON p.user_id = u.id
		WHERE c.id = $1 AND p.has_left = false AND p.is_kicked = false;
	`, convId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]MessageUser, 0)
	c := ConversationInfo{Users: users}
	foundUser := false

	for rows.Next() {
		u := MessageUser{}
		err = scanner.Scan(rows, &c, &u)
		if err != nil {
			return nil, err
		}

		if userId == *u.Id {
			foundUser = true
		}

		c.Users = append(c.Users, u)
	}

	if !foundUser {
		return nil, ErrForbidden
	}

	return &c, nil
}

func JoinConversation(convId, userId string) error {
	var isKicked bool
	err := db.Client.QueryRow(`
		INSERT INTO participants (conversation_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT ON CONSTRAINT participants_pkey 
			DO UPDATE SET has_left = false
		RETURNING is_kicked;
	`, convId, userId).Scan(&isKicked)
	if err != nil {
		return err
	}

	if isKicked {
		return ErrUserKicked
	}

	return nil
}
