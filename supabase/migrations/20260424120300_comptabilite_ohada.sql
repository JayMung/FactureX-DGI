-- ============================================================================
-- COMPTABILITÉ OHADA — Module 13 (6 pages)
-- Date: 2026-04-24
-- Description: Système comptable complet selon le plan OHADA
-- Tables: plan_comptable, exercices, journaux, ecritures, bilans, cpr
-- Pages: PlanComptable, Journal, GrandLivre, Balance, Bilan, CPR
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PLAN COMPTABLE OHADA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.plan_comptable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Compte SYSCOHADA
  code VARCHAR(10) NOT NULL,
  label VARCHAR(255) NOT NULL,
  classe SMALLINT NOT NULL CHECK (classe BETWEEN 1 AND 9),
  
  -- Classification
  nature VARCHAR(20) NOT NULL CHECK (nature IN ('Actif', 'Passif', 'Charge', 'Produit', 'Hors_bilan')),
  type VARCHAR(50),  -- e.g., 'Capitaux propres', 'Immobilisations', 'Créances', 'Dettes'
  categorie VARCHAR(50),  -- e.g., 'Sous-classe', 'Compte général', 'Compte divisionnaire'
  
  -- Hiérarchie
  parent_code VARCHAR(10),
  is_analytique BOOLEAN DEFAULT FALSE,
  is_saisissable BOOLEAN DEFAULT TRUE,
  
  -- Solde (calculé par vue/fonction)
  solde_debit NUMERIC(15, 2) DEFAULT 0,
  solde_credit NUMERIC(15, 2) DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  custom_label VARCHAR(255),  -- Surcharge client possible
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, code)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_pc_company ON public.plan_comptable(company_id);
CREATE INDEX IF NOT EXISTS idx_pc_classe ON public.plan_comptable(classe);
CREATE INDEX IF NOT EXISTS idx_pc_parent ON public.plan_comptable(parent_code);
CREATE INDEX IF NOT EXISTS idx_pc_code ON public.plan_comptable(code);

-- RLS
ALTER TABLE public.plan_comptable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pc_company_select" ON public.plan_comptable
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "pc_company_insert" ON public.plan_comptable
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND company_id = plan_comptable.company_id AND role IN ('super_admin', 'admin', 'comptable'))
  );
CREATE POLICY "pc_company_update" ON public.plan_comptable
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND company_id = plan_comptable.company_id AND role IN ('super_admin', 'admin', 'comptable'))
  );

-- ============================================================================
-- 2. EXERCICES COMPTABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercices_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  nom VARCHAR(100) NOT NULL DEFAULT 'Exercice N',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  
  statut VARCHAR(20) NOT NULL DEFAULT 'ouvert'
    CHECK (statut IN ('ouvert', 'cloture', 'en_cours_cloture')),
  date_cloture TIMESTAMPTZ,
  cloture_par UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, nom),
  UNIQUE(company_id, date_debut, date_fin)
);

ALTER TABLE public.exercices_comptables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ec_company_select" ON public.exercices_comptables FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.team_members WHERE user_id = auth.uid())
);
CREATE POLICY "ec_company_all" ON public.exercices_comptables FOR ALL USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND company_id = exercices_comptables.company_id AND role IN ('super_admin', 'admin', 'comptable'))
);

-- ============================================================================
-- 3. JOURNAUX COMPTABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.journaux_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  code VARCHAR(10) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('Ventes', 'Achats', 'Banque', 'Caisse', 'OD', 'A_Nouveaux', 'TVA')),
  
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, code)
);

-- Journaux par défaut pour RDC
INSERT INTO public.journaux_comptables (company_id, code, nom, type, is_default)
SELECT id, 'VTE', 'Journal des Ventes', 'Ventes', TRUE FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.journaux_comptables WHERE is_default = TRUE);

INSERT INTO public.journaux_comptables (company_id, code, nom, type, is_default)
SELECT id, 'ACH', "Journal des Achats", 'Achats', TRUE FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.journaux_comptables WHERE code = 'ACH');

