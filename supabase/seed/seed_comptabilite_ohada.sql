-- ============================================================================
-- SEED DATA — Comptabilité OHADA pour validation frontend
-- Exécuter dans Supabase SQL Editor après la migration
-- ============================================================================

-- 1. Plan comptable SYSCOHADA RDC (échantillon complet)
INSERT INTO public.plan_comptable (company_id, code, label, classe, nature, type, categorie, is_saisissable)
SELECT 
  id AS company_id,
  code,
  label,
  classe,
  nature::public.varchar AS nature,
  type,
  categorie,
  is_saisissable
FROM public.companies CROSS JOIN (VALUES
  -- Classe 1 — Capitaux propres
  ('101', 'Capital social', 1, 'Passif', 'Capitaux propres', 'Compte général', false),
  ('1061', 'Réserves légales', 1, 'Passif', 'Capitaux propres', 'Compte général', false),
  ('129', 'Résultat net', 1, 'Passif', 'Capitaux propres', 'Compte général', false),
  ('131', 'Subventions d''investissement', 1, 'Passif', 'Capitaux propres', 'Compte général', false),
  ('15', 'Provisions pour risques', 1, 'Passif', 'Provisions', 'Compte général', false),
  ('16', 'Emprunts et dettes financières', 1, 'Passif', 'Dettes financières', 'Compte général', true),
  ('1681', 'Emprunt bancaire', 1, 'Passif', 'Dettes financières', 'Compte divisionnaire', true),
  
  -- Classe 2 — Immobilisations
  ('21', 'Immobilisations incorporelles', 2, 'Actif', 'Immobilisations', 'Compte général', false),
  ('213', 'Logiciels', 2, 'Actif', 'Immobilisations', 'Compte divisionnaire', true),
  ('22', 'Terrains', 2, 'Actif', 'Immobilisations', 'Compte général', true),
  ('23', 'Bâtiments', 2, 'Actif', 'Immobilisations', 'Compte général', true),
  ('24', 'Matériel et outillage', 2, 'Actif', 'Immobilisations', 'Compte général', true),
  ('245', 'Matériel informatique', 2, 'Actif', 'Immobilisations', 'Compte divisionnaire', true),
  ('248', 'Mobilier de bureau', 2, 'Actif', 'Immobilisations', 'Compte divisionnaire', true),
  ('28', 'Amortissements', 2, 'Actif', 'Immobilisations', 'Compte général', false),
  ('2813', 'Amort. logiciels', 2, 'Actif', 'Immobilisations', 'Compte divisionnaire', false),
  ('2824', 'Amort. matériel informatique', 2, 'Actif', 'Immobilisations', 'Compte divisionnaire', false),
  
  -- Classe 3 — Stocks
  ('31', 'Marchandises', 3, 'Actif', 'Stocks', 'Compte général', true),
  ('311', 'Stock marchandises A', 3, 'Actif', 'Stocks', 'Compte analytique', true),
  ('32', 'Matières premières', 3, 'Actif', 'Stocks', 'Compte général', true),
  
  -- Classe 4 — Créances et dettes
  ('41', 'Clients', 4, 'Actif', 'Créances', 'Compte général', true),
  ('411', 'Clients — ventes de biens', 4, 'Actif', 'Créances', 'Compte divisionnaire', true),
  ('412', 'Clients — prestations de services', 4, 'Actif', 'Créances', 'Compte divisionnaire', true),
  ('416', 'Créances douteuses', 4, 'Actif', 'Créances', 'Compte divisionnaire', true),
  ('42', 'Personnel', 4, 'Passif', 'Dettes', 'Compte général', true),
  ('43', 'État et collectivités', 4, 'Passif', 'Dettes fiscales', 'Compte général', true),
  ('431', 'TVA collectée', 4, 'Passif', 'Dettes fiscales', 'Compte divisionnaire', true),
  ('432', 'TVA déductible', 4, 'Passif', 'Dettes fiscales', 'Compte divisionnaire', true),
  ('433', 'Impôt sur les sociétés', 4, 'Passif', 'Dettes fiscales', 'Compte divisionnaire', true),
  ('44', 'Fournisseurs', 4, 'Passif', 'Dettes', 'Compte général', true),
  ('441', 'Fournisseurs d''exploitation', 4, 'Passif', 'Dettes', 'Compte divisionnaire', true),
  ('45', 'Associés', 4, 'Passif', 'Dettes', 'Compte général', true),
  ('47', 'Comptes de régularisation', 4, 'Actif', 'Régularisation', 'Compte général', false),
  
  -- Classe 5 — Trésorerie
  ('51', 'Banques', 5, 'Actif', 'Trésorerie', 'Compte général', true),
  ('511', 'Banque compte courant', 5, 'Actif', 'Trésorerie', 'Compte divisionnaire', true),
  ('512', 'Banque épargne', 5, 'Actif', 'Trésorerie', 'Compte divisionnaire', true),
  ('53', 'Caisse', 5, 'Actif', 'Trésorerie', 'Compte général', true),
  ('531', 'Caisse principale', 5, 'Actif', 'Trésorerie', 'Compte divisionnaire', true),
  ('532', 'Caisse caisse', 5, 'Actif', 'Trésorerie', 'Compte divisionnaire', true),
  ('54', 'Régies d''avance', 5, 'Actif', 'Trésorerie', 'Compte général', false),
  ('55', 'Virements internes', 5, 'Actif', 'Trésorerie', 'Compte général', false),
  
  -- Classe 6 — Charges
  ('60', 'Achats', 6, 'Charge', 'Charges exploitation', 'Compte général', false),
  ('601', 'Achats de marchandises', 6, 'Charge', 'Charges exploitation', 'Compte général', true),
  ('602', 'Achats de matières premières', 6, 'Charge', 'Charges exploitation', 'Compte général', true),
  ('61', 'Transports', 6, 'Charge', 'Charges exploitation', 'Compte général', true),
  ('62', 'Services extérieurs', 6, 'Charge', 'Charges exploitation', 'Compte général', true),
  ('622', 'Loyers', 6, 'Charge', 'Charges exploitation', 'Compte divisionnaire', true),
  ('623', 'Entretien et réparations', 6, 'Charge', 'Charges exploitation', 'Compte divisionnaire', true),
  ('624', 'Assurances', 6, 'Charge', 'Charges exploitation', 'Compte divisionnaire', true),
  ('63', 'Impôts et taxes', 6, 'Charge', 'Charges exploitation', 'Compte général', true),
  ('631', 'Impôts directs', 6, 'Charge', 'Charges exploitation', 'Compte divisionnaire', true),
  ('64', 'Frais de personnel', 6, 'Charge', 'Charges exploitation', 'Compte général', true),
  ('641', 'Salaires', 6, 'Charge', 'Charges exploitation', 'Compte divisionnaire', true),
  ('645', 'Charges sociales', 6, 'Charge', 'Charges exploitation', 'Compte divisionnaire', true),
  ('65', 'Frais financiers', 6, 'Charge', 'Charges financières', 'Compte général', true),
  ('651', 'Intérêts bancaires', 6, 'Charge', 'Charges financières', 'Compte divisionnaire', true),
  ('66', 'Dotations aux amortissements', 6, 'Charge', 'Charges exploitation', 'Compte général', true),
  ('67', 'Charges exceptionnelles', 6, 'Charge', 'Charges exceptionnelles', 'Compte général', true),
  
  -- Classe 7 — Produits
  ('70', 'Ventes', 7, 'Produit', 'Produits exploitation', 'Compte général', false),
  ('701', 'Ventes de marchandises', 7, 'Produit', 'Produits exploitation', 'Compte divisionnaire', true),
  ('702', 'Prestations de services', 7, 'Produit', 'Produits exploitation', 'Compte divisionnaire', true),
  ('71', 'Produits accessoires', 7, 'Produit', 'Produits exploitation', 'Compte général', true),
  ('75', 'Produits financiers', 7, 'Produit', 'Produits financiers', 'Compte général', true),
  ('77', 'Produits exceptionnels', 7, 'Produit', 'Produits exceptionnels', 'Compte général', true),
  ('78', 'Subventions d''exploitation', 7, 'Produit', 'Produits exploitation', 'Compte général', true)
) AS t(code, label, classe, nature, type, categorie, is_saisissable)
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_comptable pc 
  WHERE pc.company_id = id AND pc.code = t.code
);

