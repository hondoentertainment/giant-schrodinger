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
