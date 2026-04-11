-- ============================================================
-- LEADERBOARD
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id UUID REFERENCES users(id) PRIMARY KEY,
  total_score NUMERIC DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  avg_score NUMERIC(3,1) DEFAULT 0,
  best_score NUMERIC(3,1) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read leaderboard" ON leaderboard;
CREATE POLICY "Anyone can read leaderboard" ON leaderboard FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(avg_score DESC);
