-- ============================================================
-- ROOM SUBMISSIONS
-- ============================================================
create table if not exists room_submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number integer not null,
  player_name text not null,
  submission text not null,
  score jsonb,
  submitted_at timestamptz default now(),
  unique(room_id, round_number, player_name)
);

create index if not exists room_submissions_room_id_idx on room_submissions(room_id);
create index if not exists room_submissions_round_idx on room_submissions(room_id, round_number);

alter table room_submissions enable row level security;

create policy "room_submissions_public_read"
  on room_submissions for select
  using (true);

create policy "room_submissions_public_insert"
  on room_submissions for insert
  with check (true);

create policy "room_submissions_public_update"
  on room_submissions for update
  using (true);
