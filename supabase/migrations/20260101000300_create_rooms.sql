-- ============================================================
-- MULTIPLAYER ROOMS
-- ============================================================
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz default now(),
  host_name text not null,
  theme_id text default 'neon',
  status text default 'waiting' check (status in ('waiting', 'playing', 'revealing', 'finished')),
  round_number integer default 1,
  total_rounds integer default 3,
  assets jsonb,
  scoring_mode text default 'ai'
);

create index if not exists rooms_code_idx on rooms(code);

alter table rooms enable row level security;

drop policy if exists "rooms_public_read" on rooms;
create policy "rooms_public_read"
  on rooms for select
  using (true);

drop policy if exists "rooms_public_insert" on rooms;
create policy "rooms_public_insert"
  on rooms for insert
  with check (true);

drop policy if exists "rooms_public_update" on rooms;
create policy "rooms_public_update"
  on rooms for update
  using (true);
