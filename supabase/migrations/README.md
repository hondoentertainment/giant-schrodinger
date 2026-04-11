# Supabase Migrations

This directory is the canonical source of truth for the database schema.

## How it works

- Migration files are plain SQL and are applied in filename (lexicographic) order.
- Filenames follow the Supabase convention: `YYYYMMDDHHMMSS_<name>.sql`.
- Migrations should be idempotent where reasonable (`create ... if not exists`,
  `drop policy if exists ... ; create policy ...`) so re-runs are safe.

## Add a new migration

```sh
supabase migration new <short_snake_case_name>
```

This creates a new timestamped file. Edit it, commit it, then apply.

## Apply migrations

- Against a linked remote project:
  ```sh
  supabase db push
  ```
- For local development (resets and replays all migrations):
  ```sh
  supabase db reset
  ```

The legacy `supabase/schema.sql` is retained as a pointer only; do not edit it.