INSERT INTO public.journaux_comptables (company_id, code, nom, type, is_default)
SELECT id, 'BQ', "Journal de Banque", 'Banque', TRUE FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.journaux_comptables WHERE code = 'BQ');

INSERT INTO public.journaux_comptables (company_id, code, nom, type, is_default)
SELECT id, 'CAI', "Journal de Caisse", 'Caisse', TRUE FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.journaux_comptables WHERE code = 'CAI');

INSERT INTO public.journaux_comptables (company_id, code, nom, type, is_default)
SELECT id, 'OD', "Journal des Opérations Diverses", 'OD', TRUE FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.journaux_comptables WHERE code = 'OD');

ALTER TABLE public.journaux_comptables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jc_company_select" ON public.journaux_comptables FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.team_members WHERE user_id = auth.uid())
);
CREATE POLICY "jc_company_all" ON public.journaux_comptables FOR ALL USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND company_id = journaux_comptables.company_id AND role IN ('super_admin', 'admin', 'comptable'))
);

-- ============================================================================
-- 4. ÉCRITURES COMPTABLES (pièce centrale du système)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ecritures_comptables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  exercice_id UUID REFERENCES public.exercices_comptables(id),
  journal_id UUID REFERENCES public.journaux_comptables(id),
  
  -- Pièce comptable
  piece_numero VARCHAR(50) NOT NULL,
  piece_date DATE NOT NULL,
  date_ecriture DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Ligne d'écriture
  compte_id UUID REFERENCES public.plan_comptable(id),
  compte_code VARCHAR(10) NOT NULL,
  libelle VARCHAR(255) NOT NULL,
  
  -- Montants
  debit NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  
  -- Lettrage
  lettrage VARCHAR(10),
  date_lettrage DATE,
  
  -- Référence document source
  reference_type VARCHAR(30),  -- 'facture_client', 'facture_fournisseur', 'paiement', 'tresorerie', 'od'
  reference_id UUID,
  reference_numero VARCHAR(50),
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  validated_by UUID REFERENCES auth.users(id),
  date_validation TIMESTAMPTZ,
  is_validee BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte: une ligne ne peut être qu'au débit OU au crédit
  CONSTRAINT chk_debit_credit CHECK (NOT (debit > 0 AND credit > 0)),
  CONSTRAINT chk_au_moins_un CHECK (debit > 0 OR credit > 0)
);

-- Indexes for performance (comptabilité = BEAUCOUP de lignes)
CREATE INDEX IF NOT EXISTS idx_ec_company ON public.ecritures_comptables(company_id);
CREATE INDEX IF NOT EXISTS idx_ec_exercice ON public.ecritures_comptables(exercice_id);
CREATE INDEX IF NOT EXISTS idx_ec_journal ON public.ecritures_comptables(journal_id);
CREATE INDEX IF NOT EXISTS idx_ec_compte ON public.ecritures_comptables(compte_id);
CREATE INDEX IF NOT EXISTS idx_ec_compte_code ON public.ecritures_comptables(compte_code);
CREATE INDEX IF NOT EXISTS idx_ec_piece ON public.ecritures_comptables(piece_numero);
CREATE INDEX IF NOT EXISTS idx_ec_date ON public.ecritures_comptables(date_ecriture);
CREATE INDEX IF NOT EXISTS idx_ec_lettrage ON public.ecritures_comptables(lettrage);
CREATE INDEX IF NOT EXISTS idx_ec_reference ON public.ecritures_comptables(reference_type, reference_id);

ALTER TABLE public.ecritures_comptables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ec_company_select" ON public.ecritures_comptables FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.team_members WHERE user_id = auth.uid())
);
CREATE POLICY "ec_company_insert" ON public.ecritures_comptables FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND company_id = ecritures_comptables.company_id AND role IN ('super_admin', 'admin', 'comptable'))
);
CREATE POLICY "ec_company_update" ON public.ecritures_comptables FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND company_id = ecritures_comptables.company_id AND role IN ('super_admin', 'admin', 'comptable'))
);

