CREATE TYPE IF NOT EXISTS db.media (
  id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  url TEXT,
  is_deleted BOOLEAN,
  type TEXT
);

CREATE TABLE IF NOT EXISTS db.post_counters (
  id UUID PRIMARY KEY,
  likes_count COUNTER,
  dislikes_count COUNTER,
  comments_count COUNTER,
  reposts_count COUNTER
);

CREATE TABLE IF NOT EXISTS db.users_by_id (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  email TEXT,
  password TEXT,
  name TEXT,
  username TEXT,
  avatar FROZEN<media>,
  bio TEXT
);

CREATE TABLE IF NOT EXISTS db.posts_by_id (
  id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id UUID,
  username TEXT,
  name TEXT,
  user_picture FROZEN<media>,
  text TEXT,
  original_id UUID,
  reactions MAP<UUID, BOOLEAN>,
  favorite MAP<UUID, BOOLEAN>,
  media LIST<FROZEN<media>>,
  PRIMARY KEY(id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);

CREATE TABLE IF NOT EXISTS db.posts_by_user (
  user_id UUID,
  id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  text TEXT,
  original_id UUID,
  reactions MAP<UUID, BOOLEAN>,
  favorite MAP<UUID, BOOLEAN>,
  media LIST<FROZEN<media>>,
  PRIMARY KEY (user_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);

CREATE TABLE IF NOT EXISTS db.comments_by_post (
  id UUID,
  post_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id UUID,
  username TEXT,
  name TEXT,
  user_picture FROZEN<media>,
  text TEXT,
  reactions MAP<UUID, BOOLEAN>,
  media LIST<FROZEN<media>>,
  PRIMARY KEY (post_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);

CREATE TABLE IF NOT EXISTS db.responses_by_comment (
  id UUID,
  comment_id UUID,
  post_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id UUID,
  username TEXT,
  name TEXT,
  user_picture FROZEN<media>,
  text TEXT,
  original_id UUID,
  reactions MAP<UUID, BOOLEAN>,
  media LIST<FROZEN<media>>,
  PRIMARY KEY (comment_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);