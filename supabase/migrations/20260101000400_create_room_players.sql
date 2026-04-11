-- ============================================================
-- ROOM PLAYERS
-- ============================================================
create table if not exists room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_name text not null,
  avatar text,
  joined_at timestamptz default now(),
  is_host boolean default false,
  unique(room_id, player_name)
);

create index if not exists room_players_room_id_idx on room_players(room_id);

alter table room_players enable row level security;

drop policy if exists "room_players_public_read" on room_players;
create policy "room_players_public_read"
  on room_players for select
  using (true);

drop policy if exists "room_players_public_insert" on room_players;
create policy "room_players_public_insert"
  on room_players for insert
  with check (true);

drop policy if exists "room_players_public_delete" on room_players;
create policy "room_players_public_delete"
  on room_players for delete
  using (true);
