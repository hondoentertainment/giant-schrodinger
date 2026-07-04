create extension if not exists pgcrypto;

-- Run this in Supabase SQL editor to create or upgrade the backend schema for
-- Venn with Friends. The schema keeps reads simple for realtime clients, while
-- routing writes through SECURITY DEFINER RPC functions for production safety.

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
  collision_id text,
  public_token text unique,
  expires_at timestamptz,
  judge_mode text default 'friend'
);

alter table shared_rounds
  add column if not exists public_token text,
  add column if not exists expires_at timestamptz,
  add column if not exists judge_mode text default 'friend';

update shared_rounds
set
  public_token = coalesce(public_token, encode(gen_random_bytes(16), 'hex')),
  expires_at = coalesce(expires_at, now() + interval '7 days'),
  judge_mode = coalesce(judge_mode, 'friend')
where public_token is null or expires_at is null or judge_mode is null;

create index if not exists shared_rounds_collision_id_idx on shared_rounds(collision_id);
create unique index if not exists shared_rounds_public_token_idx on shared_rounds(public_token);

alter table shared_rounds enable row level security;

drop policy if exists "shared_rounds_public_read" on shared_rounds;
drop policy if exists "shared_rounds_public_insert" on shared_rounds;

create policy "shared_rounds_public_read"
  on shared_rounds for select
  using (expires_at is null or expires_at > now());

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

drop policy if exists "judgements_public_read" on judgements;
drop policy if exists "judgements_public_insert" on judgements;

create policy "judgements_public_read"
  on judgements for select
  using (true);

-- ============================================================
-- MULTIPLAYER ROOMS
-- ============================================================
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz default now(),
  host_name text not null,
  theme_id text default 'neon',
  status text default 'waiting',
  round_number integer default 1,
  total_rounds integer default 3,
  assets jsonb,
  scoring_mode text default 'ai',
  host_token_hash text
);

alter table rooms
  add column if not exists host_token_hash text;

alter table rooms drop constraint if exists rooms_status_check;
alter table rooms
  add constraint rooms_status_check
  check (status in ('waiting', 'playing', 'revealing', 'results', 'finished'));

create index if not exists rooms_code_idx on rooms(code);

alter table rooms enable row level security;

drop policy if exists "rooms_public_read" on rooms;
drop policy if exists "rooms_public_insert" on rooms;
drop policy if exists "rooms_public_update" on rooms;

create policy "rooms_public_read"
  on rooms for select
  using (true);

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
  player_token_hash text,
  unique(room_id, player_name)
);

alter table room_players
  add column if not exists player_token_hash text;

create index if not exists room_players_room_id_idx on room_players(room_id);

alter table room_players enable row level security;

drop policy if exists "room_players_public_read" on room_players;
drop policy if exists "room_players_public_insert" on room_players;
drop policy if exists "room_players_public_delete" on room_players;

create policy "room_players_public_read"
  on room_players for select
  using (true);

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

drop policy if exists "room_submissions_public_read" on room_submissions;
drop policy if exists "room_submissions_public_insert" on room_submissions;
drop policy if exists "room_submissions_public_update" on room_submissions;

create policy "room_submissions_public_read"
  on room_submissions for select
  using (true);

-- ============================================================
-- ROOM VOTES
-- ============================================================
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

-- ============================================================
-- TOKEN HELPERS
-- ============================================================
create or replace function vwf_hash_token(token text)
returns text
language sql
immutable
strict
as $$
  select encode(digest(token, 'sha256'), 'hex');
$$;

create or replace function vwf_generate_token(length_bytes integer default 16)
returns text
language sql
volatile
as $$
  select encode(gen_random_bytes(greatest(length_bytes, 16)), 'hex');
$$;

create or replace function vwf_generate_room_code()
returns text
language plpgsql
volatile
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  generated text := '';
begin
  for i in 1..6 loop
    generated := generated || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return generated;
