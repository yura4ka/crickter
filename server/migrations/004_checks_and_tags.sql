-- +goose Up


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

-- +goose Down

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
