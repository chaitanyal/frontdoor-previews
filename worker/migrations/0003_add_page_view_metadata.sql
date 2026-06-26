ALTER TABLE events
ADD COLUMN title TEXT;

ALTER TABLE events
ADD COLUMN session_id TEXT;

ALTER TABLE events
ADD COLUMN visitor_id TEXT;

ALTER TABLE events
ADD COLUMN event_timestamp TEXT;

ALTER TABLE events
ADD COLUMN city TEXT;
