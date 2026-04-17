-- ============================================================
-- FEATURE FLAGS
-- Runtime configuration for A/B tests, kill switches, and gated
-- rollouts. Reads are public (the flags gate client UI; nothing
-- sensitive lives here). Writes happen via the Supabase dashboard
-- or the service-role key — no public INSERT/UPDATE/DELETE policy.
-- ============================================================
create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null unique,
  description text,
  enabled boolean not null default false,
  rollout_pct integer not null default 100 check (rollout_pct >= 0 and rollout_pct <= 100)
);

create index if not exists feature_flags_name_idx on feature_flags(name);

alter table feature_flags enable row level security;

-- Anyone can read feature flags (they gate UI; not sensitive)
create policy "feature_flags_public_read"
  on feature_flags for select
  using (true);

-- No public writes — flags are set via Supabase dashboard / service role
