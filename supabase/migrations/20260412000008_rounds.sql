-- ============================================================
-- ROUNDS (scored game results)
-- ============================================================
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  concept_left TEXT NOT NULL,
  concept_right TEXT NOT NULL,
  submission TEXT NOT NULL,
  score_wit INTEGER,
  score_logic INTEGER,
  score_originality INTEGER,
  score_clarity INTEGER,
  final_score NUMERIC(3,1),
  mode TEXT DEFAULT 'standard',
  difficulty TEXT DEFAULT 'normal',
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rounds" ON rounds FOR SELECT USING (true);
CREATE POLICY "Users can insert own rounds" ON rounds FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rounds_user ON rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_rounds_created ON rounds(created_at DESC);