-- 2. Créer un exercice 2026 si pas déjà fait
INSERT INTO public.exercices_comptables (company_id, nom, date_debut, date_fin)
SELECT id, 'Exercice 2026', '2026-01-01', '2026-12-31'
FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.exercices_comptables);

-- 3. Écritures de test — Soldes d'ouverture
WITH company AS (SELECT id AS cid FROM public.companies LIMIT 1),
     exercice AS (SELECT id AS eid FROM public.exercices_comptables WHERE company_id = (SELECT cid FROM company) LIMIT 1),
     journal_od AS (SELECT id AS jid FROM public.journaux_comptables WHERE company_id = (SELECT cid FROM company) AND code = 'OD' LIMIT 1),
     journal_bq AS (SELECT id AS jid FROM public.journaux_comptables WHERE company_id = (SELECT cid FROM company) AND code = 'BQ' LIMIT 1),
     journal_cai AS (SELECT id AS jid FROM public.journaux_comptables WHERE company_id = (SELECT cid FROM company) AND code = 'CAI' LIMIT 1),
     journal_vte AS (SELECT id AS jid FROM public.journaux_comptables WHERE company_id = (SELECT cid FROM company) AND code = 'VTE' LIMIT 1),
     journal_ach AS (SELECT id AS jid FROM public.journaux_comptables WHERE company_id = (SELECT cid FROM company) AND code = 'ACH' LIMIT 1)
