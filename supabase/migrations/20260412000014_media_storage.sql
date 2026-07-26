-- Supabase Storage for custom uploads and AI fusion images.
-- Public read; anonymous writes scoped to custom/ and fusion/ prefixes.

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
