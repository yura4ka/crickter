-- +goose Up

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION on_post_change()
RETURNS TRIGGER AS $$
DECLARE
  tag RECORD;
  tag_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.text != OLD.text OR NEW.is_deleted != OLD.is_deleted THEN
    INSERT INTO post_changes (text, is_deleted, post_id)
    VALUES (NEW.text, NEW.is_deleted, NEW.id);
  END IF;

  IF NEW.text = OLD.text THEN
    RETURN NEW;
  END IF;

  FOR tag IN
    SELECT DISTINCT lower((regexp_matches(NEW.text, '\Y#(\w+)', 'gm'))[1]) AS name
  LOOP
    SELECT id FROM tags INTO tag_id WHERE name = tag.name;
    IF tag_id IS NULL THEN
      INSERT INTO tags (name) VALUES (tag.name) RETURNING id INTO tag_id;
    END IF;
    INSERT INTO post_tags (post_id, tag_id) VALUES (NEW.id, tag_id) ON CONFLICT DO NOTHING;
  END LOOP;
  
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

    IF comment_post.can_comment = FALSE THEN
      RAISE EXCEPTION 'Comments has been disabled on this post!';
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
CREATE OR REPLACE FUNCTION check_favorite()
RETURNS TRIGGER AS $$
DECLARE
  post posts%rowtype;
BEGIN
  SELECT * FROM posts INTO post
  WHERE id = NEW.post_id;

  IF post.comment_to_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot add a comment to favorite!';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER favorite_check
BEFORE INSERT ON favorite_posts
FOR EACH ROW
EXECUTE PROCEDURE check_favorite();

DROP TRIGGER IF EXISTS post_change ON posts;

CREATE TRIGGER post_change
AFTER INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE PROCEDURE on_post_change();

-- +goose Down

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

DROP FUNCTION IF EXISTS check_favorite CASCADE;

DROP TRIGGER IF EXISTS post_change ON posts;

CREATE TRIGGER post_change
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE PROCEDURE on_post_change();