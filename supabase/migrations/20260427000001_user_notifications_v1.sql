-- Migration: Create user_notifications infrastructure (Phase 7)
-- Issue: 018ecb1d-c7d2-4eac-9c55-4f921250cf06
-- Tables: user_notifications, user_notification_preferences
-- Depend: user_profiles exist via profiles table

-- ============================
-- 1. user_notification_preferences
-- ============================
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Channel toggles
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  -- Category toggles (opt-in/opt-out per type)
  notify_transaction boolean NOT NULL DEFAULT true,
  notify_facture boolean NOT NULL DEFAULT true,
  notify_client boolean NOT NULL DEFAULT true,
  notify_caisse boolean NOT NULL DEFAULT true,
  notify_system boolean NOT NULL DEFAULT true,
  notify_team boolean NOT NULL DEFAULT true,
  -- Quiet hours (HH:MM in 24h format, Europe/Berlin timezone)
  quiet_hours_start time DEFAULT NULL,
  quiet_hours_end time DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_pref UNIQUE (user_id)
);

-- Automatically create preferences row when a profile is created
CREATE OR REPLACE FUNCTION auto_create_notification_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_notification_preferences ON profiles;
CREATE TRIGGER trg_auto_create_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_notification_preferences();

-- ============================
-- 2. user_notifications
-- ============================
CREATE TYPE notification_category AS ENUM (
  'transaction',
  'facture',
  'client',
  'caisse',
  'system',
  'team'
);

CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category notification_category NOT NULL DEFAULT 'system',
  priority notification_priority NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  body text NOT NULL,
  -- Link to relevant entity
  link_url text,
  entity_type text,
  entity_id uuid,
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  -- Status
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  is_dismissed boolean NOT NULL DEFAULT false,
  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Indexes for fast queries
CREATE INDEX idx_notifications_user_unread
  ON user_notifications (user_id, is_read, created_at DESC)
  WHERE NOT is_dismissed;

CREATE INDEX idx_notifications_user_all
  ON user_notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_expiry
  ON user_notifications (expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================
-- 3. Notification send function (security definer)
-- ============================
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id uuid,
  p_category notification_category,
  p_priority notification_priority,
  p_title text,
  p_body text,
  p_link_url text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pref user_notification_preferences;
  v_notif_id uuid;
BEGIN
  -- Fetch user's notification preferences
  SELECT * INTO v_pref
  FROM user_notification_preferences
  WHERE user_id = p_user_id;

  -- If no preferences exist, create defaults
  IF NOT FOUND THEN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_pref
    FROM user_notification_preferences
    WHERE user_id = p_user_id;
  END IF;

  -- Check if user has opted into this category
  IF NOT (
    CASE p_category
      WHEN 'transaction' THEN v_pref.notify_transaction
      WHEN 'facture' THEN v_pref.notify_facture
      WHEN 'client' THEN v_pref.notify_client
      WHEN 'caisse' THEN v_pref.notify_caisse
      WHEN 'system' THEN v_pref.notify_system
      WHEN 'team' THEN v_pref.notify_team
      ELSE true
    END
  ) THEN
    RETURN NULL; -- User opted out, silently skip
  END IF;

  -- Insert the notification
  INSERT INTO user_notifications (
    user_id, category, priority, title, body,
    link_url, entity_type, entity_id,
    metadata, expires_at
  ) VALUES (
    p_user_id, p_category, p_priority, p_title, p_body,
    p_link_url, p_entity_type, p_entity_id,
    p_metadata, p_expires_at
  )
  RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$;

-- ============================
-- 4. RLS policies
-- ============================
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Notification preferences: users manage their own
CREATE POLICY "Users view own notification preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notification preferences"
  ON user_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System creates preferences on profile insert"
  ON user_notification_preferences
  FOR INSERT
  WITH CHECK (true); -- Trigger handles this, but allow for direct calls

-- Notifications: users see their own
CREATE POLICY "Users view own notifications"
  ON user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications (mark read/dismiss)"
  ON user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON user_notifications
  FOR INSERT
  WITH CHECK (true); -- Only SECURITY DEFINER functions should insert

-- Realtime: broadcast new notifications
ALTER TABLE user_notifications REPLICA IDENTITY FULL;

-- ============================
-- 5. Helper: mark notification read
-- ============================
CREATE OR REPLACE FUNCTION mark_notification_read(p_notif_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notif_id
    AND user_id = auth.uid();
END;
$$;

-- ============================
-- 6. Helper: mark all notifications read for current user
-- ============================
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE user_notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid()
    AND NOT is_read
    AND NOT is_dismissed;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================
-- 7. Helper: get unread count
-- ============================
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_notifications
  WHERE user_id = auth.uid()
    AND NOT is_read
    AND NOT is_dismissed
    AND (expires_at IS NULL OR expires_at > now());
  RETURN v_count;
END;
$$;

-- ============================
-- 8. Enable realtime for notifications
-- ============================
-- Note: run separate ALTER PUBLICATION if supabase_realtime exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
  END IF;
END
$$;
