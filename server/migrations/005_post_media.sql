-- +goose Up
ALTER TABLE post_media
ADD COLUMN url_modifiers TEXT NOT NULL,
ADD COLUMN mime VARCHAR(64) NOT NULL,
ADD COLUMN subtype VARCHAR(32) NOT NULL;

-- +goose Down
ALTER TABLE post_media
DROP COLUMN url_modifiers,
DROP COLUMN mime,
DROP COLUMN subtype;