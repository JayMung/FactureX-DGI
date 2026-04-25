"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '@/hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMouvementsComptes } from '@/hooks/useMouvementsComptes';
import { ArrowLeft, CheckCircle2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

function formatCDF(n: number) {
  return n.toLocaleString('fr-FR') + ' CDF';
}

type OperationType = 'vente' | 'retrait' | 'depot' | 'remboursement';
type PaymentMode = 'espèces' | 'm-pesa' | 'airtel' | 'virement' | 'mixte';

interface Mouvement {
  id: string;
  time: string;
  type: OperationType;
  ref: string;
  libelle: string;
  mode: PaymentMode;
  entree: number;
  sortie: number;
  solde: number;
  cashier?: string;
}



const TYPE_COLORS: Record<OperationType, string> = {
  vente: 'bg-emerald-100 text-emerald-700',
  retrait: 'bg-red-100 text-red-700',
  depot: 'bg-purple-100 text-purple-700',
  remboursement: 'bg-orange-100 text-orange-700',
};

const MODE_LABELS: Record<PaymentMode, { label: string; emoji: string; color: string }> = {
  'espèces': { label: 'Esp.', emoji: '💵', color: 'bg-emerald-50 text-emerald-700' },
  'm-pesa': { label: 'M-Pesa', emoji: '📱', color: 'bg-blue-50 text-blue-700' },
  'airtel': { label: 'Airtel', emoji: '📲', color: 'bg-orange-50 text-orange-700' },
  'virement': { label: 'Virement', emoji: '🏦', color: 'bg-purple-50 text-purple-700' },
  'mixte': { label: 'Mixte', emoji: '🔄', color: 'bg-gray-100 text-gray-600' },
};

export default function CaisseL2Journal() {
  usePageSetup({ title: 'Journal de Caisse', subtitle: 'Historique des opérations du jour' });

  // Get companyId from current user's profile
  const { data: currentProfile } = useQuery({
    queryKey: ['my-profile-caisse'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('team_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
  });

  const companyId = currentProfile?.company_id;
  const { data: rawMouvements = [], isLoading: mouvementsLoading } = useMouvementsComptes(1, {});

  // Transform raw mouvements_comptes to Mouvement interface
  const liveMouvements: Mouvement[] = rawMouvements.map((m, idx) => {
    const isCredit = m.type_mouvement === 'credit';
    const running = rawMouvements.slice(0, idx + 1).reduce((s, x) => s + (x.type_mouvement === 'credit' ? Number(x.montant) : -Number(x.montant)), 0);
    return {
      id: m.id,
      time: new Date(m.date_mouvement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: isCredit ? 'vente' : 'retrait',
      ref: m.reference_externe || m.id.slice(0, 8).toUpperCase(),
      libelle: m.motif || (isCredit ? 'Entrée' : 'Sortie'),
      mode: 'espèces' as PaymentMode,
      entree: isCredit ? Number(m.montant) : 0,
      sortie: isCredit ? 0 : Number(m.montant),
      solde: running,
      cashier: undefined,
    };
  });

  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCashier, setFilterCashier] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime] = useState(new Date());

  useEffect(() => {
    if (liveMouvements.length > 0) {
      setMouvements(liveMouvements);
    }
  }, [liveMouvements]);

  const stats = {
    soldeActuel: liveMouvements.length > 0 ? liveMouvements[liveMouvements.length - 1].solde : 0,
    ventesJour: liveMouvements.filter(m => m.type === 'vente').reduce((s, m) => s + m.entree, 0),
    nbTransactions: liveMouvements.length,
    retraits: liveMouvements.filter(m => m.type === 'retrait').reduce((s, m) => s + m.sortie, 0),
    ouverture: liveMouvements.length > 0 ? liveMouvements[0].solde : 0,
    totalEsp: liveMouvements.filter(m => m.mode === 'espèces').reduce((s, m) => s + m.entree, 0),
    totalMp: liveMouvements.filter(m => m.mode === 'm-pesa').reduce((s, m) => s + m.entree, 0),
    totalAirtel: liveMouvements.filter(m => m.mode === 'airtel').reduce((s, m) => s + m.entree, 0),
    totalVirement: liveMouvements.filter(m => m.mode === 'virement').reduce((s, m) => s + m.entree, 0),
    totalMixte: 0,
  };

  const filteredMouvements = mouvements.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (filterCashier !== 'all' && m.cashier !== filterCashier) return false;
    return true;
  });

  const pageSize = 8;
  const totalPages = Math.ceil(filteredMouvements.length / pageSize);
  const paginated = filteredMouvements.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCashier]);

  const dateStr = currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-extrabold">FX</span>
                </div>
                <span className="text-base font-extrabold text-gray-900">Facture<span className="text-emerald-600">Smart</span></span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Caisse</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-3 py-1.5 rounded-lg hidden sm:block">{dateStr}</div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Session ouverte
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">

          {/* Live balance cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Solde actuel</div>
              <div className="text-xl font-extrabold text-emerald-600 font-mono">{formatCDF(stats.soldeActuel)}</div>
              <div className="text-xs text-gray-400 mt-1">En temps réel</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Ventes du jour</div>
              <div className="text-xl font-extrabold text-gray-900 font-mono">{formatCDF(stats.ventesJour)}</div>
              <div className="text-xs text-gray-400 mt-1">{stats.nbTransactions} transactions</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Retraits</div>
              <div className="text-xl font-extrabold text-red-600 font-mono">-{formatCDF(stats.retraits)}</div>
              <div className="text-xs text-gray-400 mt-1">5 retraits</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Ouverture</div>
              <div className="text-xl font-extrabold text-gray-900 font-mono">{formatCDF(stats.ouverture)}</div>
              <div className="text-xs text-gray-400 mt-1">Fonds initial</div>
            </div>
          </div>

          {/* Totals by payment mode */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-sm font-bold text-gray-900 mb-3">Totaux par mode de paiement</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">💵</div>
                <div className="text-xs text-gray-500 mb-1">Espèces</div>
                <div className="text-lg font-extrabold text-emerald-700 font-mono">{formatCDF(stats.totalEsp)}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">📱</div>
                <div className="text-xs text-gray-500 mb-1">M-Pesa</div>
                <div className="text-lg font-extrabold text-blue-700 font-mono">{formatCDF(stats.totalMp)}</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">📲</div>
                <div className="text-xs text-gray-500 mb-1">Airtel Money</div>
                <div className="text-lg font-extrabold text-orange-700 font-mono">{formatCDF(stats.totalAirtel)}</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🏦</div>
                <div className="text-xs text-gray-500 mb-1">Virement</div>
                <div className="text-lg font-extrabold text-purple-700 font-mono">{formatCDF(stats.totalVirement)}</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🔄</div>
                <div className="text-xs text-gray-500 mb-1">Mixte</div>
                <div className="text-lg font-extrabold text-gray-700 font-mono">{formatCDF(stats.totalMixte)}</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-emerald-500">☰</span> Filtrer
              </div>
              <select
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">Toutes opérations</option>
                <option value="vente">Ventes</option>
                <option value="retrait">Retraits</option>
                <option value="depot">Dépôts</option>
                <option value="remboursement">Remboursements</option>
              </select>
              <select
                value={filterCashier}
                onChange={e => { setFilterCashier(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">Tous opérateurs</option>
                <option value="Jean-Pierre K.">Jean-Pierre K.</option>
                <option value="Marie L.">Marie L.</option>
              </select>
              <Button variant="outline" size="sm" className="ml-auto gap-2 text-xs">
                <Download className="w-3.5 h-3.5" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Operations table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="text-left px-4 py-3">Heure</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Référence</th>
                    <th className="text-left px-4 py-3">Libellé</th>
                    <th className="text-center px-4 py-3">Mode</th>
                    <th className="text-right px-4 py-3">Entrée ($)</th>
                    <th className="text-right px-4 py-3">Sortie ($)</th>
                    <th className="text-right px-4 py-3">Solde ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900 whitespace-nowrap">{m.time}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_COLORS[m.type]}`}>
                          {m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500">{m.ref}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">{m.libelle}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${MODE_LABELS[m.mode].color}`}>
                          {MODE_LABELS[m.mode].emoji} {MODE_LABELS[m.mode].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        {m.entree > 0 ? m.entree.toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-600">
                        {m.sortie > 0 ? `-${m.sortie.toLocaleString('fr-FR')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{m.solde.toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">{filteredMouvements.length} opérations</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold disabled:opacity-40 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3 inline" /> Préc.
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page === currentPage ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50'} transition-colors`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold disabled:opacity-40 hover:bg-gray-200 transition-colors"
                >
                  Suiv. <ChevronRight className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
