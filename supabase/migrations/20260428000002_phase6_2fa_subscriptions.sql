-- ============================================================================
-- PHASE 6 — PARTIE 2 : 2FA, Abonnements, TVA RPC
-- ============================================================================
BEGIN;

-- ============================================================================
-- 1. USER 2FA (TOTP — recovery codes hashés, secrets chiffrés)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  totp_secret TEXT,             -- Chiffré via pgp_sym_encrypt / application-level AAD
  totp_verified BOOLEAN DEFAULT false,
  recovery_codes_hash TEXT[],   -- Hachés (crypt) — chaque code stocké comme hash individuel
  recovery_salt TEXT,           -- Salt unique pour le hachage des codes
  is_enabled BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to encrypt TOTP secret on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_totp_secret()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.totp_secret IS NOT NULL AND NEW.totp_secret != '' THEN
    -- Encrypt with pgcrypto using a deterministic key derived from user_id
    -- The application will decrypt client-side; this prevents DB-level plaintext leaks
    NEW.totp_secret = encode(
      pgp_sym_encrypt(
        NEW.totp_secret,
        -- Use user_id as encryption key context
        '2fa-' || NEW.user_id::text,
        'compress-algo=0, cipher-algo=aes256'
      ),
      'base64'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS encrypt_totp_secret_trigger ON public.user_2fa;
CREATE TRIGGER encrypt_totp_secret_trigger
  BEFORE INSERT OR UPDATE OF totp_secret ON public.user_2fa
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_totp_secret();

-- Function to verify a recovery code (look up hashed match)
CREATE OR REPLACE FUNCTION public.verify_recovery_code(
  p_user_id UUID,
  p_code TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_hash TEXT;
  v_hash_array TEXT[];
  v_new_codes TEXT[] := '{}';
  v_found BOOLEAN := false;
  v_idx INT;
BEGIN
  SELECT recovery_codes_hash, recovery_salt
  INTO v_hash_array, v_idx
  FROM public.user_2fa
  WHERE user_id = p_user_id AND is_enabled = true;

  IF v_hash_array IS NULL THEN
    RETURN false;
  END IF;

  -- Check each hash
  FOR v_idx IN 1 .. array_length(v_hash_array, 1) LOOP
    IF v_hash_array[v_idx] = crypt(p_code, v_hash_array[v_idx]) THEN
      -- Mark as used: rotate the code to an unusable hash
      v_hash_array[v_idx] = crypt(gen_random_uuid()::text, gen_salt('bf'));
      v_found := true;
    END IF;
  END LOOP;

  IF v_found THEN
    UPDATE public.user_2fa
    SET recovery_codes_hash = v_hash_array
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate new hashed recovery codes
CREATE OR REPLACE FUNCTION public.generate_recovery_codes(
  p_user_id UUID,
  p_count INT DEFAULT 8
) RETURNS TEXT[] AS $$
DECLARE
  v_plain_codes TEXT[] := '{}';
  v_hashed_codes TEXT[] := '{}';
  v_salt TEXT;
  v_code TEXT;
  v_i INT;
BEGIN
  v_salt := gen_salt('bf');  -- bcrypt salt

  FOR v_i IN 1 .. p_count LOOP
    v_code := encode(gen_random_bytes(6), 'hex');  -- 12-char hex code
    v_plain_codes := array_append(v_plain_codes, v_code);
    v_hashed_codes := array_append(v_hashed_codes, crypt(v_code, v_salt));
  END LOOP;

  -- Store hashed codes and salt
  UPDATE public.user_2fa
  SET recovery_codes_hash = v_hashed_codes,
      recovery_salt = v_salt
  WHERE user_id = p_user_id;

  -- Return plain codes so the app can show them to the user ONCE
  RETURN v_plain_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_2fa_self ON public.user_2fa FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. PLANS (abonnements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  max_users INT NOT NULL DEFAULT 1,
  max_companies INT NOT NULL DEFAULT 1,
  max_invoices_monthly INT NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_read ON public.plans FOR SELECT
  USING (true);

CREATE POLICY plans_admin_all ON public.plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Seed plans (4 tiers)
INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, max_users, max_companies, max_invoices_monthly, features, sort_order) VALUES
  ('Gratuit', 'free', 'Pour démarrer avec FactureSmart', 0, 0, 1, 1, 10, '["1 utilisateur", "1 entreprise", "10 factures/mois", "Gestion clients", "Modèles de factures"]'::jsonb, 1),
  ('Startup', 'startup', 'Pour les petites entreprises en croissance', 19.99, 199.99, 3, 1, 100, '["3 utilisateurs", "1 entreprise", "100 factures/mois", "Gestion clients", "Déclarations TVA", "Export PDF/XLSX", "Support email"]'::jsonb, 2),
  ('Pro', 'pro', 'Pour les entreprises établies', 49.99, 499.99, 10, 3, 1000, '["10 utilisateurs", "Jusqu à 3 entreprises", "1 000 factures/mois", "Déclarations TVA", "Export PDF/XLSX/OHADA", "API access", "2FA", "Rôles personnalisés", "Support prioritaire"]'::jsonb, 3),
  ('Enterprise', 'enterprise', 'Solution complète pour grandes organisations', 99.99, 999.99, -1, -1, -1, '["Utilisateurs illimités", "Entreprises illimitées", "Factures illimitées", "Tout de Pro", "Stripe connect", "API dédiée", "SLA garanti", "Support dédié 24/7", "Onboarding personnalisé"]'::jsonb, 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select ON public.subscriptions FOR SELECT
  USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY subscriptions_admin_all ON public.subscriptions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY subscriptions_company_update ON public.subscriptions FOR UPDATE
  USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

-- Auto-create subscription on company insert
CREATE OR REPLACE FUNCTION public.auto_create_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  SELECT id INTO v_free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;
  IF v_free_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.subscriptions (company_id, plan_id, status, trial_ends_at, current_period_end)
  VALUES (
    NEW.id,
    v_free_plan_id,
    'trial',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (company_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_company_insert_subscription ON public.companies;
CREATE TRIGGER on_company_insert_subscription
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_subscription();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================================
-- 4. HELPERS — can_add_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.can_add_user(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_users INT;
  v_current_users INT;
BEGIN
  SELECT p.max_users INTO v_max_users
  FROM public.subscriptions s
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.company_id = p_company_id;

  IF v_max_users IS NULL OR v_max_users = -1 THEN
    RETURN true;
  END IF;

  SELECT COUNT(*) INTO v_current_users
  FROM public.profiles
  WHERE company_id = p_company_id AND is_active = true;

  RETURN v_current_users < v_max_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. RPC — calculer_declaration_tva() (version corrigée)
-- Reçoit company_id, mois, année → agrège par groupe A/B/C
-- Compatible avec la structure factures.montant_ht/montant_tva/montant_ttc
-- et type_facture_dgi (FV/EV/FT/NC/ND/AV/NEC)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculer_declaration_tva(
  p_company_id UUID,
  p_mois INT,
  p_annee INT
) RETURNS TABLE (
  total_htva DECIMAL,
  total_tva DECIMAL,
  total_ttc DECIMAL,
  total_documents INT,
  groupe_a_htva DECIMAL,
  groupe_a_tva DECIMAL,
  groupe_b_htva DECIMAL,
  groupe_b_tva DECIMAL,
  groupe_c_htva DECIMAL,
  groupe_c_tva DECIMAL,
  nb_factures_emises INT,
  nb_notes_credit INT,
  nb_notes_debit INT,
  nb_avoir INT,
  tva_deductible DECIMAL,
  tva_nette DECIMAL
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH invoice_data AS (
    SELECT
      f.id,
      COALESCE(f.type_facture_dgi, 'FV') AS dgi_type,
      COALESCE(f.montant_ht, 0) AS htva,
      COALESCE(f.montant_tva, 0) AS tva,
      COALESCE(f.montant_ttc, 0) AS ttc,
      COALESCE(f.groupe_tva, 'C') AS tvag,
      CASE
        WHEN f.groupe_tva = 'A' THEN 'A'
        WHEN f.groupe_tva = 'B' THEN 'B'
        ELSE 'C'
      END AS groupe_tva
    FROM public.factures f
    WHERE f.company_id = p_company_id
      AND EXTRACT(MONTH FROM f.date_emission) = p_mois
      AND EXTRACT(YEAR FROM f.date_emission) = p_annee
      AND f.statut != 'brouillon'
  )
  SELECT
    COALESCE(SUM(htva), 0),
    COALESCE(SUM(tva), 0),
    COALESCE(SUM(ttc), 0),
    COUNT(DISTINCT id)::INT,
    -- Groupe A
    COALESCE(SUM(CASE WHEN groupe_tva = 'A' THEN htva ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN groupe_tva = 'A' THEN tva ELSE 0 END), 0),
    -- Groupe B
    COALESCE(SUM(CASE WHEN groupe_tva = 'B' THEN htva ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN groupe_tva = 'B' THEN tva ELSE 0 END), 0),
    -- Groupe C
    COALESCE(SUM(CASE WHEN groupe_tva = 'C' THEN htva ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN groupe_tva = 'C' THEN tva ELSE 0 END), 0),
    -- Document counts by DGI type
    COUNT(DISTINCT CASE WHEN dgi_type IN ('FV', 'EV', 'FT') THEN id END)::INT,
    COUNT(DISTINCT CASE WHEN dgi_type = 'NC' THEN id END)::INT,
    COUNT(DISTINCT CASE WHEN dgi_type = 'ND' THEN id END)::INT,
    COUNT(DISTINCT CASE WHEN dgi_type IN ('AV', 'NEC') THEN id END)::INT,
    -- TVA deductible (TVA on NC + AV + NEC)
    COALESCE(SUM(CASE WHEN dgi_type IN ('NC', 'AV', 'NEC') THEN tva ELSE 0 END), 0),
    -- TVA nette = TVA collectée - TVA déductible
    COALESCE(SUM(tva), 0) - COALESCE(SUM(CASE WHEN dgi_type IN ('NC', 'AV', 'NEC') THEN tva ELSE 0 END), 0)
  FROM invoice_data;
END;
$$;

-- ============================================================================
-- 6. Also create a function that returns the fields expected by TVADeclarations frontend
-- (total_tva_a, total_tva_b, total_tva_c) as a compatibility layer
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculer_tva_summary(
  p_company_id UUID,
  p_mois INT,
  p_annee INT
) RETURNS TABLE (
  total_htva DECIMAL,
  total_tva_a DECIMAL,
  total_tva_b DECIMAL,
  total_tva_c DECIMAL,
  total_tva DECIMAL,
  total_ttc DECIMAL,
  nombre_fv INT,
  nombre_ev INT,
  nombre_ft INT,
  nombre_total INT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(f.montant_ht), 0),
    COALESCE(SUM(CASE WHEN f.groupe_tva = 'A' THEN f.montant_tva ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.groupe_tva = 'B' THEN f.montant_tva ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.groupe_tva = 'C' THEN f.montant_tva ELSE 0 END), 0),
    COALESCE(SUM(f.montant_tva), 0),
    COALESCE(SUM(f.montant_ttc), 0),
    COUNT(CASE WHEN f.type_facture_dgi = 'FV' THEN 1 END)::INT,
    COUNT(CASE WHEN f.type_facture_dgi = 'EV' THEN 1 END)::INT,
    COUNT(CASE WHEN f.type_facture_dgi = 'FT' THEN 1 END)::INT,
    COUNT(*)::INT
  FROM public.factures f
  WHERE f.company_id = p_company_id
    AND EXTRACT(MONTH FROM f.date_emission) = p_mois
    AND EXTRACT(YEAR FROM f.date_emission) = p_annee
    AND f.statut != 'brouillon';
END;
$$;

COMMIT;
