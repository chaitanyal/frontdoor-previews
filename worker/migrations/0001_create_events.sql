CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  practice_slug TEXT NOT NULL,
  event_type TEXT NOT NULL,

  page_path TEXT,
  destination_url TEXT,

  referrer TEXT,
  user_agent TEXT,
  country TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_practice_created
ON events(practice_slug, created_at);

CREATE INDEX IF NOT EXISTS idx_event_created
ON events(event_type, created_at);
