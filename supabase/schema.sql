-- CONSOLIDATED SCHEMA REFERENCE
-- For fresh installs and rollbacks, run the ordered files in supabase/migrations/
-- This file is the end-state snapshot — do not edit directly; regenerate from migrations.

-- Run this in Supabase SQL editor to create tables for Venn with Friends backend.
-- This schema includes Row Level Security (RLS) policies for production use.

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

create policy "rooms_public_read"
  on rooms for select
  using (true);

create policy "rooms_public_insert"
  on rooms for insert
  with check (true);

create policy "rooms_public_update"
  on rooms for update
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
  unique(room_id, player_name)
);

create index if not exists room_players_room_id_idx on room_players(room_id);

alter table room_players enable row level security;

create policy "room_players_public_read"
  on room_players for select
  using (true);

create policy "room_players_public_insert"
  on room_players for insert
  with check (true);

create policy "room_players_public_delete"
  on room_players for delete
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

create policy "room_submissions_public_read"
  on room_submissions for select
  using (true);

create policy "room_submissions_public_insert"
  on room_submissions for insert
  with check (true);

create policy "room_submissions_public_update"
  on room_submissions for update
  using (true);

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

-- ============================================================
-- USERS (auth-linked profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

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

-- ============================================================
-- SCORED JUDGEMENTS (per-round judge feedback)
-- ============================================================
CREATE TABLE IF NOT EXISTS scored_judgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  commentary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scored_judgements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- LEADERBOARD
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  total_score NUMERIC DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  avg_score NUMERIC(3,1) DEFAULT 0,
  best_score NUMERIC(3,1) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard" ON leaderboard FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(avg_score DESC);

-- ============================================================
-- CHALLENGES
-- ============================================================
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenged_id UUID REFERENCES users(id) ON DELETE CASCADE,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status) WHERE status = 'pending';

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event, created_at DESC);
