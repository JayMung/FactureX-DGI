"use client";

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

type PaymentMode = 'cash' | 'mpesa' | 'airtel' | 'card' | 'all';

interface TransactionSummary {
  id: string;
  facture_number: string;
  created_at: string;
  total_general: number;
  mode_paiement: string;
  cashier_name: string;
  item_count: number;
  statut: string;
}

export default function POSHistorique() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [cashierFilter, setCashierFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMode>('all');

  const PAGE_SIZE = 6;

  // Date range based on filter
  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        const y = subDays(now, 1);
        return { start: startOfDay(y), end: endOfDay(y) };
      case 'week':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case 'month':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    }
  }, [dateFilter]);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      let query = supabase
        .from('factures')
        .select('id, facture_number, created_at, total_general, mode_paiement, statut, created_by', { count: 'exact' })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Get user profiles for cashier names
      const userIds = [...new Set((data || []).map(t => t.created_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap: Record<string, string> = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || '未知'; });

      // Get item counts per facture
      const factureIds = (data || []).map(t => t.id);
      const { data: items } = await supabase
        .from('facture_items')
        .select('facture_id')
        .in('facture_id', factureIds);

      const itemCountMap: Record<string, number> = {};
      (items || []).forEach(i => {
        itemCountMap[i.facture_id] = (itemCountMap[i.facture_id] || 0) + 1;
      });

      const enriched: TransactionSummary[] = (data || []).map(t => ({
        id: t.id,
        facture_number: t.facture_number,
        created_at: t.created_at,
        total_general: t.total_general || 0,
        mode_paiement: t.mode_paiement || 'cash',
        cashier_name: profileMap[t.created_by] || 'Caisse POS',
        item_count: itemCountMap[t.id] || 0,
        statut: t.statut || 'validee',
      }));

      // Apply cashier filter
      let filtered = enriched;
      if (cashierFilter !== 'all') {
        filtered = filtered.filter(t => t.cashier_name === cashierFilter);
      }
      if (paymentFilter !== 'all') {
        filtered = filtered.filter(t => t.mode_paiement === paymentFilter);
      }

      setTotalCount(filtered.length);
      setTransactions(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
    } catch (err: any) {
      showError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [getDateRange, cashierFilter, paymentFilter, currentPage]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Summary stats
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const todayStats = useCallback(() => {
    const { start, end } = getDateRange();
    // We'll compute these from filtered transactions
    const totalSales = transactions.length;
    const caHT = transactions.reduce((s, t) => s + t.total_general, 0);
    const ticketMoyen = totalSales > 0 ? caHT / totalSales : 0;
    const paymentModes: Record<string, number> = {};
    transactions.forEach(t => {
      paymentModes[t.mode_paiement] = (paymentModes[t.mode_paiement] || 0) + 1;
    });
    const topPayment = Object.entries(paymentModes).sort((a, b) => b[1] - a[1])[0];
    return { totalSales, caHT, ticketMoyen, topPayment: topPayment?.[0] || 'cash' };
  }, [transactions, getDateRange]);

  const stats = todayStats();

  // Payment summary
  const paymentSummary = {
    cash: transactions.filter(t => t.mode_paiement === 'cash').reduce((s, t) => s + t.total_general, 0),
    mpesa: transactions.filter(t => t.mode_paiement === 'mpesa').reduce((s, t) => s + t.total_general, 0),
    airtel: transactions.filter(t => t.mode_paiement === 'airtel').reduce((s, t) => s + t.total_general, 0),
    card: transactions.filter(t => t.mode_paiement === 'card').reduce((s, t) => s + t.total_general, 0),
  };

  const paymentCounts = {
    cash: transactions.filter(t => t.mode_paiement === 'cash').length,
    mpesa: transactions.filter(t => t.mode_paiement === 'mpesa').length,
    airtel: transactions.filter(t => t.mode_paiement === 'airtel').length,
    card: transactions.filter(t => t.mode_paiement === 'card').length,
  };

  const uniqueCashiers = [...new Set(transactions.map(t => t.cashier_name))];

  const getPaymentLabel = (mode: string) => {
    switch (mode) {
      case 'cash': return 'Espèces';
      case 'mpesa': return 'M-Pesa';
      case 'airtel': return 'Airtel Money';
      case 'card': return 'Carte';
      default: return mode;
    }
  };

  const getPaymentIcon = (mode: string) => {
    switch (mode) {
      case 'cash': return 'ri-money-dollar-circle-line';
      case 'mpesa': return 'ri-water-percent-line';
      case 'airtel': return 'ri-smartphone-line';
      case 'card': return 'ri-bank-card-line';
      default: return 'ri-circle-fill';
    }
  };

  const getPaymentColor = (mode: string) => {
    switch (mode) {
      case 'cash': return { bg: 'bg-green-50', icon: 'text-green-600' };
      case 'mpesa': return { bg: 'bg-orange-50', icon: 'text-orange-500' };
      case 'airtel': return { bg: 'bg-red-50', icon: 'text-red-500' };
      case 'card': return { bg: 'bg-blue-50', icon: 'text-blue-500' };
      default: return { bg: 'bg-gray-50', icon: 'text-gray-600' };
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pos')}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <span className="text-lg"><i className="ri-arrow-left-line" /></span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm"><i className="ri-file-chart-line" /></span>
                </div>
                <span className="text-base font-extrabold text-gray-900">Facture<span className="text-emerald-600">Smart</span></span>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">Historique</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
                <span><i className="ri-calendar-line" /></span>
                {format(new Date(), 'dd MMMM yyyy')}
              </div>
              <Button
                variant="outline"
                className="text-xs font-semibold flex items-center gap-2"
              >
                <span className="text-sm"><i className="ri-download-line" /></span>
                Exporter
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Ventes du jour</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.totalSales}</div>
              <div className="text-xs text-green-600 font-semibold mt-1">+12 vs hier</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">CA HT du jour</div>
              <div className="text-2xl font-extrabold text-gray-900 font-mono">{stats.caHT.toFixed(2)} $</div>
              <div className="text-xs text-green-600 font-semibold mt-1">+8.5% vs hier</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Ticket moyen</div>
              <div className="text-2xl font-extrabold text-gray-900 font-mono">{stats.ticketMoyen.toFixed(2)} $</div>
              <div className="text-xs text-gray-400 mt-1">→ stable</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Top payment</div>
              <div className="text-2xl font-extrabold text-gray-900">{getPaymentLabel(stats.topPayment)}</div>
              <div className="text-xs text-gray-400 mt-1">{paymentCounts[stats.topPayment as keyof typeof paymentCounts] || 0} transactions</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-emerald-500"><i className="ri-filter-3-line" /></span>
                Filtres
              </div>

              <select
                value={dateFilter}
                onChange={e => { setDateFilter(e.target.value as any); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
              </select>

              <select
                value={cashierFilter}
                onChange={e => { setCashierFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                <option value="all">Tous les caissiers</option>
                {uniqueCashiers.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={paymentFilter}
                onChange={e => { setPaymentFilter(e.target.value as PaymentMode); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                <option value="all">Tous les modes</option>
                <option value="cash">Espèces</option>
                <option value="mpesa">M-Pesa</option>
                <option value="airtel">Airtel Money</option>
                <option value="card">Carte</option>
              </select>

              <Button
                onClick={() => loadTransactions()}
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
              >
                <span className="text-sm mr-1"><i className="ri-refresh-line" /></span>
                Actualiser
              </Button>
            </div>
          </div>

          {/* Payment summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['cash', 'mpesa', 'airtel', 'card'] as const).map(mode => {
              const colors = getPaymentColor(mode);
              return (
                <div key={mode} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-lg ${colors.icon}`}><i className={getPaymentIcon(mode)} /></span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{getPaymentLabel(mode)}</div>
                    <div className="text-base font-extrabold text-gray-900 font-mono">
                      {paymentSummary[mode].toFixed(2)} $
                    </div>
                    <div className="text-[10px] text-gray-400">{paymentCounts[mode]} transactions</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transactions table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Transactions</span>
              <span className="text-xs text-gray-400">{totalCount} résultats</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="text-left px-5 py-3">N°</th>
                    <th className="text-left px-3 py-3">Heure</th>
                    <th className="text-left px-3 py-3">Caissier</th>
                    <th className="text-left px-3 py-3">Articles</th>
                    <th className="text-left px-3 py-3">Paiement</th>
                    <th className="text-right px-5 py-3">Montant</th>
                    <th className="text-center px-3 py-3">Statut</th>
                    <th className="text-center px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                        Chargement...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                        Aucune transaction trouvée
                      </td>
                    </tr>
                  ) : (
                    transactions.map(t => {
                      const modeColors = getPaymentColor(t.mode_paiement);
                      return (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-gray-900">{t.facture_number}</td>
                          <td className="px-3 py-3 font-mono text-gray-600">{format(new Date(t.created_at), 'HH:mm')}</td>
                          <td className="px-3 py-3 font-semibold text-gray-900">{t.cashier_name}</td>
                          <td className="px-3 py-3 text-gray-600">{t.item_count} article{t.item_count !== 1 ? 's' : ''}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${modeColors.bg} ${modeColors.icon}`}>
                              <span><i className={getPaymentIcon(t.mode_paiement)} /></span>
                              {getPaymentLabel(t.mode_paiement)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-extrabold text-gray-900 font-mono">{t.total_general.toFixed(2)} $</td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <span className="text-[8px]"><i className="ri-check-line" /></span>
                              Validée
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => navigate(`/factures/view/${t.id}`)}
                              className="text-gray-400 hover:text-emerald-600 transition-colors"
                            >
                              <span className="text-base"><i className="ri-eye-line" /></span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Affichage {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)}-{Math.min(currentPage * PAGE_SIZE, totalCount)} sur {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  <span><i className="ri-arrow-left-s-line" /></span>
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === currentPage
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 3 && (
                  <>
                    {currentPage > 3 && (
                      <>
                        <span className="text-gray-400">...</span>
                        <button
                          onClick={() => setCurrentPage(currentPage)}
                          className="w-8 h-8 rounded-lg bg-emerald-500 text-white text-xs font-bold"
                        >
                          {currentPage}
                        </button>
                      </>
                    )}
                  </>
                )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  <span><i className="ri-arrow-right-s-line" /></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
