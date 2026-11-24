-- Tabla de ranking GeoChallenge (Cloudflare D1)
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  username TEXT NOT NULL DEFAULT 'Anónimo',
  game_mode TEXT NOT NULL CHECK (game_mode IN ('precise', 'distance')),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  themes TEXT NOT NULL,
  score INTEGER NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created ON scores (created_at DESC);
