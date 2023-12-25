-- +goose Up
ALTER TABLE posts DISABLE TRIGGER post_change;
ALTER TABLE posts DISABLE TRIGGER post_check;

-- +goose Down
ALTER TABLE posts ENABLE TRIGGER post_change;
ALTER TABLE posts ENABLE TRIGGER post_check;