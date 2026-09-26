-- Align an existing migration-based database with supabase/schema.sql.
--
-- schema.sql is the snapshot owners paste for a new project. This migration
-- is the incremental path: token columns, expired-round reads, room votes,
-- the rooms status value 'results', and removal of anon write policies.
-- Writes stay on SECURITY DEFINER RPCs. Safe to rerun.

alter table shared_rounds
  add column if not exists public_token text unique;

alter table shared_rounds
  add column if not exists expires_at timestamptz;

alter table shared_rounds
  add column if not exists judge_mode text default 'friend';

update shared_rounds
set
  public_token = coalesce(public_token, encode(extensions.gen_random_bytes(16), 'hex')),
  expires_at = coalesce(expires_at, now() + interval '7 days'),
  judge_mode = coalesce(judge_mode, 'friend')
where public_token is null or expires_at is null or judge_mode is null;

create unique index if not exists shared_rounds_public_token_idx on shared_rounds(public_token);

drop policy if exists "shared_rounds_public_read" on shared_rounds;
create policy "shared_rounds_public_read"
  on shared_rounds for select
  using (expires_at is null or expires_at > now());

drop policy if exists "shared_rounds_public_insert" on shared_rounds;
drop policy if exists "judgements_public_insert" on judgements;
drop policy if exists "rooms_public_insert" on rooms;
drop policy if exists "rooms_public_update" on rooms;
drop policy if exists "room_players_public_insert" on room_players;
drop policy if exists "room_players_public_delete" on room_players;
drop policy if exists "room_submissions_public_insert" on room_submissions;
drop policy if exists "room_submissions_public_update" on room_submissions;

alter table rooms
  add column if not exists host_token_hash text;

do $$
begin
  alter table rooms drop constraint if exists rooms_status_check;
  alter table rooms
    add constraint rooms_status_check
    check (status in ('waiting', 'playing', 'revealing', 'results', 'finished'));
end $$;

alter table room_players
  add column if not exists player_token_hash text;

create table if not exists room_votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number integer not null,
  voter_name text not null,
  submission_id uuid not null references room_submissions(id) on delete cascade,
  unique(room_id, round_number, voter_name)
);

create index if not exists room_votes_room_round_idx on room_votes(room_id, round_number);
create index if not exists room_votes_submission_idx on room_votes(submission_id);

alter table room_votes enable row level security;

drop policy if exists "room_votes_public_read" on room_votes;

create policy "room_votes_public_read"
  on room_votes for select
  using (true);

do $$
begin
  alter publication supabase_realtime add table room_votes;
exception
  when duplicate_object then null;
end $$;
