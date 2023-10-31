-- +goose Up
ALTER TABLE conversations
ADD COLUMN name VARCHAR(64);

-- +goose Down
ALTER TABLE conversations DROP COLUMN IF EXISTS name;