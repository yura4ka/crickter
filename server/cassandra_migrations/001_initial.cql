-- CREATE KEYSPACE IF NOT EXISTS db WITH REPLICATION = { 
--   'class' : 'SimpleStrategy',
--   'replication_factor' : '1'
-- };

CREATE TABLE IF NOT EXISTS db.latest_posts (
  userid text PRIMARY KEY,
  item_count int,
  last_update_timestamp timestamp
);