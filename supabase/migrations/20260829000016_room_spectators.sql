alter table room_players
  add column if not exists is_spectator boolean default false;

create or replace function join_room_spectator(
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
  watching_player room_players%rowtype;
  player_token text := vwf_generate_token();
begin
  if nullif(trim(coalesce(p_player_name, '')), '') is null then
    raise exception 'Name is required';
  end if;

  select *
  into target_room
  from rooms
  where code = upper(trim(p_code))
  limit 1;

  if target_room.id is null then
    raise exception 'Room not found';
  end if;

  select *
  into watching_player
  from room_players
  where room_id = target_room.id
    and lower(player_name) = lower(trim(p_player_name))
  limit 1;

  if watching_player.id is not null then
    if watching_player.is_host or watching_player.is_spectator is not true then
      raise exception 'Name already taken in this room';
    end if;
  else
    insert into room_players (
      room_id,
      player_name,
      avatar,
      is_host,
      is_spectator,
      player_token_hash
    )
    values (
      target_room.id,
      trim(p_player_name),
      p_avatar,
      false,
      true,
      vwf_hash_token(player_token)
    )
    returning * into watching_player;
  end if;

  return jsonb_build_object(
    'room', to_jsonb(target_room) - 'host_token_hash',
    'session', jsonb_build_object(
      'hostToken', null,
      'playerToken', player_token,
      'playerName', watching_player.player_name,
      'playerId', watching_player.id,
      'isHost', false,
      'isSpectator', true,
      'role', 'spectator',
      'secureMode', true
    )
  );
end;
$$;

grant execute on function join_room_spectator(text, text, text) to anon, authenticated;
