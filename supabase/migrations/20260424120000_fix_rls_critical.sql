-- ============================================================================
-- CRITICAL SECURITY FIX — COD-56
-- Date: 2026-04-24
-- Fix: Replace USING (true) / WITH CHECK (true) with auth.uid() checks
-- ============================================================================

-- ============================================================================
-- PART 1: Fix POS schema tables (initial_pos_schema.sql)
-- ============================================================================

-- 1. clients — has created_by
DROP POLICY IF EXISTS "clients_all_crud" ON public.clients;
CREATE POLICY "clients_user_select" ON public.clients FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "clients_user_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "clients_user_update" ON public.clients FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "clients_user_delete" ON public.clients FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 2. articles — has created_by
DROP POLICY IF EXISTS "articles_all_crud" ON public.articles;
CREATE POLICY "articles_user_select" ON public.articles FOR SELECT TO authenticated USING (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "articles_user_insert" ON public.articles FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "articles_user_update" ON public.articles FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "articles_user_delete" ON public.articles FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 3. factures — has created_by
DROP POLICY IF EXISTS "factures_all_crud" ON public.factures;
CREATE POLICY "factures_user_select" ON public.factures FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "factures_user_insert" ON public.factures FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "factures_user_update" ON public.factures FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "factures_user_delete" ON public.factures FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 4. facture_items — no created_by, linked to factures
DROP POLICY IF EXISTS "facture_items_all_crud" ON public.facture_items;
CREATE POLICY "facture_items_user_select" ON public.facture_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.factures WHERE id = facture_items.facture_id AND created_by = auth.uid())
);
CREATE POLICY "facture_items_user_insert" ON public.facture_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.factures WHERE id = facture_items.facture_id AND created_by = auth.uid())
);
CREATE POLICY "facture_items_user_update" ON public.facture_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.factures WHERE id = facture_items.facture_id AND created_by = auth.uid())
);
CREATE POLICY "facture_items_user_delete" ON public.facture_items FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.factures WHERE id = facture_items.facture_id AND created_by = auth.uid())
);

-- 5. caisse_sessions — has user_id
DROP POLICY IF EXISTS "caisse_sessions_all_crud" ON public.caisse_sessions;
CREATE POLICY "caisse_sessions_user_select" ON public.caisse_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "caisse_sessions_user_insert" ON public.caisse_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "caisse_sessions_user_update" ON public.caisse_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "caisse_sessions_user_delete" ON public.caisse_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- PART 2: Fix transactions table (phase0_cleanup.sql)
-- ============================================================================

DROP POLICY IF EXISTS "transactions_all_crud" ON public.transactions;
CREATE POLICY "transactions_user_select" ON public.transactions FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "transactions_user_insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "transactions_user_update" ON public.transactions FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "transactions_user_delete" ON public.transactions FOR DELETE TO authenticated USING (created_by = auth.uid());

-- ============================================================================
-- PART 3: Fix legacy tables (fix_legacy_tables.sql) — add created_by columns
-- ============================================================================

-- Add created_by to legacy tables if they exist
DO $$
BEGIN
  -- mouvements_comptes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mouvements_comptes') THEN
    ALTER TABLE public.mouvements_comptes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
  END IF;

  -- comptes_financiers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comptes_financiers') THEN
    ALTER TABLE public.comptes_financiers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
  END IF;

  -- transactions (legacy stub)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop old permissive policies (will silently fail if table doesn't exist)
DO $$
BEGIN
  DROP POLICY IF EXISTS "mouvements_comptes_select" ON public.mouvements_comptes;
  DROP POLICY IF EXISTS "mouvements_comptes_insert" ON public.mouvements_comptes;
  DROP POLICY IF EXISTS "comptes_financiers_select" ON public.comptes_financiers;
  DROP POLICY IF EXISTS "comptes_financiers_insert" ON public.comptes_financiers;
  DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
  DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
EXCEPTION WHEN undefined_table THEN
  -- Ignore if tables don't exist
  NULL;
END $$;

-- Create restricted policies only on existing tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mouvements_comptes') THEN
    CREATE POLICY "mouvements_comptes_user_select" ON public.mouvements_comptes FOR SELECT TO authenticated USING (created_by = auth.uid() OR created_by IS NULL);
    CREATE POLICY "mouvements_comptes_user_insert" ON public.mouvements_comptes FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comptes_financiers') THEN
    CREATE POLICY "comptes_financiers_user_select" ON public.comptes_financiers FOR SELECT TO authenticated USING (created_by = auth.uid() OR created_by IS NULL);
    CREATE POLICY "comptes_financiers_user_insert" ON public.comptes_financiers FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
  END IF;
END $$;
