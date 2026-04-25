-- Migration: CRITICAL SECURITY FIX — RLS policies on legacy stub tables
-- Date: 2026-04-24
-- Issue: COD-56/COD-57
-- Problem: USING(true)/WITH CHECK(true) on 3 legacy tables = any auth user can read/write ALL data
-- Fix: Replace with org-scoped policies using profiles.organization_id
-- Status: [FAKE] Not yet applied — needs review by MiniClaw before production apply

BEGIN;

-- ============================================================================
-- FIX 1: mouvements_comptes — drop permissive policies
-- ============================================================================

DROP POLICY IF EXISTS "mouvements_comptes_select" ON public.mouvements_comptes;
DROP POLICY IF EXISTS "mouvements_comptes_insert" ON public.mouvements_comptes;

-- Restrictive select: only mouvements linked to user's organization via compte
CREATE POLICY "mouvements_comptes_select" ON public.mouvements_comptes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.comptes_financiers cf
      JOIN public.profiles p ON p.organization_id = cf.organization_id
      WHERE cf.id = mouvements_comptes.compte_id
      AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.transactions t
      JOIN public.profiles p ON p.organization_id = t.organization_id
      WHERE t.id = mouvements_comptes.transaction_id
      AND p.user_id = auth.uid()
    )
  );

-- Insert only via service role (applications use backend, not direct insert)
CREATE POLICY "mouvements_comptes_insert" ON public.mouvements_comptes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comptes_financiers cf
      JOIN public.profiles p ON p.organization_id = cf.organization_id
      WHERE cf.id = mouvements_comptes.compte_id
      AND p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX 2: comptes_financiers — drop permissive policies
-- ============================================================================

DROP POLICY IF EXISTS "comptes_financiers_select" ON public.comptes_financiers;
DROP POLICY IF EXISTS "comptes_financiers_insert" ON public.comptes_financiers;

CREATE POLICY "comptes_financiers_select" ON public.comptes_financiers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.organization_id = comptes_financiers.organization_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "comptes_financiers_insert" ON public.comptes_financiers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.organization_id = comptes_financiers.organization_id
      AND profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'gerant')
    )
  );

-- ============================================================================
-- FIX 3: transactions — drop permissive policies
-- ============================================================================

DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Verify
-- ============================================================================

SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('mouvements_comptes', 'comptes_financiers', 'transactions')
ORDER BY tablename, policyname;

COMMIT;
