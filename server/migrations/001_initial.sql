-- +goose Up
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = Now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TABLE users(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now(),
  email VARCHAR(256) UNIQUE NOT NULL,
  password VARCHAR(512) NOT NULL,
  name VARCHAR(64) NOT NULL,
  username VARCHAR(64) UNIQUE NOT NULL,
  is_private BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE users_followers(
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, follower_id)
);

CREATE TABLE posts(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  text varchar(512) NOT NULL,
  post_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES posts(id) ON DELETE SET NULL
);

CREATE INDEX post_tsv_idx ON posts USING GIN (post_tsv);
CREATE INDEX post_user_idx ON posts (user_id);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TABLE post_reactions(
  liked BOOLEAN NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

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

-- +goose Down
DROP TABLE IF EXISTS users, posts, comments, post_reactions, comment_reactions;
DROP FUNCTION IF EXISTS update_timestamp;