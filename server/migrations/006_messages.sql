-- +goose Up
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION on_message_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT'
    OR NEW.text != OLD.text OR NEW.is_deleted != OLD.is_deleted
    OR NEW.media_url != OLD.media_url 
  THEN
    INSERT INTO post_changes (text, media_url, media_type, is_deleted, message_id)
    VALUES (NEW.text, NEW.media_url, NEW.media_type, NEW.is_deleted, NEW.id);
  END IF;

  IF NEW.is_deleted != 1 THEN
    NEW.updated_at = Now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION check_message()
RETURNS TRIGGER AS $$
DECLARE
  found_user UUID;
  response_message messages%rowtype;
BEGIN
  SELECT user_id
  FROM participants INTO found_user
  WHERE user_id = NEW.user_id AND conversation_id = NEW.conversation_id;

  IF found_user IS NULL THEN
    RAISE EXCEPTION 'No such user in this conversation!';
  END IF;

  IF NEW.response_to_id IS NOT NULL THEN
    SELECT * FROM messages INTO response_message
    WHERE id = NEW.response_to_id;

    IF response_message.conversation_id != NEW.conversation_id THEN
      RAISE EXCEPTION 'Cannot response to the message from another conversation!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER check_message
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE PROCEDURE check_message();

ALTER TABLE conversations ADD COLUMN name VARCHAR(64);

ALTER TABLE message_changes
ADD COLUMN media_url TEXT,
ADD COLUMN media_type media_type;

-- +goose Down
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION on_message_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.text != OLD.text OR NEW.is_deleted != OLD.is_deleted THEN
    INSERT INTO post_changes (text, is_deleted, message_id)
    VALUES (NEW.text, NEW.is_deleted, NEW.id);
  END IF;

  IF NEW.is_deleted != 1 THEN
    NEW.updated_at = Now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

DROP FUNCTION IF EXISTS check_message CASCADE;

ALTER TABLE conversations DROP COLUMN IF EXISTS name;

ALTER TABLE message_changes
DROP COLUMN IF EXISTS media_url,
DROP COLUMN IF EXISTS media_type;
