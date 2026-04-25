-- Migration: Fix security_logs RLS — allow NULL user_id for pre-auth login events
-- Date: 2026-04-24
-- Bug: login_success/login_failed calls from Login page (unauthenticated) have user_id=NULL
--      RLS policy rejected: user_id = auth.uid() fails when user_id is NULL

BEGIN;

-- Drop restrictive insert policy
DROP POLICY IF EXISTS security_logs_user_insert ON public.security_logs;

-- Create permissive insert policy: allows anyone to insert (including NULL user_id)
-- This is safe because:
-- 1. Service role key bypasses RLS entirely
-- 2. Login events from unauthenticated pages need to insert with user_id=NULL
-- 3. Read policy still restricts visibility to admin only
CREATE POLICY "security_logs_insert_anyone"
  ON public.security_logs
  FOR INSERT
  WITH CHECK (true);

COMMIT;
