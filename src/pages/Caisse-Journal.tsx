"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wallet,
  ArrowLeft,
  Search,
  Banknote,
  CreditCard,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  Eye,
  ArrowUpDown,
  Calendar,
  Filter,
  Printer,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { formatUsd } from '@/utils/dgiUtils';

interface JournalEntry {
  id: string;
  type: 'vente' | 'encaissement' | 'sortie' | 'depense';
  montant: number;
  mode_paiement: 'especes' | 'carte' | 'mobile' | 'mixte';
  reference: string;
  description: string;
  date: string;
  created_at?: string;
  facture_id?: string;
  client_nom?: string;
  session_id?: string;
}

interface CaisseSession {
  id: string;
  opened_at: string;
  solde_ouverture: number;
  total_ventes: number;
  total_especes: number;
  total_carte: number;
  total_mobile: number;
  total_sorties: number;
  statut: string;
}

type PeriodFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export default function CaisseJournal() {
  usePageSetup({
    title: 'Journal de Caisse',
    subtitle: 'Détail des opérations de la journée',
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CaisseSession | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [entryCount, setEntryCount] = useState({ income: 0, expense: 0 });

  const getDateRange = (): { start: string; end: string } => {
    const now = new Date();
    const end = now.toISOString();
    let start: Date;

    switch (periodFilter) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        start = new Date(0);
    }

    return { start: start.toISOString(), end };
  };

  useEffect(() => {
    loadData();
  }, [periodFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Charger la session active
      const { data: activeSession } = await supabase
        .from('caisse_sessions')
        .select('*')
        .eq('statut', 'ouverte')
        .limit(1)
        .maybeSingle();

      if (activeSession) {
        setSession(activeSession);
      } else {
        // Charger la dernière session fermée
        const { data: lastClosed } = await supabase
          .from('caisse_sessions')
          .select('*')
          .eq('statut', 'fermee')
          .order('closed_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setSession(lastClosed || null);
      }

      // Charger les factures comme entrées du journal
      // On fusionne: factures (ventes), et les futures tables d'opérations caisse
      const { data: factures, error } = await supabase
        .from('factures')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const journalEntries: JournalEntry[] = [];

      // Transformer les factures en entrées de journal
      (factures || []).forEach(f => {
        const total = f.montant_ttc || f.total_general || 0;
        const mode = (f.mode_paiement || 'especes') as JournalEntry['mode_paiement'];

        journalEntries.push({
          id: `facture-${f.id}`,
          type: 'vente',
          montant: total,
          mode_paiement: mode,
          reference: f.facture_number || `F-${f.id.slice(0, 8)}`,
          description: `Facture ${f.facture_number || ''} — ${f.client?.nom || f.clients?.nom || 'Client'}`,
          date: f.created_at || f.date_emission,
          facture_id: f.id,
          client_nom: f.client?.nom || f.clients?.nom || 'Client',
          session_id: f.session_id || undefined,
        });
      });

      setEntries(journalEntries);
      calculateTotals(journalEntries);
    } catch (err: any) {
      showError('Erreur lors du chargement du journal');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: JournalEntry[]) => {
    const income = items.filter(e => e.type === 'vente' || e.type === 'encaissement');
    const expenses = items.filter(e => e.type === 'sortie' || e.type === 'depense');
    setIncomeTotal(income.reduce((sum, e) => sum + e.montant, 0));
    setExpenseTotal(expenses.reduce((sum, e) => sum + e.montant, 0));
    setEntryCount({ income: income.length, expense: expenses.length });
  };

  // Filtres
  const filteredEntries = entries.filter(e => {
    if (searchQuery && !e.reference.toLowerCase().includes(searchQuery.toLowerCase()) && !e.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (paymentFilter !== 'all' && e.mode_paiement !== paymentFilter) return false;
    return true;
  });

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'especes': return <Banknote className="h-4 w-4 text-emerald-600" />;
      case 'carte': return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'mobile': return <Clock className="h-4 w-4 text-amber-600" />;
      default: return <Banknote className="h-4 w-4 text-gray-400" />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'especes': return 'Espèces';
      case 'carte': return 'Carte';
      case 'mobile': return 'Mobile Money';
      case 'mixte': return 'Mixte';
      default: return mode;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'vente':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Vente</Badge>;
      case 'encaissement':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Encaissement</Badge>;
      case 'sortie':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Sortie</Badge>;
      case 'depense':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Dépense</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'today': return "Aujourd'hui";
      case 'yesterday': return 'Hier';
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'all': return 'Tout';
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/caisse')}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Journal de Caisse</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {getPeriodLabel()} · {filteredEntries.length} opération{filteredEntries.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>

        {/* Session Banner */}
        {session && (
          <div className={`rounded-2xl p-5 ${
            session.statut === 'ouverte'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white'
              : 'bg-gray-800 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Wallet className={`h-5 w-5 ${session.statut === 'ouverte' ? 'text-white' : 'text-gray-300'}`} />
                </div>
                <div>
                  <p className="text-xs opacity-80">
                    {session.statut === 'ouverte' ? 'Session active' : 'Dernière session fermée'}
                  </p>
                  <p className="text-lg font-extrabold">{formatUsd(session.solde_ouverture + session.total_ventes)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60">
                  {session.statut === 'ouverte'
                    ? `Ouverte à ${new Date(session.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                    : `Fermée le ${new Date(session.closed_at || session.opened_at).toLocaleDateString('fr-FR')}`}
                </p>
                <div className="flex gap-4 mt-1 text-xs font-bold">
                  <span className="opacity-80">{formatUsd(session.total_especes)} espèces</span>
                  <span className="opacity-80">{formatUsd(session.total_carte)} carte</span>
                  <span className="opacity-80">{formatUsd(session.total_mobile)} mobile</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Entrées</p>
                  <p className="text-xl font-extrabold text-emerald-700 font-mono mt-1">{formatUsd(incomeTotal)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{entryCount.income} opération{entryCount.income !== 1 ? 's' : ''}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sorties</p>
                  <p className="text-xl font-extrabold text-red-600 font-mono mt-1">{formatUsd(expenseTotal)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{entryCount.expense} opération{entryCount.expense !== 1 ? 's' : ''}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Solde net</p>
                  <p className={`text-xl font-extrabold font-mono mt-1 ${
                    incomeTotal - expenseTotal >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {formatUsd(incomeTotal - expenseTotal)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(['today', 'yesterday', 'week', 'month', 'all'] as PeriodFilter[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  periodFilter === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === 'today' ? "Aujourd'hui" : p === 'yesterday' ? 'Hier' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Tout'}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="vente">Ventes</SelectItem>
              <SelectItem value="encaissement">Encaissements</SelectItem>
              <SelectItem value="sortie">Sorties</SelectItem>
              <SelectItem value="depense">Dépenses</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment filter */}
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Mode de paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modes</SelectItem>
              <SelectItem value="especes">Espèces</SelectItem>
              <SelectItem value="carte">Carte</SelectItem>
              <SelectItem value="mobile">Mobile Money</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une référence..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Journal Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold text-gray-700 text-xs">Heure</TableHead>
                <TableHead className="font-bold text-gray-700 text-xs">Type</TableHead>
                <TableHead className="font-bold text-gray-700 text-xs">Référence</TableHead>
                <TableHead className="font-bold text-gray-700 text-xs">Description</TableHead>
                <TableHead className="font-bold text-gray-700 text-xs">Mode</TableHead>
                <TableHead className="font-bold text-gray-700 text-xs text-right">Montant</TableHead>
                <TableHead className="font-bold text-gray-700 text-xs text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-700">
                        Aucune opération pour cette période
                      </p>
                      <p className="text-xs text-gray-400">
                        Essayez de modifier les filtres ou la période
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map(entry => (
                  <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <span className="text-xs font-mono text-gray-700">
                        {new Date(entry.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(entry.type)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono font-bold text-gray-900">
                        {entry.reference}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600 truncate max-w-[200px] block">
                        {entry.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getModeIcon(entry.mode_paiement)}
                        <span className="text-xs text-gray-500">{getModeLabel(entry.mode_paiement)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-xs font-extrabold font-mono ${
                        entry.type === 'vente' || entry.type === 'encaissement'
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}>
                        {entry.type === 'vente' || entry.type === 'encaissement' ? '+' : '-'}
                        {formatUsd(entry.montant)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setDetailDialog(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Détail de l'opération
            </DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Type</span>
                  {getTypeBadge(selectedEntry.type)}
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Référence</span>
                  <span className="text-xs font-bold font-mono">{selectedEntry.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Montant</span>
                  <span className={`text-sm font-extrabold font-mono ${
                    selectedEntry.type === 'vente' || selectedEntry.type === 'encaissement'
                      ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {selectedEntry.type === 'vente' || selectedEntry.type === 'encaissement' ? '+' : '-'}
                    {formatUsd(selectedEntry.montant)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Mode de paiement</span>
                  <div className="flex items-center gap-1.5">
                    {getModeIcon(selectedEntry.mode_paiement)}
                    <span className="text-xs">{getModeLabel(selectedEntry.mode_paiement)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Date</span>
                  <span className="text-xs text-gray-700">
                    {new Date(selectedEntry.date).toLocaleString('fr-FR')}
                  </span>
                </div>
                {selectedEntry.client_nom && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Client</span>
                    <span className="text-xs font-medium">{selectedEntry.client_nom}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400">
                {selectedEntry.description}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
