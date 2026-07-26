-- Content moderation reports (production-safe writes via RPC)

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