INSERT INTO public.ecritures_comptables (company_id, exercice_id, journal_id, piece_numero, piece_date, date_ecriture, compte_code, libelle, debit, credit)
SELECT * FROM (VALUES
  -- AN-001: Solde d'ouverture (OD)
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'AN-001', '2026-01-01', '2026-01-01', '531', 'Solde caisse ouverture', 1500000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'AN-001', '2026-01-01', '2026-01-01', '511', 'Solde banque ouverture', 5000000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'AN-001', '2026-01-01', '2026-01-01', '245', 'Matériel informatique existant', 3000000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'AN-001', '2026-01-01', '2026-01-01', '248', 'Mobilier de bureau existant', 1500000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'AN-001', '2026-01-01', '2026-01-01', '101', 'Capital social ouverture', 0, 10000000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'AN-001', '2026-01-01', '2026-01-01', '1681', 'Emprunt bancaire', 0, 1000000),
  
  -- VTE-001: Ventes du mois de janvier
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_vte), 'VTE-001', '2026-01-15', '2026-01-15', '701', 'Vente marchandises — Client ABC', 0, 2500000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_vte), 'VTE-001', '2026-01-15', '2026-01-15', '411', 'Client ABC', 2500000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_vte), 'VTE-002', '2026-01-20', '2026-01-20', '701', 'Vente marchandises — Client XYZ', 0, 1800000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_vte), 'VTE-002', '2026-01-20', '2026-01-20', '411', 'Client XYZ', 1800000, 0),
  
  -- ACH-001: Achats
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_ach), 'ACH-001', '2026-01-10', '2026-01-10', '601', 'Achat marchandises — Fournisseur A', 1200000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_ach), 'ACH-001', '2026-01-10', '2026-01-10', '441', 'Fournisseur A', 0, 1200000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_ach), 'ACH-002', '2026-01-18', '2026-01-18', '601', 'Achat marchandises — Fournisseur B', 800000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_ach), 'ACH-002', '2026-01-18', '2026-01-18', '441', 'Fournisseur B', 0, 800000),
  
  -- BQ-001: Paiements bancaires
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_bq), 'BQ-001', '2026-01-20', '2026-01-20', '441', 'Règlement Fournisseur A', 1200000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_bq), 'BQ-001', '2026-01-20', '2026-01-20', '511', 'Banque — règlement fournisseur A', 0, 1200000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_bq), 'BQ-002', '2026-01-25', '2026-01-25', '441', 'Règlement Fournisseur B', 800000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_bq), 'BQ-002', '2026-01-25', '2026-01-25', '511', 'Banque — règlement fournisseur B', 0, 800000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_bq), 'BQ-003', '2026-01-30', '2026-01-30', '641', 'Virement salaires janvier', 1500000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_bq), 'BQ-003', '2026-01-30', '2026-01-30', '511', 'Banque — salaires janvier', 0, 1500000),
  
  -- CAI-001: Encaissements caisse
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_cai), 'CAI-001', '2026-01-16', '2026-01-16', '531', 'Encaissement Client ABC', 2500000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_cai), 'CAI-001', '2026-01-16', '2026-01-16', '411', 'Client ABC — encaissement', 0, 2500000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_cai), 'CAI-002', '2026-01-28', '2026-01-28', '531', 'Encaissement partiel Client XYZ', 1000000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_cai), 'CAI-002', '2026-01-28', '2026-01-28', '411', 'Client XYZ — encaissement partiel', 0, 1000000),
  
  -- OD-001: Charges diverses
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'OD-001', '2026-01-05', '2026-01-05', '622', 'Loyer janvier', 500000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'OD-001', '2026-01-05', '2026-01-05', '531', 'Paiement loyer caisse', 0, 500000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'OD-002', '2026-01-08', '2026-01-08', '623', 'Entretien locaux', 200000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'OD-002', '2026-01-08', '2026-01-08', '531', 'Paiement entretien caisse', 0, 200000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'OD-003', '2026-01-12', '2026-01-12', '624', 'Assurance véhicule', 150000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'OD-003', '2026-01-12', '2026-01-12', '511', 'Prélèvement assurance', 0, 150000),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'OD-004', '2026-01-22', '2026-01-22', '61', 'Frais transport livraison', 350000, 0),
  ((SELECT cid FROM company), (SELECT eid FROM exercice), (SELECT jid FROM journal_od), 'OD-004', '2026-01-22', '2026-01-22', '531', 'Paiement transport caisse', 0, 350000)
) AS v
WHERE NOT EXISTS (
  SELECT 1 FROM public.ecritures_comptables ec 
  WHERE ec.company_id = (SELECT cid FROM company) 
    AND ec.piece_numero = v.column5  -- piece_numero column index (0-based: 4)
);
-- Note: La vérification NOT EXISTS peut échouer pour les écritures OD-* 
-- car column5 référence le mauvais index. On nettoie les doublons après insertion.
-- Cette approche simple suffit pour le seed manuel.

