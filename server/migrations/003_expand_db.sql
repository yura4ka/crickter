-- +goose Up

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION on_post_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.text != OLD.text OR NEW.is_deleted != OLD.is_deleted THEN
    INSERT INTO post_changes (text, is_deleted, post_id)
    VALUES (NEW.text, NEW.is_deleted, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION check_post()
RETURNS TRIGGER AS $$
DECLARE
  comment_post posts%rowtype;
  response_post posts%rowtype;
  original_post posts%rowtype;
BEGIN
  IF NEW.comment_to_id IS NOT NULL THEN
    SELECT * FROM posts 
    INTO comment_post
    WHERE id = NEW.comment_to_id;

    IF comment_post.comment_to_id IS NOT NULL THEN
      RAISE EXCEPTION 'Can not add a comment to the comment!';
    END IF;
  END IF;

  IF NEW.response_to_id IS NOT NULL THEN
    IF NEW.comment_to_id IS NULL THEN
      RAISE EXCEPTION 'Can not add a response without a comment!';
    END IF;

    SELECT * FROM posts
    INTO response_post
    WHERE id = NEW.response_to_id;

    IF response_post.comment_to_id IS NULL OR response_post.comment_to_id != NEW.comment_to_id THEN
      RAISE EXCEPTION 'post.comment_to_id and response_post.comment_to_id are different!';
    END IF;
  END IF;

  IF NEW.original_id IS NOT NULL AND NEW.comment_to_id IS NOT NULL THEN
    IF NEW.response_to_id IS NULL THEN
      RAISE EXCEPTION 'Post has comment_to_id and original_id, but does not have response_to_id!';
    END IF;

    SELECT * FROM posts
    INTO original_post
    WHERE id = NEW.original_id;

    IF original_post.comment_to_id IS NULL 
      OR original_post.response_to_id IS NULL 
      OR original_post.comment_to_id != NEW.comment_to_id 
      OR original_post.response_to_id != NEW.response_to_id 
    THEN
      RAISE EXCEPTION 'Post and original comment should have the same comment_to_id and response_to_id!';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE OR REPLACE PROCEDURE delete_user(user_id UUID)
AS $$
DECLARE
  user_record users%rowtype;
BEGIN
  SELECT * FROM users
  INTO user_record
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO deleted_users (email, username, user_id)
  VALUES (user_record.email, user_record.username, user_record.id);

  UPDATE users
  SET is_deleted = TRUE, email = NULL, username = NULL
  WHERE id = user_id;

  COMMIT;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION on_message_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.text != OLD.text OR NEW.is_deleted = 1 AND OLD.is_deleted != 1 THEN
    INSERT INTO message_changes (text, is_deleted, message_id)
    VALUES (NEW.text, NEW.is_deleted, NEW.id);
  END IF;

  IF NEW.is_deleted != 1 THEN
    NEW.updated_at = Now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- posts

ALTER TABLE posts ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_user_id_fkey,
ADD CONSTRAINT posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_parent_id_fkey,
ADD CONSTRAINT posts_original_id_fkey
FOREIGN KEY (original_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE posts
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN can_comment BOOLEAN DEFAULT TRUE NOT NULL;

CREATE TRIGGER post_check
BEFORE INSERT ON posts
FOR EACH ROW
EXECUTE PROCEDURE check_post();

CREATE TRIGGER post_change
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE PROCEDURE on_post_change();

-- users

ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE users
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN username DROP NOT NULL;

ALTER TABLE users
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
ADD COLUMN avatar_url TEXT,
ADD COLUMN bio VARCHAR(128),
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE users
ADD CONSTRAINT valid_data
CHECK (
  is_deleted = TRUE AND email IS NULL AND username IS NULL
  OR is_deleted = FALSE AND email IS NOT NULL AND username IS NOT NULL
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- post_reactions

ALTER TABLE post_reactions
ADD COLUMN created_at TIMESTAMPTZ DEFAULT Now() NOT NULL;

CREATE INDEX reaction_post_idx ON post_reactions(post_id);

-- users_followers

ALTER TABLE users_followers
ADD COLUMN created_at TIMESTAMPTZ DEFAULT Now() NOT NULL;

CREATE INDEX user_follower_idx ON users_followers(follower_id);
CREATE INDEX user_following_idx ON users_followers(user_id);

-- post_changes

CREATE TABLE post_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  text VARCHAR(512) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX change_post_idx ON post_changes(post_id);

-- tags

CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(512) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL
);

CREATE TABLE post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX post_tags_idx ON post_tags(tag_id);
CREATE INDEX tag_posts_idx ON post_tags(post_id);

-- post_media

CREATE TYPE media_type AS ENUM ('image', 'video', 'file');

CREATE TABLE post_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  type media_type NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX post_media_idx ON post_media(post_id);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON post_media
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- favorite_posts

CREATE TABLE favorite_posts (
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX user_favorite_idx ON favorite_posts(user_id);

-- deleted_users

CREATE TABLE deleted_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  email VARCHAR(256) NOT NULL,
  username VARCHAR(64) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- blocked_users

CREATE TABLE blocked_users (
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, blocked_user_id)
);

-- conversations

CREATE TYPE conversation_type AS ENUM ('private', 'group');

CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  type conversation_type NOT NULL,
  is_deleted SMALLINT NOT NULL DEFAULT 0,
  can_add_users BOOLEAN NOT NULL DEFAULT FALSE,
  has_invite_link BOOLEAN NOT NULL DEFAULT FALSE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  CHECK (type = 'group' OR 
    (type = 'private' AND can_add_users = FALSE AND has_invite_link = FALSE))
);

-- participants

CREATE TABLE participants (
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  is_kicked BOOLEAN NOT NULL DEFAULT FALSE,
  has_left BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, conversation_id)
);

