-- +goose Up
DROP TABLE IF EXISTS comments, comment_reactions;

ALTER TABLE posts RENAME parent_id TO original_id;
ALTER TABLE posts ADD comment_to_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE posts ADD response_to_id UUID REFERENCES posts(id) ON DELETE CASCADE;

-- +goose Down
ALTER TABLE posts RENAME original_id TO parent_id;
ALTER TABLE posts DROP COLUMN comment_to_id;
ALTER TABLE posts DROP COLUMN response_to_id;

CREATE TABLE comments(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  text varchar(256) NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TABLE comment_reactions(
  liked BOOLEAN NOT NULL,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);