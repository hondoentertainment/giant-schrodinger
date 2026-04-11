-- ============================================================
-- Initial schema setup
-- ============================================================
-- Supabase projects ship with pgcrypto enabled by default, which provides
-- gen_random_uuid(). This migration is a no-op placeholder for any future
-- extension setup and keeps the migration ordering stable.

-- Ensure pgcrypto is available for gen_random_uuid() on self-hosted / local dev.
create extension if not exists pgcrypto;
