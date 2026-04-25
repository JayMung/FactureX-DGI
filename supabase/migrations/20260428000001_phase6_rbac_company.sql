-- ============================================================================
-- PHASE 6 — PARTIE 1 : RBAC, Audit, Profils enrichis & Company fiscales
-- ============================================================================
BEGIN;

-- ============================================================================
-- 1. Enable pgcrypto for encryption/hashing
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 2. CUSTOM ROLES (rôles personnalisés par entreprise)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_roles_read ON public.custom_roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY custom_roles_admin_all ON public.custom_roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Seed system roles
INSERT INTO public.custom_roles (name, description, is_system, permissions) VALUES
  ('admin', 'Accès complet à toutes les fonctionnalités', true, '{"all": true}'::jsonb),
  ('comptable', 'Gestion comptable, factures, déclarations', true, '{"factures": {"read": true, "create": true, "update": true}, "declarations": {"read": true, "create": true, "update": true}, "clients": {"read": true}, "rapports": {"read": true}}'::jsonb),
  ('commercial', 'Gestion clients et ventes', true, '{"clients": {"read": true, "create": true, "update": true}, "factures": {"read": true, "create": true}, "rapports": {"read": true}}'::jsonb)
ON CONFLICT (company_id, name) DO NOTHING;

-- Trigger
DROP TRIGGER IF EXISTS custom_roles_updated_at ON public.custom_roles;
CREATE TRIGGER custom_roles_updated_at BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX IF NOT EXISTS idx_custom_roles_company ON public.custom_roles(company_id);

-- ============================================================================
-- 3. PROFILES — Ajout colonnes organisation & RBAC
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.custom_roles(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. COMPANIES — Ajout colonnes fiscales
-- ============================================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS nif VARCHAR(100),
  ADD COLUMN IF NOT EXISTS regime_imposition VARCHAR(50) DEFAULT 'simplifié',
  ADD COLUMN IF NOT EXISTS adresse_fiscale TEXT,
  ADD COLUMN IF NOT EXISTS telephone_fiscal VARCHAR(50),
  ADD COLUMN IF NOT EXISTS email_fiscal VARCHAR(255),
  ADD COLUMN IF NOT EXISTS rc_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS idnat_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS devise_defaut VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Lubumbashi';

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_regime_imposition_check;
ALTER TABLE public.companies ADD CONSTRAINT companies_regime_imposition_check
  CHECK (regime_imposition IN ('réel', 'simplifié', 'forfait'));

-- ============================================================================
-- 5. CLIENTS — Ajout colonnes fiscales OHADA (client assujetti/non-assujetti)
-- ============================================================================
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS nif_client VARCHAR(100),
  ADD COLUMN IF NOT EXISTS assujetti_tva BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS regime_tva VARCHAR(20) DEFAULT 'normal'
    CHECK (regime_tva IN ('normal', 'simplifié', 'exonéré', 'partiel')),
  ADD COLUMN IF NOT EXISTS type_client VARCHAR(30)
    CHECK (type_client IN ('particulier', 'entreprise', 'administration', 'ong', 'autre')),
  ADD COLUMN IF NOT EXISTS email_proforma VARCHAR(255),
  ADD COLUMN IF NOT EXISTS rc_client VARCHAR(100),
  ADD COLUMN IF NOT EXISTS adresse_fiscale_client TEXT;

-- ============================================================================
-- 6. FACTURES — Ajout type_tva et colonnes DGI enrichies
-- ============================================================================
ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS type_tva VARCHAR(20) DEFAULT '18%'
    CHECK (type_tva IN ('18%', '16%', '8%', '0%', 'exonéré', 'non_assujetti')),
  ADD COLUMN IF NOT EXISTS type_facture_dgi VARCHAR(10) DEFAULT 'FV'
    CHECK (type_facture_dgi IN ('FV', 'EV', 'FT', 'NC', 'ND', 'AV', 'NEC')),
  ADD COLUMN IF NOT EXISTS client_assujetti BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reference_devis VARCHAR(50);

-- Add company_id to factures if not exists (referenced by calculer_declaration_tva)
ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- ============================================================================
-- 7. AUDIT LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_read ON public.audit_log FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
         OR user_id = auth.uid());

CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company ON public.audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- Helper function
CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id UUID,
  p_company_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_log (user_id, company_id, action, entity_type, entity_id, details, ip_address)
  VALUES (p_user_id, p_company_id, p_action, p_entity_type, p_entity_id, p_details, p_ip_address)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
