-- Rate limiting y control diario de partidas invitadas.
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0 CHECK (hits >= 0),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_expiry ON api_rate_limits(expires_at);

CREATE TABLE IF NOT EXISTS anonymous_daily_plays (
  ip_hash TEXT NOT NULL,
  play_day TEXT NOT NULL,
  plays INTEGER NOT NULL DEFAULT 0 CHECK (plays BETWEEN 0 AND 5),
  PRIMARY KEY (ip_hash, play_day)
);
CREATE INDEX IF NOT EXISTS idx_anonymous_daily_plays_day ON anonymous_daily_plays(play_day);
CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores(score DESC, created_at ASC, id ASC);
