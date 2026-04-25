"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatUsd, formatCdf } from '@/utils/dgiUtils';

export interface KpiData {
  totalFactures: number;
  totalClients: number;
  chiffreAffairesUsd: number;
  chiffreAffairesCdf: number;
  facturesEnRetard: number;
  montantEnRetardUsd: number;
}

export interface ChartDataPoint {
  month: string;
  count: number;
  amount: number;
}

export interface RecentFacture {
  id: string;
  facture_number: string;
  client_nom: string;
  statut: string;
  total_general: number;
  devise: string;
  date_emission: string;
}

export interface AlerteRetard {
  id: string;
  facture_number: string;
  client_nom: string;
  total_general: number;
  devise: string;
  date_echeance: string;
  jours_retard: number;
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: 'facture' | 'client' | 'paiement';
  icon: string;
}

export const useCompanyDashboard = () => {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentFactures, setRecentFactures] = useState<RecentFacture[]>([]);
  const [alertesRetard, setAlertesRetard] = useState<AlerteRetard[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      const currentYear = today.getFullYear();
      const startOfYear = `${currentYear}-01-01`;

      // --- KPI: Fetch all needed stats in parallel ---
      const [
        clientsResult,
        facturesResult,
        facturesEnRetardResult,
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase
          .from('factures')
          .select(`
            id, facture_number, statut, total_general, devise,
            date_emission, date_echeance, created_at
          `)
          .gte('date_emission', startOfYear),
        // Factures en retard: échéance passée et statut non-payé
        supabase
          .from('factures')
          .select(`
            id, facture_number, total_general, devise,
            date_echeance, clients!inner(nom)
          `)
          .eq('statut', 'en_attente')
          .lt('date_echeance', today.toISOString().split('T')[0]),
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (facturesResult.error) throw facturesResult.error;
      if (facturesEnRetardResult.error) throw facturesEnRetardResult.error;

      const allFactures = facturesResult.data || [];
      const enRetardFactures = facturesEnRetardResult.data || [];

      // KPI totals
      const totalFactures = allFactures.length;
      const totalClients = clientsResult.count || 0;

      // Chiffre d'affaires = factures validées ou payées
      const facturesValidees = allFactures.filter(
        (f: any) => f.statut === 'validee' || f.statut === 'payee'
      );
      const chiffreAffairesUsd = facturesValidees
        .filter((f: any) => f.devise === 'USD')
        .reduce((sum: number, f: any) => sum + (f.total_general || 0), 0);
      const chiffreAffairesCdf = facturesValidees
        .filter((f: any) => f.devise === 'CDF')
        .reduce((sum: number, f: any) => sum + (f.total_general || 0), 0);

      const montantEnRetardUsd = enRetardFactures
        .filter((f: any) => f.devise === 'USD')
        .reduce((sum: number, f: any) => sum + (f.total_general || 0), 0);

      setKpi({
        totalFactures,
        totalClients,
        chiffreAffairesUsd,
        chiffreAffairesCdf,
        facturesEnRetard: enRetardFactures.length,
        montantEnRetardUsd,
      });

      // --- Chart: invoices per month ---
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const chart: ChartDataPoint[] = months.map((month, idx) => {
        const monthFactures = allFactures.filter((f: any) => {
          const d = new Date(f.date_emission);
          return d.getMonth() === idx && d.getFullYear() === currentYear;
        });
        return {
          month,
          count: monthFactures.length,
          amount: monthFactures.reduce((sum: number, f: any) => sum + (f.total_general || 0), 0),
        };
      });
      setChartData(chart);

      // --- Recent Factures (last 5) ---
      const { data: recentWithClients } = await supabase
        .from('factures')
        .select(`
          id, facture_number, statut, total_general, devise, date_emission,
          clients!inner(nom)
        `)
        .in('statut', ['validee', 'payee', 'en_attente', 'brouillon'])
        .order('date_emission', { ascending: false })
        .limit(5);

      const recent: RecentFacture[] = (recentWithClients || []).map((f: any) => ({
        id: f.id,
        facture_number: f.facture_number,
        client_nom: f.clients?.nom || '—',
        statut: f.statut,
        total_general: f.total_general,
        devise: f.devise,
        date_emission: f.date_emission,
      }));
      setRecentFactures(recent);

      // --- Alertes Retard ---
      const alertes: AlerteRetard[] = enRetardFactures.slice(0, 5).map((f: any) => {
        const echeance = new Date(f.date_echeance);
        const jours_retard = Math.floor((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: f.id,
          facture_number: f.facture_number,
          client_nom: (f.clients as any)?.nom || '—',
          total_general: f.total_general,
          devise: f.devise,
          date_echeance: f.date_echeance,
          jours_retard,
        };
      });
      setAlertesRetard(alertes);

      // --- Recent Activity (from activity_log table if exists) ---
      try {
        const { data: activityData } = await supabase
          .from('activity_log')
          .select('id, description, created_at, entity_type')
          .order('created_at', { ascending: false })
          .limit(5);

        if (activityData && activityData.length > 0) {
          const activities: RecentActivity[] = activityData.map((a: any) => ({
            id: a.id,
            description: a.description,
            timestamp: a.created_at,
            type: a.entity_type === 'factures' ? 'facture' :
                  a.entity_type === 'clients' ? 'client' : 'paiement',
            icon: a.entity_type === 'factures' ? '📄' :
                  a.entity_type === 'clients' ? '👤' : '💰',
          }));
          setRecentActivity(activities);
        } else {
          // Fallback: generate from recent factures
          setRecentActivity(
            recent.slice(0, 3).map((f) => ({
              id: f.id,
              description: `Facture ${f.facture_number} — ${f.client_nom}`,
              timestamp: f.date_emission,
              type: 'facture' as const,
              icon: '📄',
            }))
          );
        }
      } catch {
        // activity_log might not exist — use factura fallback
        setRecentActivity(
          recent.slice(0, 3).map((f) => ({
            id: f.id,
            description: `Facture ${f.facture_number} — ${f.client_nom}`,
            timestamp: f.date_emission,
            type: 'facture' as const,
            icon: '📄',
          }))
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    kpi,
    chartData,
    recentFactures,
    alertesRetard,
    recentActivity,
    isLoading,
    error,
    refetch: fetchData,
    formatUsd,
    formatCdf,
  };
};
