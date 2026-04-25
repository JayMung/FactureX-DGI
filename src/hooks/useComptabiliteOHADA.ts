"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanCompte {
  id: string;
  company_id: string;
  code: string;
  label: string;
  classe: number;
  nature: 'Actif' | 'Passif' | 'Charge' | 'Produit' | 'Hors_bilan';
  type: string | null;
  categorie: string | null;
  parent_code: string | null;
  is_analytique: boolean;
  is_saisissable: boolean;
  solde_debit: number;
  solde_credit: number;
  is_active: boolean;
  custom_label: string | null;
}

export interface ExerciceComptable {
  id: string;
  company_id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  statut: 'ouvert' | 'cloture' | 'en_cours_cloture';
  date_cloture: string | null;
  cloture_par: string | null;
}

export interface JournalComptable {
  id: string;
  company_id: string;
  code: string;
  nom: string;
  type: 'Ventes' | 'Achats' | 'Banque' | 'Caisse' | 'OD' | 'A_Nouveaux' | 'TVA';
  is_default: boolean;
  is_active: boolean;
}

export interface EcritureComptable {
  id: string;
  company_id: string;
  exercice_id: string;
  journal_id: string;
  piece_numero: string;
  piece_date: string;
  date_ecriture: string;
  compte_id: string;
  compte_code: string;
  libelle: string;
  debit: number;
  credit: number;
  lettrage: string | null;
  date_lettrage: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reference_numero: string | null;
  created_by: string | null;
  validated_by: string | null;
  date_validation: string | null;
  is_validee: boolean;
  // Joined fields
  compte_label?: string;
  journal_code?: string;
  journal_nom?: string;
}

export interface BalanceEntry {
  code: string;
  compte_label: string | null;
  classe: number;
  type: string | null;
  nature: string | null;
  nb_mouvements: number;
  total_debit: number;
  total_credit: number;
  solde: number;
  solde_nature: string;
}

export interface BilanEntry {
  section: 'ACTIF' | 'PASSIF';
  rubrique: string;
  code: string;
  compte_label: string;
  montant: number;
  classe: number;
}

export interface CPREntry {
  section: 'CHARGES' | 'PRODUITS';
  rubrique: string;
  code: string;
  compte_label: string;
  montant: number;
  nature: string;
}

// ─── Plan Comptable ──────────────────────────────────────────────────────────

