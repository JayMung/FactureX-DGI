"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  FileBarChart,
  Printer,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatUsd } from '@/utils/dgiUtils';

type ReportType = 'X' | 'Z' | 'A';

interface ReportData {
  type: ReportType;
  generatedAt: string;
  period: { start: string; end: string } | null;
  sales: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    count: number;
  };
  byPaymentMethod: {
    cash: number;
    card: number;
    mobile: number;
  };
  byTVAGroup: {
    a: { ht: number; tva: number; count: number };
    b: { ht: number; tva: number; count: number };
    c: { ht: number; tva: number; count: number };
  };
  transactions: Array<{
    id: string;
    factureNumber: string;
    date: string;
    client: string;
    ht: number;
    tva: number;
    ttc: number;
    mode: string;
  }>;
}

const TVA_RATES: Record<string, number> = {
  A: 0,
  B: 0.10,
  C: 0.16,
};

export default function Rapports() {
  usePageSetup({
    title: 'Rapports',
    subtitle: 'Rapports fiscaux DGI — X, Z, A',
  });

  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('X');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      // Query factures for the period
      const startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);

      const { data: factures, error } = await supabase
        .from('factures')
        .select(`
          id,
          facture_number,
          date_emission,
          subtotal,
          total_general,
          statut,
          devise,
          clients(nom)
        `)
        .gte('date_emission', startDate.toISOString())
        .lte('date_emission', endDate.toISOString())
        .eq('statut', 'payee');

      if (error) throw error;

      // Also get current open session for X report
      const { data: openSession } = await supabase
        .from('caisse_sessions')
        .select('*')
        .eq('statut', 'ouverte')
        .order('opened_at', { ascending: false })
        .limit(1)
        .single();

      const transactions: ReportData['transactions'] = [];
      let totalHT = 0;
      let totalTVA = 0;
      let totalTTC = 0;
      const byPayment: ReportData['byPaymentMethod'] = { cash: 0, card: 0, mobile: 0 };
      const byTVA: ReportData['byTVAGroup'] = {
        a: { ht: 0, tva: 0, count: 0 },
        b: { ht: 0, tva: 0, count: 0 },
        c: { ht: 0, tva: 0, count: 0 },
      };

      for (const f of (factures || [])) {
        const ht = f.subtotal || 0;
        const ttc = f.total_general || 0;
        const tva = ttc - ht;
        totalHT += ht;
        totalTVA += tva;
        totalTTC += ttc;

        transactions.push({
          id: f.id,
          factureNumber: f.facture_number,
          date: f.date_emission,
          client: (f.clients as any)?.nom || 'Client anonyme',
          ht,
          tva,
          ttc,
          mode: 'USD',
        });

        // Group by TVA (simplified - assume group C)
        byTVA.c.ht += ht;
        byTVA.c.tva += tva;
        byTVA.c.count += 1;
      }

      // For X report: only current session's sales
      // For Z report: today's sales
      // For A report: all sales in the date range

      let sessionTransactions = transactions;
      if (reportType === 'X' && openSession) {
        // Only sales after session opened
        const sessionStart = new Date(openSession.opened_at);
        sessionTransactions = transactions.filter(t => new Date(t.date) >= sessionStart);
      } else if (reportType === 'Z') {
        // Only today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        sessionTransactions = transactions.filter(t => new Date(t.date) >= today);
      }

      const sessionHT = sessionTransactions.reduce((s, t) => s + t.ht, 0);
      const sessionTVA = sessionTransactions.reduce((s, t) => s + t.tva, 0);
      const sessionTTC = sessionTransactions.reduce((s, t) => s + t.ttc, 0);

      const report: ReportData = {
        type: reportType,
        generatedAt: new Date().toISOString(),
        period: { start: dateFrom, end: dateTo },
        sales: {
          totalHT: sessionHT,
          totalTVA: sessionTVA,
          totalTTC: sessionTTC,
          count: sessionTransactions.length,
        },
        byPaymentMethod: byPayment,
        byTVAGroup: byTVA,
        transactions: sessionTransactions,
      };

      setReportData(report);
    } catch (err: any) {
      showError('Erreur lors de la génération du rapport');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, reportType]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const handleExportPDF = async () => {
    if (!reportData) return;
    setExporting(true);
    try {
      // Generate simple text-based report for print
      const reportText = `
═══════════════════════════════════════════════
  FACTURESMART — RAPPORT FISCAL DGI
  Type: ${reportData.type}
  Période: ${reportData.period?.start} au ${reportData.period?.end}
  Généré le: ${new Date(reportData.generatedAt).toLocaleString('fr-FR')}
═══════════════════════════════════════════════

RÉSUMÉ
─────────────────────────────────────────────
Nombre de transactions : ${reportData.sales.count}
Chiffre d'affaires HTVA : ${reportData.sales.totalHT.toFixed(2)} USD
TVA collectée (16%)    : ${reportData.sales.totalTVA.toFixed(2)} USD
Total TTC              : ${reportData.sales.totalTTC.toFixed(2)} USD

TVA PAR GROUPE
─────────────────────────────────────────────
Groupe A (0%)  : HT ${reportData.byTVAGroup.a.ht.toFixed(2)} | TVA ${reportData.byTVAGroup.a.tva.toFixed(2)}
Groupe B (10%)  : HT ${reportData.byTVAGroup.b.ht.toFixed(2)} | TVA ${reportData.byTVAGroup.b.tva.toFixed(2)}
Groupe C (16%)  : HT ${reportData.byTVAGroup.c.ht.toFixed(2)} | TVA ${reportData.byTVAGroup.c.tva.toFixed(2)}

DÉTAIL DES TRANSACTIONS
─────────────────────────────────────────────
${reportData.transactions.map(t =>
  `${t.factureNumber} | ${new Date(t.date).toLocaleDateString('fr-FR')} | ${t.client.substring(0, 20).padEnd(20)} | HT:${t.ht.toFixed(2)} | TVA:${t.tva.toFixed(2)} | TTC:${t.ttc.toFixed(2)}`
).join('\n')}

═══════════════════════════════════════════════
  Document généré par FactureSmart — DGI RDC
═══════════════════════════════════════════════
      `.trim();

      const winPrint = window.open('', '', 'width=700,height=900');
      if (!winPrint) {
        showError('Autorisez les popups pour imprimer');
        return;
      }
      winPrint.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Rapport ${reportData.type} — FactureSmart</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; white-space: pre-wrap; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${reportText}</body>
</html>`);
      winPrint.document.close();
      winPrint.focus();
      setTimeout(() => { winPrint.print(); winPrint.close(); }, 300);
      showSuccess(`Rapport ${reportData.type} exporté`);
      setExportDialogOpen(false);
    } catch (err) {
      showError('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'X':
        return 'Rapport de session — ventes depuis l\'ouverture de la caisse';
      case 'Z':
        return 'Rapport journalier — toutes les ventes de la journée';
      case 'A':
        return 'Rapport mensuel — toutes les ventes du mois en cours';
    }
  };

  const formatCDF = (n: number) => {
    return `${n.toLocaleString('fr-FR')} USD`;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports DGI</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Rapports fiscaux — X (session), Z (journalier), A (mensuel)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateReport}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            {reportData && (
              <Button
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Printer className="h-4 w-4" />
                Exporter / Imprimer
              </Button>
            )}
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-gray-700">Type de rapport :</span>
            {(['X', 'Z', 'A'] as ReportType[]).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                  reportType === type
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Rapport {type}
              </button>
            ))}
            <div className="ml-auto text-sm text-gray-500 italic">
              {getReportDescription()}
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Du</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Au</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
          <Button
            onClick={generateReport}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileBarChart className="h-4 w-4" />
            )}
            Générer le rapport
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="h-6 bg-gray-100 rounded animate-pulse w-1/3 mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-50 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Transactions</span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900 font-mono">
                  {reportData.sales.count}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">HTVA</span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-700 font-mono">
                  {formatUsd(reportData.sales.totalHT)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">TVA (16%)</span>
                </div>
                <p className="text-2xl font-extrabold text-amber-700 font-mono">
                  {formatUsd(reportData.sales.totalTVA)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xs font-extrabold">TTC</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-700">TOTAL TTC</span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-800 font-mono">
                  {formatUsd(reportData.sales.totalTTC)}
                </p>
              </div>
            </div>

            {/* TVA Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {(['a', 'b', 'c'] as const).map(group => (
                <div key={group} className={`rounded-xl border p-4 ${
                  group === 'a' ? 'border-gray-200 bg-gray-50' :
                  group === 'b' ? 'border-amber-200 bg-amber-50' :
                  'border-emerald-200 bg-emerald-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-extrabold text-sm ${
                      group === 'a' ? 'text-gray-700' :
                      group === 'b' ? 'text-amber-700' :
                      'text-emerald-700'
                    }`}>
                      Groupe {group.toUpperCase()} ({group === 'a' ? '0%' : group === 'b' ? '10%' : '16%'})
                    </span>
                    <Badge className={`text-xs font-bold ${
                      group === 'a' ? 'bg-gray-200 text-gray-700' :
                      group === 'b' ? 'bg-amber-200 text-amber-700' :
                      'bg-emerald-200 text-emerald-700'
                    }`}>
                      {reportData.byTVAGroup[group].count} articles
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">HTVA</span>
                      <span className={`font-bold font-mono ${
                        group === 'a' ? 'text-gray-700' :
                        group === 'b' ? 'text-amber-700' :
                        'text-emerald-700'
                      }`}>
                        {formatUsd(reportData.byTVAGroup[group].ht)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">TVA</span>
                      <span className={`font-bold font-mono ${
                        group === 'a' ? 'text-gray-700' :
                        group === 'b' ? 'text-amber-700' :
                        'text-emerald-700'
                      }`}>
                        {formatUsd(reportData.byTVAGroup[group].tva)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Détail des transactions</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {reportData.transactions.length} transaction{reportData.transactions.length !== 1 ? 's' : ''} — {reportData.period?.start} au {reportData.period?.end}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold text-gray-700">N° Facture</TableHead>
                    <TableHead className="font-bold text-gray-700">Date</TableHead>
                    <TableHead className="font-bold text-gray-700">Client</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">HTVA</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">TVA (16%)</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="font-medium text-gray-700">Aucune transaction</p>
                          <p className="text-xs text-gray-400">Aucune vente trouvée pour cette période</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.transactions.map(t => (
                      <TableRow key={t.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <span className="font-mono text-sm font-bold text-emerald-700">
                            {t.factureNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700">
                            {new Date(t.date).toLocaleDateString('fr-FR')}
                          </span>
                          <p className="text-xs text-gray-400">
                            {new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-900">{t.client}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-gray-700">
                          {formatUsd(t.ht)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-amber-600">
                          {formatUsd(t.tva)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-gray-900">
                          {formatUsd(t.ttc)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Report Footer */}
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 text-center">
              <p className="text-xs text-gray-400">
                Rapport {reportData.type} généré le {new Date(reportData.generatedAt).toLocaleString('fr-FR')} —
                FactureSmart — DGI RDC — Tous les montants en USD
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Générez un rapport pour voir les résultats</p>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Exporter le rapport</DialogTitle>
            <DialogDescription>
              Imprimez ou sauvegardez le rapport {reportType} au format texte.
            </DialogDescription>
          </DialogHeader>

          {reportData && (
            <div className="space-y-3 py-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-bold">Rapport {reportData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Période</span>
                  <span className="font-bold">{reportData.period?.start} → {reportData.period?.end}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transactions</span>
                  <span className="font-bold">{reportData.sales.count}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-700 font-bold">Total TTC</span>
                  <span className="font-extrabold text-emerald-700">{formatUsd(reportData.sales.totalTTC)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Ce rapport estdestiné à un usage interne. Pour la soumission DGI officielle, utilisez les formulaires réglementaires.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)} className="gap-2">
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {exporting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Imprimer / Exporter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
