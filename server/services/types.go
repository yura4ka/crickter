package services

type UserAvatar struct {
	Url  *string `json:"url"`
	Type *string `json:"type"`
}

type MessageUser struct {
	Id        *string     `json:"id,omitempty"`
	Username  *string     `json:"username,omitempty"`
	Name      *string     `json:"name,omitempty"`
	Avatar    *UserAvatar `json:"avatar,omitempty"`
	IsDeleted *bool       `json:"isDeleted"`
}

type MessageShort struct {
	ConversationId *string      `json:"conversationId"`
	Text           *string      `json:"text,omitempty"`
	CreatedAt      *string      `json:"createdAt"`
	HasMedia       *bool        `json:"hasMedia"`
	IsRepost       *bool        `json:"isRepost"`
	IsPost         *bool        `json:"isPost"`
	User           *MessageUser `json:"user,omitempty"`
}

type Conversation struct {
	Id          string        `json:"id"`
	ConvType    string        `json:"type"`
	Name        *string       `json:"name,omitempty"`
	User        *MessageUser  `json:"user,omitempty"`
	UnreadCount int           `json:"unreadCount"`
	LastMessage *MessageShort `json:"lastMessage,omitempty"`
}

func (u *MessageUser) SqlClean() {
	if *u.IsDeleted {
		*u = MessageUser{IsDeleted: u.IsDeleted}
		return
	}

	if u.Avatar.Url == nil {
		u.Avatar = nil
	}
}

func (c *Conversation) SqlClean() {
	if c.ConvType == "group" || c.User.IsDeleted == nil {
		c.User = nil
	}

	if c.LastMessage.ConversationId == nil {
		c.LastMessage = nil
	}
}
