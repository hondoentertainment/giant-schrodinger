-- ============================================================
-- SCORED JUDGEMENTS (per-round judge feedback)
-- ============================================================
CREATE TABLE IF NOT EXISTS scored_judgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id),
  judge_id UUID REFERENCES users(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  commentary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scored_judgements ENABLE ROW LEVEL SECURITY;
