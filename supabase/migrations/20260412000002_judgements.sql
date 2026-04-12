-- ============================================================
-- JUDGEMENTS
-- ============================================================
create table if not exists judgements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  round_id uuid not null references shared_rounds(id) on delete cascade,
  judge_name text,
  score integer not null check (score >= 1 and score <= 10),
  relevance text,
  commentary text
);

create index if not exists judgements_round_id_idx on judgements(round_id);

alter table judgements enable row level security;

-- Anyone can read judgements (players view feedback)
create policy "judgements_public_read"
  on judgements for select
  using (true);

-- Anyone can insert a judgement (friends judge shared rounds)
create policy "judgements_public_insert"
  on judgements for insert
  with check (true);