-- ============================================================================
-- 5. VUES COMPTABLES ESSENTIELLES
-- ============================================================================

-- 5a. GRAND LIVRE — Mouvements + solde cumulé par compte
CREATE OR REPLACE VIEW public.v_grand_livre AS
WITH solde_initial AS (
  SELECT 
    compte_code,
    company_id,
    SUM(debit) - SUM(credit) AS solde_init
  FROM public.ecritures_comptables
  GROUP BY compte_code, company_id
),
solde_cumul AS (
  SELECT 
    ec.*,
    SUM(ec.debit - ec.credit) OVER (
      PARTITION BY ec.company_id, ec.compte_code 
      ORDER BY ec.date_ecriture, ec.created_at 
      ROWS UNBOUNDED PRECEDING
    ) AS solde_cumule
  FROM public.ecritures_comptables ec
)
SELECT 
  sc.*,
  pc.label AS compte_label,
  pc.nature,
  pc.classe,
  j.code AS journal_code,
  j.nom AS journal_nom
FROM solde_cumul sc
LEFT JOIN public.plan_comptable pc ON pc.code = sc.compte_code AND pc.company_id = sc.company_id
LEFT JOIN public.journaux_comptables j ON j.id = sc.journal_id;

-- 5b. BALANCE — Synthèse compte par compte
CREATE OR REPLACE VIEW public.v_balance AS
SELECT 
  ec.company_id,
  pc.code,
  pc.label AS compte_label,
  pc.classe,
  pc.type,
  pc.nature,
  COUNT(*) AS nb_mouvements,
  ROUND(SUM(ec.debit)::numeric, 2) AS total_debit,
  ROUND(SUM(ec.credit)::numeric, 2) AS total_credit,
  ROUND(SUM(ec.debit - ec.credit)::numeric, 2) AS solde,
  CASE 
    WHEN SUM(ec.debit - ec.credit) > 0 THEN 'Débiteur'
    WHEN SUM(ec.debit - ec.credit) < 0 THEN 'Créditeur'
    ELSE 'Néant'
  END AS solde_nature
FROM public.ecritures_comptables ec
LEFT JOIN public.plan_comptable pc ON pc.code = ec.compte_code AND pc.company_id = ec.company_id
GROUP BY ec.company_id, pc.code, pc.label, pc.classe, pc.type, pc.nature
ORDER BY pc.code;

-- 5c. BILAN SYNTHÈSE
CREATE OR REPLACE VIEW public.v_bilan AS
SELECT 
  company_id,
  'ACTIF' AS section,
  CASE 
    WHEN classe IN (2) THEN 'Immobilisations'
    WHEN classe IN (3) THEN 'Stocks et en-cours'
    WHEN classe IN (4) AND code LIKE '4%' AND nature = 'Actif' THEN 'Créances'
    WHEN classe IN (5) AND code LIKE '5%' AND nature = 'Actif' THEN 'Trésorerie'
    ELSE 'Autres actifs'
  END AS rubrique,
  code,
  label AS compte_label,
  ROUND(SUM(debit - credit)::numeric, 2) AS montant,
  classe
FROM plan_comptable pc
LEFT JOIN ecritures_comptables ec USING (code, company_id)
WHERE nature = 'Actif'
GROUP BY company_id, classe, code, label
UNION ALL
SELECT 
  company_id,
  'PASSIF' AS section,
  CASE 
    WHEN classe IN (1) THEN 'Capitaux propres'
    WHEN classe IN (4) AND code LIKE '4%' AND nature = 'Passif' THEN 'Dettes'
    ELSE 'Autres passifs'
  END AS rubrique,
  code,
  label AS compte_label,
  ROUND(SUM(credit - debit)::numeric, 2) AS montant,
  classe
FROM plan_comptable pc
LEFT JOIN ecritures_comptables ec USING (code, company_id)
WHERE nature = 'Passif'
GROUP BY company_id, classe, code, label;

