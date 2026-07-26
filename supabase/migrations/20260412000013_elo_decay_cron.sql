-- ============================================================
-- ELO DECAY CRON JOB
-- Decays inactive ranked players by DECAY_AMOUNT (15) every day.
-- Mirrors src/services/ranked.js behavior so server and client agree.
-- Requires pg_cron extension to be enabled in the Supabase project.
-- ============================================================

-- Enable pg_cron extension (idempotent). In Supabase, extensions live in the
-- dedicated `extensions` schema.
create extension if not exists pg_cron with schema extensions;

-- Track ELO state on the leaderboard table. The existing leaderboard schema
-- captures score stats (avg_score, best_score, etc.); ranked play additionally
-- needs a per-player ELO `rating` and a `last_ranked_at` timestamp so the
-- decay job can find inactive players.
alter table leaderboard add column if not exists rating integer default 1000;
alter table leaderboard add column if not exists last_ranked_at timestamptz default now();

-- Decay function: subtracts DECAY_AMOUNT (15) from any player inactive for
-- more than DECAY_DAYS (3) days. Floors at 0 to match the client-side logic
-- in src/services/ranked.js (Math.max(0, rating - totalDecay)).
create or replace function decay_inactive_ratings()
returns void
language plpgsql
as $$
begin
  update leaderboard
  set rating = greatest(0, rating - 15)
  where last_ranked_at < now() - interval '3 days'
    and rating > 0;
end;
$$;

-- Schedule the job to run daily at 03:00 UTC. Idempotent: unschedule any
-- existing job with the same name first so re-running the migration is safe.
do $$
begin
  perform cron.unschedule('decay-inactive-ratings');
exception when others then
  -- ignore if the job does not exist yet
  null;
end $$;

select cron.schedule(
  'decay-inactive-ratings',
  '0 3 * * *',
  $cron$ select decay_inactive_ratings() $cron$
);