export function usePlanComptable(companyId?: string) {
  return useQuery({
    queryKey: ['plan-comptable', companyId],
    queryFn: async (): Promise<PlanCompte[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('plan_comptable')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('code');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useSoldesParClasse(companyId?: string) {
  return useQuery({
    queryKey: ['soldes-classe', companyId],
    queryFn: async (): Promise<{ classe: number; total: number }[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('plan_comptable')
        .select('classe, solde_debit, solde_credit')
        .eq('company_id', companyId);
      if (error) throw error;

      const totals: Record<number, number> = {};
      (data || []).forEach((c) => {
        totals[c.classe] = (totals[c.classe] || 0) + (c.solde_debit - c.solde_credit);
      });
      return Object.entries(totals).map(([classe, total]) => ({
        classe: Number(classe),
        total: Math.abs(total),
      }));
    },
    enabled: !!companyId,
  });
}

// ─── Exercices Comptables ────────────────────────────────────────────────────

export function useExercicesComptables(companyId?: string) {
  return useQuery({
    queryKey: ['exercices-comptables', companyId],
    queryFn: async (): Promise<ExerciceComptable[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('company_id', companyId)
        .order('date_debut', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useExerciceCourant(companyId?: string) {
  const { data: exercices } = useExercicesComptables(companyId);
  const courant = exercices?.find((e) => e.statut === 'ouvert');
  return { data: courant || exercices?.[0] };
}

// ─── Journaux Comptables ──────────────────────────────────────────────────────

export function useJournauxComptables(companyId?: string) {
  return useQuery({
    queryKey: ['journaux-comptables', companyId],
    queryFn: async (): Promise<JournalComptable[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('journaux_comptables')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('code');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

// ─── Écritures Comptables ──────────────────────────────────────────────────────

export function useEcrituresComptables(
  companyId?: string,
  filters?: {
    exercice_id?: string;
    journal_id?: string;
    compte_code?: string;
    date_debut?: string;
    date_fin?: string;
    piece_numero?: string;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ['ecritures-comptables', companyId, filters],
    queryFn: async (): Promise<EcritureComptable[]> => {
      if (!companyId) return [];

      let query = supabase
        .from('ecritures_comptables')
        .select(`
          *,
          plan_comptable!ecritures_comptables_compte_code_fkey(label),
          journaux_comptables!ecritures_comptables_journal_id_fkey(code, nom)
        `)
        .eq('company_id', companyId);

      if (filters?.exercice_id) query = query.eq('exercice_id', filters.exercice_id);
      if (filters?.journal_id) query = query.eq('journal_id', filters.journal_id);
      if (filters?.compte_code) query = query.eq('compte_code', filters.compte_code);
      if (filters?.date_debut) query = query.gte('date_ecriture', filters.date_debut);
      if (filters?.date_fin) query = query.lte('date_ecriture', filters.date_fin);
      if (filters?.piece_numero) query = query.ilike('piece_numero', `%${filters.piece_numero}%`);

      query = query.order('date_ecriture', { ascending: false }).order('created_at', { ascending: false });

      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;

      // Transform to flatten joined data
      return (data || []).map((item: any) => ({
        ...item,
        compte_label: item.plan_comptable?.label || item.compte_code,
        journal_code: item.journaux_comptables?.code,
        journal_nom: item.journaux_comptables?.nom,
      }));
    },
    enabled: !!companyId,
  });
}

// ─── Grand Livre ──────────────────────────────────────────────────────────────

export function useGrandLivre(companyId?: string, compteCode?: string) {
  return useQuery({
    queryKey: ['grand-livre', companyId, compteCode],
    queryFn: async (): Promise<{
      entries: EcritureComptable[];
      total_debit: number;
      total_credit: number;
      solde: number;
    }> => {
      if (!companyId || !compteCode) return { entries: [], total_debit: 0, total_credit: 0, solde: 0 };

      const { data, error } = await supabase
        .rpc('get_grand_livre', { p_company_id: companyId, p_compte_code: compteCode });

      if (error) {
        // Fallback via direct query
        const entries = await useEcrituresComptables(companyId, { compte_code: compteCode }).then((r) => r.data || []);
        const total_debit = entries.reduce((s, e) => s + e.debit, 0);
        const total_credit = entries.reduce((s, e) => s + e.credit, 0);
        return { entries, total_debit, total_credit, solde: total_debit - total_credit };
      }

      const entries: EcritureComptable[] = data || [];
      const total_debit = entries.reduce((s, e) => s + e.debit, 0);
      const total_credit = entries.reduce((s, e) => s + e.credit, 0);
      return { entries, total_debit, total_credit, solde: total_debit - total_credit };
    },
    enabled: !!companyId && !!compteCode,
  });
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export function useBalance(companyId?: string) {
  return useQuery({
    queryKey: ['balance', companyId],
    queryFn: async (): Promise<BalanceEntry[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('v_balance')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

// ─── Bilan ─────────────────────────────────────────────────────────────────────

export function useBilan(companyId?: string) {
  return useQuery({
    queryKey: ['bilan', companyId],
    queryFn: async (): Promise<BilanEntry[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('v_bilan')
        .select('*')
        .eq('company_id', companyId)
        .order('classe');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

// ─── Compte de Résultat ────────────────────────────────────────────────────────

export function useCPR(companyId?: string) {
  return useQuery({
    queryKey: ['cpr', companyId],
    queryFn: async (): Promise<CPREntry[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('v_cpr')
        .select('*')
        .eq('company_id', companyId)
        .order('code');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export const NATURE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Actif: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Passif: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  Charge: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Produit: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Hors_bilan: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export const CLASSE_LABELS: Record<number, string> = {
  1: 'Classe 1 — Capitaux propres',
  2: 'Classe 2 — Immobilisations',
  3: 'Classe 3 — Stocks',
  4: 'Classe 4 — Créances et dettes',
  5: 'Classe 5 — Trésorerie',
  6: 'Classe 6 — Charges',
  7: 'Classe 7 — Produits',
  8: 'Classe 8 — Comptes spéciaux',
  9: 'Classe 9 — Engagements hors bilan',
};

export const CLASSE_SHORT_LABELS: Record<number, string> = {
  1: '1 — Capitaux',
  2: '2 — Immobilisations',
  3: '3 — Stocks',
  4: '4 — Créances/Dettes',
  5: '5 — Trésorerie',
  6: '6 — Charges',
  7: '7 — Produits',
};

export const JOURNAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Ventes: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Achats: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Banque: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Caisse: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  OD: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  A_Nouveaux: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  TVA: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export function formatMontant(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `(${formatted})` : formatted;
}