end;
$$;

-- ============================================================
-- SHARE / JUDGING RPCS
-- ============================================================
create or replace function create_shared_round(
  p_assets jsonb,
  p_submission text,
  p_image_url text default null,
  p_share_from text default null,
  p_collision_id text default null,
  p_judge_mode text default 'friend',
  p_expires_in_hours integer default 168
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_round shared_rounds%rowtype;
begin
  insert into shared_rounds (
    assets,
    submission,
    image_url,
    share_from,
    collision_id,
    public_token,
    expires_at,
    judge_mode
  )
  values (
    p_assets,
    p_submission,
    p_image_url,
    p_share_from,
    p_collision_id,
    vwf_generate_token(),
    now() + make_interval(hours => greatest(coalesce(p_expires_in_hours, 168), 1)),
    coalesce(nullif(p_judge_mode, ''), 'friend')
  )
  returning * into new_round;

  return jsonb_build_object(
    'id', new_round.id,
    'publicToken', new_round.public_token,
    'expiresAt', new_round.expires_at
  );
end;
$$;

create or replace function get_shared_round_by_token(p_public_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_round shared_rounds%rowtype;
begin
  select *
  into requested_round
  from shared_rounds
  where public_token = trim(p_public_token)
    and (expires_at is null or expires_at > now())
  limit 1;

  if requested_round.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', requested_round.id,
    'backendId', requested_round.public_token,
    'roundId', requested_round.id,
    'assets', requested_round.assets,
    'submission', requested_round.submission,
    'imageUrl', requested_round.image_url,
    'shareFrom', requested_round.share_from,
    'collisionId', requested_round.collision_id,
    'judgeMode', requested_round.judge_mode,
    'expiresAt', requested_round.expires_at
  );
end;
$$;

create or replace function submit_round_judgement(
  p_public_token text,
  p_judge_name text,
  p_score integer,
  p_relevance text,
  p_commentary text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_round shared_rounds%rowtype;
begin
  select *
  into requested_round
  from shared_rounds
  where public_token = trim(p_public_token)
    and (expires_at is null or expires_at > now())
  limit 1;

  if requested_round.id is null then
    raise exception 'Round not found or has expired';
  end if;

  insert into judgements (round_id, judge_name, score, relevance, commentary)
  values (
    requested_round.id,
    nullif(trim(coalesce(p_judge_name, '')), ''),
    p_score,
    p_relevance,
    p_commentary
  );

  return true;
end;
$$;

-- ============================================================
-- MULTIPLAYER RPCS
-- ============================================================
create or replace function create_room_session(
  p_host_name text,
  p_theme_id text default 'neon',
  p_total_rounds integer default 3,
  p_scoring_mode text default 'ai',
  p_avatar text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_room rooms%rowtype;
  host_player room_players%rowtype;
  room_code text;
  host_token text := vwf_generate_token();
  player_token text := vwf_generate_token();
  attempt integer := 0;
begin
  if nullif(trim(coalesce(p_host_name, '')), '') is null then
    raise exception 'Host name is required';
  end if;

  loop
    attempt := attempt + 1;
    room_code := vwf_generate_room_code();
    begin
      insert into rooms (
        code,
        host_name,
        theme_id,
        total_rounds,
        scoring_mode,
        status,
        round_number,
        host_token_hash
      )
      values (
        room_code,
        trim(p_host_name),
        coalesce(nullif(p_theme_id, ''), 'neon'),
        greatest(coalesce(p_total_rounds, 3), 1),
        coalesce(nullif(p_scoring_mode, ''), 'ai'),
        'waiting',
        1,
        vwf_hash_token(host_token)
      )
      returning * into new_room;
      exit;
    exception
      when unique_violation then
        if attempt >= 5 then
          raise;
        end if;
    end;
  end loop;

  insert into room_players (
    room_id,
    player_name,
    avatar,
    is_host,
    player_token_hash
  )
  values (
    new_room.id,
    trim(p_host_name),
    p_avatar,
    true,
    vwf_hash_token(player_token)
  )
  returning * into host_player;

  return jsonb_build_object(
    'room', to_jsonb(new_room) - 'host_token_hash',
    'session', jsonb_build_object(
      'hostToken', host_token,
      'playerToken', player_token,
      'playerName', host_player.player_name,
      'playerId', host_player.id,
      'isHost', true,
      'secureMode', true
    )
  );
end;
$$;

create or replace function join_room_session(
  p_code text,
  p_player_name text,
  p_avatar text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room rooms%rowtype;
  joined_player room_players%rowtype;
  player_token text := vwf_generate_token();
begin
  select *
  into target_room
  from rooms
  where code = upper(trim(p_code))
  limit 1;

  if target_room.id is null then
    raise exception 'Room not found';
  end if;

  if target_room.status not in ('waiting', 'revealing', 'results') then
    raise exception 'Game already in progress';
  end if;

  if exists (
    select 1
    from room_players
    where room_id = target_room.id
      and lower(player_name) = lower(trim(p_player_name))
  ) then
    raise exception 'Name already taken in this room';
  end if;

  insert into room_players (
    room_id,
    player_name,
    avatar,
    is_host,
    player_token_hash
  )
  values (
    target_room.id,
    trim(p_player_name),
    p_avatar,
    false,
    vwf_hash_token(player_token)
  )
  returning * into joined_player;

  return jsonb_build_object(
    'room', to_jsonb(target_room) - 'host_token_hash',
    'session', jsonb_build_object(
      'hostToken', null,
      'playerToken', player_token,
      'playerName', joined_player.player_name,
      'playerId', joined_player.id,
      'isHost', false,
      'secureMode', true
    )
  );
end;
$$;

create or replace function leave_room_session(
  p_room_id uuid,
  p_player_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  departing_player room_players%rowtype;
begin
  select *
  into departing_player
  from room_players
  where room_id = p_room_id
    and player_token_hash = vwf_hash_token(p_player_token)
  limit 1;

  if departing_player.id is null then
    return false;
  end if;

  delete from room_players where id = departing_player.id;

  if departing_player.is_host then
    update rooms
    set status = 'finished'
    where id = p_room_id;
  end if;

  return true;
end;
$$;

create or replace function start_room_round(
  p_room_id uuid,
  p_host_token text,
  p_round_number integer,
  p_assets jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update rooms
  set
    status = 'playing',
    round_number = greatest(coalesce(p_round_number, 1), 1),
    assets = p_assets
  where id = p_room_id
    and host_token_hash = vwf_hash_token(p_host_token);

  return found;
end;
$$;

create or replace function set_room_status_secure(
  p_room_id uuid,
  p_host_token text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update rooms
  set status = p_status
  where id = p_room_id
    and host_token_hash = vwf_hash_token(p_host_token);

  return found;
end;
$$;

create or replace function submit_room_answer(
  p_room_id uuid,
  p_round_number integer,
  p_player_token text,
  p_submission text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  submitting_player room_players%rowtype;
begin
  select *
  into submitting_player
  from room_players
  where room_id = p_room_id
    and player_token_hash = vwf_hash_token(p_player_token)
  limit 1;

  if submitting_player.id is null then
    raise exception 'Player session not found';
  end if;

  insert into room_submissions (
    room_id,
    round_number,
    player_name,
    submission
  )
  values (
    p_room_id,
    greatest(coalesce(p_round_number, 1), 1),
    submitting_player.player_name,
    coalesce(p_submission, '')
  )
  on conflict (room_id, round_number, player_name)
  do update set
    submission = excluded.submission,
    submitted_at = now();

  return true;
end;
$$;

create or replace function score_room_submission(
  p_submission_id uuid,
  p_host_token text,
  p_score jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update room_submissions as submissions
  set score = p_score
  from rooms
  where submissions.id = p_submission_id
    and rooms.id = submissions.room_id
    and rooms.host_token_hash = vwf_hash_token(p_host_token);

  return found;
end;
$$;

create or replace function cast_room_vote(
  p_room_id uuid,
  p_round_number integer,
  p_player_token text,
  p_submission_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  voting_player room_players%rowtype;
  target_submission room_submissions%rowtype;
  inserted_vote_id uuid;
begin
  select *
  into voting_player
  from room_players
  where room_id = p_room_id
    and player_token_hash = vwf_hash_token(p_player_token)
  limit 1;

  if voting_player.id is null then
    raise exception 'Player session not found';
  end if;

  select *
  into target_submission
  from room_submissions
  where id = p_submission_id
    and room_id = p_room_id
    and round_number = p_round_number
  limit 1;

  if target_submission.id is null then
    raise exception 'Submission not found';
  end if;

  if target_submission.player_name = voting_player.player_name then
    raise exception 'You cannot vote for your own submission';
  end if;

  insert into room_votes (
    room_id,
    round_number,
    voter_name,
    submission_id
  )
  values (
    p_room_id,
    p_round_number,
    voting_player.player_name,
    p_submission_id
  )
  on conflict (room_id, round_number, voter_name) do nothing
  returning id into inserted_vote_id;

  if inserted_vote_id is null then
    raise exception 'Vote already recorded for this round';
  end if;

  return jsonb_build_object(
    'ok', true,
    'submissionId', p_submission_id
  );
end;
$$;

create or replace function finalize_room_votes(
  p_room_id uuid,
  p_round_number integer,
  p_host_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from rooms
    where id = p_room_id
      and host_token_hash = vwf_hash_token(p_host_token)
  ) then
    raise exception 'Invalid host session';
  end if;

  with vote_counts as (
    select
      submissions.id as submission_id,
      count(votes.id)::int as vote_count,
      max(count(votes.id)::int) over () as max_votes
    from room_submissions as submissions
    left join room_votes as votes
      on votes.submission_id = submissions.id
    where submissions.room_id = p_room_id
      and submissions.round_number = p_round_number
    group by submissions.id
  )
  update room_submissions as submissions
  set score = jsonb_build_object(
    'score', vote_counts.vote_count,
    'finalScore', vote_counts.vote_count,
    'voteCount', vote_counts.vote_count,
    'relevance', case
      when vote_counts.max_votes > 0 and vote_counts.vote_count = vote_counts.max_votes then 'Crowd Favorite'
      else 'Room Vote'
    end,
    'commentary', concat(vote_counts.vote_count, ' room vote', case when vote_counts.vote_count = 1 then '' else 's' end, '.')
  )
  from vote_counts
  where submissions.id = vote_counts.submission_id;

  update rooms
  set status = 'results'
  where id = p_room_id
    and host_token_hash = vwf_hash_token(p_host_token);

  return jsonb_build_object(
    'ok', true,
    'status', 'results'
  );
end;
$$;

create or replace function advance_room_state(
  p_room_id uuid,
  p_host_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room rooms%rowtype;
begin
  select *
  into target_room
  from rooms
  where id = p_room_id
    and host_token_hash = vwf_hash_token(p_host_token)
  limit 1;

  if target_room.id is null then
    raise exception 'Invalid host session';
  end if;

  if target_room.round_number >= target_room.total_rounds then
    update rooms
    set status = 'finished'
    where id = target_room.id;

    return jsonb_build_object(
      'ok', true,
      'status', 'finished',
      'roundNumber', target_room.round_number
    );
  end if;

  update rooms
  set
    status = 'waiting',
    round_number = target_room.round_number + 1,
    assets = null
  where id = target_room.id;

  return jsonb_build_object(
    'ok', true,
    'status', 'waiting',
    'roundNumber', target_room.round_number + 1
  );
end;
$$;

grant execute on function create_shared_round(jsonb, text, text, text, text, text, integer) to anon, authenticated;
grant execute on function get_shared_round_by_token(text) to anon, authenticated;
grant execute on function submit_round_judgement(text, text, integer, text, text) to anon, authenticated;
grant execute on function create_room_session(text, text, integer, text, text) to anon, authenticated;
grant execute on function join_room_session(text, text, text) to anon, authenticated;
grant execute on function leave_room_session(uuid, text) to anon, authenticated;
grant execute on function start_room_round(uuid, text, integer, jsonb) to anon, authenticated;
grant execute on function set_room_status_secure(uuid, text, text) to anon, authenticated;
grant execute on function submit_room_answer(uuid, integer, text, text) to anon, authenticated;
grant execute on function score_room_submission(uuid, text, jsonb) to anon, authenticated;
grant execute on function cast_room_vote(uuid, integer, text, uuid) to anon, authenticated;
grant execute on function finalize_room_votes(uuid, integer, text) to anon, authenticated;
grant execute on function advance_room_state(uuid, text) to anon, authenticated;

-- ============================================================
-- Enable Realtime on multiplayer tables
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table rooms;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table room_players;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table room_submissions;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table room_votes;
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- MEDIA STORAGE (custom uploads + fusion images)
-- See supabase/migrations/20260412000014_media_storage.sql
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  6291456,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_public_read" on storage.objects;
drop policy if exists "media_public_insert" on storage.objects;
drop policy if exists "media_public_delete" on storage.objects;

create policy "media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'media');

create policy "media_public_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] in ('custom', 'fusion')
  );

create policy "media_public_delete"
  on storage.objects for delete
  to anon, authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] in ('custom', 'fusion')
  );

-- ============================================================
-- CONTENT REPORTS (moderation)
-- See supabase/migrations/20260704000015_content_reports.sql
-- ============================================================
create table if not exists content_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  content_id text not null,
  content_type text not null default 'collision',
  reason text not null,
  reporter_id text,
  metadata jsonb default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'dismissed'))
);

create index if not exists content_reports_content_id_idx on content_reports(content_id);
create index if not exists content_reports_status_idx on content_reports(status);
create index if not exists content_reports_created_at_idx on content_reports(created_at desc);

alter table content_reports enable row level security;

create or replace function report_content(
  p_content_id text,
  p_reason text,
  p_content_type text default 'collision',
  p_reporter_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_report content_reports%rowtype;
begin
  if coalesce(trim(p_content_id), '') = '' then
    raise exception 'content_id is required';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'reason is required';
  end if;

  insert into content_reports (
    content_id,
    content_type,
    reason,
    reporter_id,
    metadata
  )
  values (
    left(trim(p_content_id), 120),
    left(coalesce(nullif(trim(p_content_type), ''), 'collision'), 40),
    left(trim(p_reason), 240),
    nullif(left(trim(coalesce(p_reporter_id, '')), 120), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into new_report;

  return jsonb_build_object(
    'id', new_report.id,
    'contentId', new_report.content_id,
    'status', new_report.status,
    'createdAt', new_report.created_at
  );
end;
$$;

create or replace function list_content_reports(
  p_limit integer default 50
)
returns setof content_reports
language sql
security definer
set search_path = public
as $$
  select *
  from content_reports
  where status = 'pending'
  order by created_at desc
  limit greatest(least(coalesce(p_limit, 50), 200), 1);
$$;

create or replace function update_content_report_status(
  p_report_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated content_reports%rowtype;
begin
  if p_status not in ('pending', 'reviewed', 'dismissed') then
    raise exception 'invalid status';
  end if;

  update content_reports
  set status = p_status
  where id = p_report_id
  returning * into updated;

  if not found then
    raise exception 'report not found';
  end if;

  return jsonb_build_object('id', updated.id, 'status', updated.status);
end;
$$;
