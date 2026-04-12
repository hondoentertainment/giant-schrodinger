-- ============================================================
-- SHARED ROUNDS
-- ============================================================
create table if not exists shared_rounds (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  assets jsonb not null,
  submission text not null,
  image_url text,
  share_from text,
  collision_id text
);

create index if not exists shared_rounds_collision_id_idx on shared_rounds(collision_id);

alter table shared_rounds enable row level security;

-- Anyone can read shared rounds (needed for judge links)
create policy "shared_rounds_public_read"
  on shared_rounds for select
  using (true);

-- Anyone can insert a shared round (players share their rounds)
create policy "shared_rounds_public_insert"
  on shared_rounds for insert
  with check (true);
