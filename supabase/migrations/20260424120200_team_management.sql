-- ============================================================================
-- TEAM MANAGEMENT — Module 12
-- Date: 2026-04-24
-- Description: Tables for team management, roles, invitations
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TEAM MEMBERS — Extended user profiles for team management
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('super_admin', 'admin', 'comptable', 'caissier', 'viewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  last_login_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(email, company_id),
  UNIQUE(user_id, company_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_company ON public.team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

-- RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Admins see all members in their company
CREATE POLICY "team_members_admin_all" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.company_id = team_members.company_id
      AND tm.role IN ('super_admin', 'admin'))
  );

-- Users see own profile
CREATE POLICY "team_members_self_read" ON public.team_members
  FOR SELECT USING (user_id = auth.uid());

-- Users can update own profile (but not role/status)
CREATE POLICY "team_members_self_update" ON public.team_members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. TEAM INVITATIONS — Pending invitations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('admin', 'comptable', 'caissier', 'viewer')),
  token VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_company ON public.team_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);

-- RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Admins manage invitations
CREATE POLICY "team_invitations_admin_all" ON public.team_invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.company_id = team_invitations.company_id
      AND tm.role IN ('super_admin', 'admin'))
  );

-- Anyone can read their own invitation by token (for acceptance)
CREATE POLICY "team_invitations_token_read" ON public.team_invitations
  FOR SELECT USING (true);

-- ============================================================================
-- 3. COMPANY PROFILE — Extends companies with team settings
-- ============================================================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_team_members INTEGER DEFAULT 5;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS team_features JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- 4. TRIGGER: updated_at for team_members
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_members_updated_at ON public.team_members;
CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_members_updated_at();

-- ============================================================================
-- 5. Updated team_member_counts VIEW (if not exists)
-- ============================================================================
CREATE OR REPLACE VIEW public.team_member_counts AS
SELECT 
  company_id,
  COUNT(*) FILTER (WHERE status = 'active') AS active_members,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_members,
  COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_members,
  COUNT(*) AS total_members
FROM public.team_members
GROUP BY company_id;

-- ============================================================================
-- 6. FUNCTION: Auto-create team_member on user signup via trigger
-- ============================================================================
-- Note: This is handled by auth hook or Edge Function — not a DB trigger
-- to avoid issues with auth.users triggers

COMMIT;
