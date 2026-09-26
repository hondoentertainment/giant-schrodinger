-- Phase 9: optional accounts and cloud progress.
--
-- Merge strategy (client): cloud wins per domain when both sides have data.
-- Empty cloud domains do not erase local progress. Stripe receipts in
-- stripe_entitlements are server-owned; clients cannot overwrite them.
--
-- auth.uid() is the users.id / player_progress.user_id key.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all users" ON users;
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS player_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar TEXT DEFAULT '🎯',
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ranked JSONB NOT NULL DEFAULT '{}'::jsonb,
  shop JSONB NOT NULL DEFAULT '{}'::jsonb,
  tournaments JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements JSONB NOT NULL DEFAULT '{}'::jsonb,
  daily JSONB NOT NULL DEFAULT '{}'::jsonb,
  stripe_entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own player progress" ON player_progress;
CREATE POLICY "Read own player progress" ON player_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Insert own player progress" ON player_progress;
CREATE POLICY "Insert own player progress" ON player_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update own player progress" ON player_progress;
CREATE POLICY "Update own player progress" ON player_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION protect_player_progress_stripe()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(current_setting('vwf.stripe_grant', true), '') = 'on' THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.stripe_entitlements := OLD.stripe_entitlements;
  ELSE
    NEW.stripe_entitlements := '{}'::jsonb;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS player_progress_protect_stripe ON player_progress;
CREATE TRIGGER player_progress_protect_stripe
  BEFORE INSERT OR UPDATE ON player_progress
  FOR EACH ROW
  EXECUTE FUNCTION protect_player_progress_stripe();

-- Service-role fulfillment only. Authenticated clients cannot execute this.
CREATE OR REPLACE FUNCTION grant_stripe_entitlement(
  p_user_id UUID,
  p_entitlements JSONB,
  p_shop JSONB,
  p_display_name TEXT DEFAULT 'Player',
  p_avatar TEXT DEFAULT '🎯'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('vwf.stripe_grant', 'on', true);

  INSERT INTO player_progress (user_id, display_name, avatar, shop, stripe_entitlements)
  VALUES (
    p_user_id,
    coalesce(nullif(trim(p_display_name), ''), 'Player'),
    coalesce(nullif(p_avatar, ''), '🎯'),
    coalesce(p_shop, '{}'::jsonb),
    coalesce(p_entitlements, '{}'::jsonb)
  )
  ON CONFLICT (user_id) DO UPDATE
    SET shop = excluded.shop,
        stripe_entitlements = excluded.stripe_entitlements,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION grant_stripe_entitlement(UUID, JSONB, JSONB, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_stripe_entitlement(UUID, JSONB, JSONB, TEXT, TEXT) TO service_role;