-- 5d. COMPTE DE RÉSULTAT (CPR)
CREATE OR REPLACE VIEW public.v_cpr AS
SELECT 
  company_id,
  CASE 
    WHEN nature = 'Charge' THEN 'CHARGES'
    WHEN nature = 'Produit' THEN 'PRODUITS'
  END AS section,
  CASE
    WHEN classe = 6 THEN 'Charges d\'exploitation'
    WHEN classe = 7 THEN 'Produits d\'exploitation'
    WHEN code LIKE '65%' THEN 'Charges financières'
    WHEN code LIKE '75%' THEN 'Produits financiers'
    WHEN code LIKE '66%' THEN 'Impôts et taxes'
    ELSE 'Hors exploitation'
  END AS rubrique,
  code,
  label AS compte_label,
  ROUND(SUM(ABS(COALESCE(debit, 0) - COALESCE(credit, 0)))::numeric, 2) AS montant,
  nature
FROM plan_comptable pc
LEFT JOIN ecritures_comptables ec USING (code, company_id)
WHERE nature IN ('Charge', 'Produit')
GROUP BY company_id, nature, classe, code, label;

-- ============================================================================
-- 6. FONCTIONS RPC
-- ============================================================================

-- Grand Livre: toutes les écritures d'un compte avec solde cumulé
CREATE OR REPLACE FUNCTION public.get_grand_livre(
  p_company_id UUID,
  p_compte_code VARCHAR,
  p_date_debut DATE DEFAULT NULL,
  p_date_fin DATE DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  date_ecriture DATE,
  piece_numero VARCHAR,
  journal_code VARCHAR,
  journal_nom VARCHAR,
  libelle VARCHAR,
  debit NUMERIC,
  credit NUMERIC,
  solde_cumule NUMERIC
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH ecritures AS (
    SELECT
      ec.id,
      ec.date_ecriture,
      ec.piece_numero,
      jc.code AS journal_code,
      jc.nom AS journal_nom,
      ec.libelle,
      ec.debit,
      ec.credit
    FROM public.ecritures_comptables ec
    LEFT JOIN public.journaux_comptables jc ON jc.id = ec.journal_id
    WHERE ec.company_id = p_company_id
      AND ec.compte_code = p_compte_code
      AND (p_date_debut IS NULL OR ec.date_ecriture >= p_date_debut)
      AND (p_date_fin IS NULL OR ec.date_ecriture <= p_date_fin)
  )
  SELECT
    ecritures.id,
    ecritures.date_ecriture,
    ecritures.piece_numero,
    ecritures.journal_code,
    ecritures.journal_nom,
    ecritures.libelle,
    ecritures.debit,
    ecritures.credit,
    SUM(ecritures.debit - ecritures.credit) OVER (
      ORDER BY ecritures.date_ecriture, ecritures.id
      ROWS UNBOUNDED PRECEDING
    ) AS solde_cumule
  FROM ecritures
  ORDER BY ecritures.date_ecriture, ecritures.id;
END;
$$;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_comptable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all compta tables
CREATE TRIGGER trg_pc_updated_at BEFORE UPDATE ON public.plan_comptable
  FOR EACH ROW EXECUTE FUNCTION public.update_comptable_updated_at();
CREATE TRIGGER trg_ec_updated_at BEFORE UPDATE ON public.exercices_comptables
  FOR EACH ROW EXECUTE FUNCTION public.update_comptable_updated_at();
CREATE TRIGGER trg_jc_updated_at BEFORE UPDATE ON public.journaux_comptables
  FOR EACH ROW EXECUTE FUNCTION public.update_comptable_updated_at();
CREATE TRIGGER trg_ecriture_updated_at BEFORE UPDATE ON public.ecritures_comptables
  FOR EACH ROW EXECUTE FUNCTION public.update_comptable_updated_at();

-- Seed default exercice for existing companies
INSERT INTO public.exercices_comptables (company_id, nom, date_debut, date_fin)
SELECT id, 'Exercice 2026', '2026-01-01', '2026-12-31'
FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.exercices_comptables);

COMMIT;
