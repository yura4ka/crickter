-- +goose Up
ALTER TABLE post_media
ADD COLUMN url_modifiers TEXT NOT NULL,
ADD COLUMN mime VARCHAR(64) NOT NULL,
ADD COLUMN subtype VARCHAR(32) NOT NULL,
ADD COLUMN width SMALLINT NOT NULL,
ADD COLUMN height SMALLINT NOT NULL;

ALTER TABLE users
ADD COLUMN avatar_type VARCHAR(32) DEFAULT NULL;

ALTER TABLE users
ADD CONSTRAINT valid_avatar
CHECK (avatar_url IS NULL AND avatar_type IS NULL 
  OR avatar_type IS NOT NULL AND avatar_type IS NOT NULL);

-- +goose Down
ALTER TABLE post_media
DROP COLUMN url_modifiers,
DROP COLUMN mime,
DROP COLUMN subtype,
DROP COLUMN width,
DROP COLUMN height;

ALTER TABLE users DROP COLUMN avatar_type;

ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_avatar;