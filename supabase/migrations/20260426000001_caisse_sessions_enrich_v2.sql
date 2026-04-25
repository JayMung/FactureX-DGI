-- Migration: Enrichir caisse_sessions + créer caisse_transferts pour v2 POS
-- Issue: COD-70 / COD-76
-- Correspond aux colonnes attendues par les pages:
--   Caisse-Ouverture.tsx, Caisse-Fermeture.tsx, Caisse-Journal.tsx,
--   Caisse-Transfert.tsx, Caisse-Sessions.tsx, POS-Caisse.tsx
--
-- ANALYSE DES ÉCARTS:
-- ====================
-- La table actuelle a:   user_id, fond_initial, total_ventes, total_especes, total_carte, statut
-- Le code utilise aussi: opened_by, solde_ouverture, total_mobile, total_sorties,
--                        solde_fermeture, closed_by, closed_at, notes,
--                        billetage_ouverture, billetage_fermeture, ecart,
--                        solde_ouverture_cdf, solde_ouverture_usd, devise_ouverture,
--                        notes_fermeture, total_especes_cdf, total_especes_usd

-- ============================================
-- 1. AJOUT COLONNES MANQUANTES caisse_sessions
-- ============================================
ALTER TABLE public.caisse_sessions
  -- Alias / compatibilité avec le code existant
  ADD COLUMN IF NOT EXISTS opened_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,

  -- Alias fonds
  ADD COLUMN IF NOT EXISTS solde_ouverture DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solde_ouverture_cdf DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solde_ouverture_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS devise_ouverture VARCHAR(10) DEFAULT 'USD',

  -- Billetage
  ADD COLUMN IF NOT EXISTS billetage_ouverture JSONB,
  ADD COLUMN IF NOT EXISTS billetage_fermeture JSONB,

  -- Nouveaux totaux
  ADD COLUMN IF NOT EXISTS total_mobile DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sorties DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Fermeture
  ADD COLUMN IF NOT EXISTS solde_fermeture DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ecart DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS notes_fermeture TEXT,
  ADD COLUMN IF NOT EXISTS total_especes_cdf DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_especes_usd DECIMAL(10,2) DEFAULT 0;

-- Synchroniser opened_by = user_id pour les enregistrements existants
UPDATE public.caisse_sessions SET opened_by = user_id WHERE opened_by IS NULL;

-- ============================================
-- 2. TABLE caisse_transferts
-- ============================================
CREATE TABLE IF NOT EXISTS public.caisse_transferts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caisse_session_id UUID REFERENCES public.caisse_sessions(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('depot', 'retrait')),
  montant DECIMAL(10,2) NOT NULL DEFAULT 0,
  mode_paiement VARCHAR(20) DEFAULT 'especes' CHECK (mode_paiement IN ('especes', 'carte', 'mobile', 'virement')),
  destination VARCHAR(255),               -- ex: 'Banque XYZ - Compte 1234'
  motif TEXT,
  reference VARCHAR(100),
  effectue_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.caisse_transferts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caisse_transferts_all_crud" ON public.caisse_transferts FOR ALL TO authenticated USING (true);

CREATE INDEX idx_caisse_transferts_session ON public.caisse_transferts(caisse_session_id);
CREATE INDEX idx_caisse_transferts_date ON public.caisse_transferts(created_at);

-- ============================================
-- 3. TABLE caisse_sorties (COD-70)
-- ============================================
CREATE TABLE IF NOT EXISTS public.caisse_sorties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caisse_session_id UUID REFERENCES public.caisse_sessions(id) ON DELETE SET NULL,
  montant DECIMAL(10,2) NOT NULL,
  motif TEXT NOT NULL,
  categorie VARCHAR(50) DEFAULT 'divers' CHECK (categorie IN ('approvisionnement', 'depense', 'remboursement', 'divers')),
  effectue_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.caisse_sorties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caisse_sorties_all_crud" ON public.caisse_sorties FOR ALL TO authenticated USING (true);

CREATE INDEX idx_caisse_sorties_session ON public.caisse_sorties(caisse_session_id);

-- ============================================
-- 4. TRIGGER: auto-set opened_by sur INSERT
-- ============================================
CREATE OR REPLACE FUNCTION public.set_caisse_session_opened_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.opened_by IS NULL THEN
    NEW.opened_by := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_caisse_session_opened_by ON public.caisse_sessions;
CREATE TRIGGER trg_caisse_session_opened_by
  BEFORE INSERT ON public.caisse_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_caisse_session_opened_by();

COMMENT ON TABLE public.caisse_transferts IS 'Transferts entre caisse et banque';
COMMENT ON TABLE public.caisse_sorties IS 'Sorties de caisse (dépenses, approvisionnements)';
