-- Columna opcional para vincular puntuaciones a Clerk
ALTER TABLE scores ADD COLUMN clerk_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_scores_clerk ON scores (clerk_user_id);
