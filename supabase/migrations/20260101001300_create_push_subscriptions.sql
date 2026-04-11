-- push_subscriptions: Web Push endpoint storage for Wave 3 growth features.
--
-- Scope:
--   - One row per unique Web Push endpoint (browsers generate a new endpoint
--     per install, so this is effectively one row per logged-in browser).
--   - user_id is nullable so anonymous visitors can also receive reminders
--     once they opt in — the auth account can be linked later.
--
-- Consumed by:
--   - supabase/functions/save-push-subscription (upsert on endpoint)
--   - supabase/functions/send-push             (iterate to fan out)

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    subscription jsonb not null,
    endpoint text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_endpoint_idx
    on public.push_subscriptions (endpoint);

create index if not exists push_subscriptions_user_id_idx
    on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Users can read / modify only their own rows. The send-push Edge Function
-- bypasses RLS by using the service role key when fanning out pushes.
drop policy if exists "push_subs_owner_select" on public.push_subscriptions;
create policy "push_subs_owner_select"
    on public.push_subscriptions
    for select
    using (auth.uid() = user_id);

drop policy if exists "push_subs_owner_modify" on public.push_subscriptions;
create policy "push_subs_owner_modify"
    on public.push_subscriptions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Anonymous (user_id IS NULL) inserts are allowed so not-yet-logged-in users
-- can still receive reminders. They cannot read anyone else's rows back.
drop policy if exists "push_subs_anon_insert" on public.push_subscriptions;
create policy "push_subs_anon_insert"
    on public.push_subscriptions
    for insert
    with check (user_id is null or auth.uid() = user_id);
