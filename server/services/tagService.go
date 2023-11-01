package services

import (
	"time"

	"github.com/yura4ka/crickter/db"
)

const TAGS_PER_PAGE = 15

type TagsResponse struct {
	Name      string    `json:"name"`
	PostCount int       `json:"postCount"`
	CreatedAt time.Time `json:"createdAt"`
}

func GetTags(page int) ([]TagsResponse, error) {
	limit := TAGS_PER_PAGE
	offset := TAGS_PER_PAGE * (page - 1)

	if page == -1 {
		limit = 3
		offset = 0
	}

	rows, err := db.Client.Query(`
		SELECT t.name, COUNT(pt.post_id) as count, t.created_at
		FROM tags AS t
		LEFT JOIN post_tags AS pt ON t.id = pt.tag_id
		GROUP BY t.name, t.created_at
		HAVING COUNT(pt.post_id) != 0
		ORDER BY count DESC
		LIMIT $1 OFFSET $2;
	`, limit, offset)

	if err != nil {
		return nil, err
	}

	result := make([]TagsResponse, 0)

	for rows.Next() {
		tag := TagsResponse{}
		err := rows.Scan(&tag.Name, &tag.PostCount, &tag.CreatedAt)
		if err != nil {
			return nil, err
		}
		result = append(result, tag)
	}

	return result, nil
}

func HasMoreTags(page int) (bool, error) {
	var total int
	err := db.Client.QueryRow(`
		SELECT COUNT(t.name)
		FROM tags AS t
		LEFT JOIN post_tags AS pt ON t.id = pt.tag_id
		GROUP BY t.name
		HAVING COUNT(pt.post_id) != 0
	`).Scan(&total)

	if err != nil {
		return false, err
	}

	return total > page*TAGS_PER_PAGE, nil
}

func HasTagMorePosts(tag string, page int) (bool, error) {
	var total int
	err := db.Client.QueryRow(`
		SELECT count(pt.post_id)
		FROM tags AS t
		LEFT JOIN post_tags AS pt ON t.id = pt.tag_id
		LEFT JOIN posts AS p ON pt.post_id = p.id
		WHERE t.name = $1 AND p.is_deleted = FALSE;
	`, tag).Scan(&total)

	if err != nil {
		return false, err
	}

	return total > page*POSTS_PER_PAGE, nil
}