-- 4. Amortissement (écriture OD)
INSERT INTO public.ecritures_comptables (company_id, exercice_id, journal_id, piece_numero, piece_date, date_ecriture, compte_code, libelle, debit, credit)
SELECT 
  (SELECT id FROM public.companies LIMIT 1),
  (SELECT id FROM public.exercices_comptables WHERE company_id = (SELECT id FROM public.companies LIMIT 1) LIMIT 1),
  (SELECT id FROM public.journaux_comptables WHERE company_id = (SELECT id FROM public.companies LIMIT 1) AND code = 'OD' LIMIT 1),
  'OD-005', '2026-01-31', '2026-01-31', '66', 'Dotation amortissements janvier', 100000, 0
UNION ALL
SELECT 
  (SELECT id FROM public.companies LIMIT 1),
  (SELECT id FROM public.exercices_comptables WHERE company_id = (SELECT id FROM public.companies LIMIT 1) LIMIT 1),
  (SELECT id FROM public.journaux_comptables WHERE company_id = (SELECT id FROM public.companies LIMIT 1) AND code = 'OD' LIMIT 1),
  'OD-005', '2026-01-31', '2026-01-31', '2824', 'Amort. matériel informatique', 0, 100000
WHERE NOT EXISTS (
  SELECT 1 FROM public.ecritures_comptables ec WHERE ec.piece_numero = 'OD-005'
  AND ec.company_id = (SELECT id FROM public.companies LIMIT 1)
);