CREATE INDEX participants_user ON participants(user_id);
CREATE INDEX participants_conversation ON participants(conversation_id);

-- messages

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  text VARCHAR(1024),
  media_type media_type,
  media_url TEXT,
  is_deleted SMALLINT NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  original_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  response_to_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,

  CHECK (NOT (media_url IS NOT NULL AND media_type IS NULL)),
  CHECK (NOT (response_to_id IS NOT NULL AND original_id IS NOT NULL)),
  CHECK (NOT (post_id IS NOT NULL AND original_id IS NOT NULL)),
  CHECK (
    original_id IS NULL AND (text IS NOT NULL OR media_url IS NOT NULL OR post_id IS NOT NULL) 
    OR text IS NULL AND media_url IS NULL)
);

CREATE INDEX message_conversation_idx ON messages(conversation_id);

CREATE TRIGGER message_change
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE PROCEDURE on_message_change();

-- message_changes

CREATE TABLE message_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  text VARCHAR(1024),
  is_deleted SMALLINT NOT NULL DEFAULT 0,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE 
);

-- message_read

CREATE TABLE message_read (
  created_at TIMESTAMPTZ DEFAULT Now() NOT NULL,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX message_read_idx ON message_read(message_id);

-- +goose Down

DROP FUNCTION IF EXISTS on_post_change CASCADE;
DROP FUNCTION IF EXISTS check_post CASCADE;
DROP FUNCTION IF EXISTS on_message_change CASCADE;
DROP PROCEDURE IF EXISTS delete_user(UUID) CASCADE;

-- posts

ALTER TABLE posts ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_user_id_fkey,
ADD CONSTRAINT posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_original_id_fkey,
ADD CONSTRAINT posts_parent_id_fkey
FOREIGN KEY (original_id) REFERENCES posts(id) ON DELETE SET NULL;

ALTER TABLE posts DROP COLUMN is_deleted, DROP COLUMN can_comment;

-- users

ALTER TABLE users ALTER COLUMN created_at DROP NOT NULL;

ALTER TABLE users
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN username SET NOT NULL;

ALTER TABLE users
DROP COLUMN updated_at CASCADE,
DROP COLUMN avatar_url,
DROP COLUMN bio,
DROP COLUMN is_deleted;

ALTER TABLE users DROP CONSTRAINT valid_data

DROP TRIGGER IF EXISTS set_timestamp ON users;

-- post_reactions

ALTER TABLE post_reactions DROP COLUMN created_at;
DROP INDEX IF EXISTS reaction_post_idx;

-- users_followers

ALTER TABLE users_followers DROP COLUMN created_at;
DROP INDEX IF EXISTS user_follower_idx;
DROP INDEX IF EXISTS user_following_idx;

-- rest

DROP TABLE IF EXISTS post_changes CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;
DROP TABLE IF EXISTS post_media CASCADE;
DROP TABLE IF EXISTS favorite_posts CASCADE;
DROP TABLE IF EXISTS deleted_users CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TYPE IF EXISTS conversation_type CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_changes CASCADE;
DROP TABLE IF EXISTS message_read CASCADE;
