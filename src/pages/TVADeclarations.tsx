"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
  RefreshCw,
  Printer,
  FileDown,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Types ---

interface TVADeclarationSummary {
  mois: number;
  annee: number;
  nombre_fv: number;
  nombre_ev: number;
  nombre_ft: number;
  nombre_total: number;
  total_htva: number;
  total_tva_a: number;
  total_tva_b: number;
  total_tva_c: number;
  total_tva: number;
  total_ttc: number;
}

interface DeclarationDB {
  id: string;
  declarant_id: string;
  mois: number;
  annee: number;
  nombre_fv: number;
  nombre_ev: number;
  nombre_ft: number;
  nombre_total: number;
  total_htva: number;
  total_tva_a: number;
  total_tva_b: number;
  total_tva_c: number;
  total_tva: number;
  total_ttc: number;
  statut: 'draft' | 'submitted' | 'validated' | 'rejected';
  submitted_at: string | null;
  validated_at: string | null;
  notes: string | null;
  created_at: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const TVA_RATES = {
  A: { label: 'Groupe A (16%)', rate: 16, color: 'bg-blue-100 text-blue-800' },
  B: { label: 'Groupe B (8%)', rate: 8, color: 'bg-green-100 text-green-800' },
  C: { label: 'Groupe C (0%)', rate: 0, color: 'bg-gray-100 text-gray-800' },
};

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  submitted: { label: 'Soumise', variant: 'default' },
  validated: { label: 'Validée', variant: 'outline' },
  rejected: { label: 'Rejetée', variant: 'destructive' },
};

// --- Helpers ---

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'USD' }).format(val);
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat('fr-CD').format(val);
}

// --- Component ---

export default function TVADeclarations() {
  const { companyId, userRole, isLoading: setupLoading } = usePageSetup();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current period
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Data
  const [summary, setSummary] = useState<TVADeclarationSummary | null>(null);
  const [declarations, setDeclarations] = useState<DeclarationDB[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'comptable';

  // Fetch declarations for the year
  const fetchDeclarations = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Get declarant for this company
      const { data: declarants, error: declErr } = await supabase
        .from('declarants')
        .select('id')
        .eq('organization_id', companyId)
        .limit(1);

      if (declErr) throw declErr;

      const declarantId = declarants?.[0]?.id;

      if (declarantId) {
        // 2. Get existing declarations for the year
        const { data: declData, error: declDataErr } = await supabase
          .from('dgi_declarations')
          .select('*')
          .eq('declarant_id', declarantId)
          .eq('annee', selectedYear)
          .order('mois', { ascending: false });

        if (declDataErr) throw declDataErr;
        setDeclarations(declData || []);
      }

      // 3. Calculate TVA summary for selected month
      const { data: calcData, error: calcErr } = await supabase
        .rpc('calculer_declaration_tva', {
          p_company_id: companyId,
          p_mois: selectedMonth + 1,
          p_annee: selectedYear,
        });

      if (calcErr) {
        // RPC might not exist yet or be accessible — fallback to manual calculation
        console.warn('RPC calculer_declaration_tva failed:', calcErr);
        await fetchManualSummary(companyId);
      } else {
        setSummary(calcData as unknown as TVADeclarationSummary);
      }
    } catch (err: any) {
      console.error('Error fetching TVA data:', err);
      setError(err.message || 'Erreur lors du chargement des données TVA');
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedYear, selectedMonth]);

  // Fallback: manual calculation from factures table
  const fetchManualSummary = async (companyId: string) => {
    const monthStart = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const nextMonth = selectedMonth + 1 === 12
      ? `${selectedYear + 1}-01-01`
      : `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`;

    const { data: invoices, error } = await supabase
      .from('factures')
      .select('montant_ht, montant_tva, montant_ttc, groupe_tva, type_facture_dgi')
      .eq('company_id', companyId)
      .gte('date_emission', monthStart)
      .lt('date_emission', nextMonth)
      .neq('statut', 'brouillon');

    if (error) throw error;

    const summary: TVADeclarationSummary = {
      mois: selectedMonth + 1,
      annee: selectedYear,
      nombre_fv: 0,
      nombre_ev: 0,
      nombre_ft: 0,
      nombre_total: 0,
      total_htva: 0,
      total_tva_a: 0,
      total_tva_b: 0,
      total_tva_c: 0,
      total_tva: 0,
      total_ttc: 0,
    };

    for (const inv of invoices || []) {
      const ht = Number(inv.montant_ht || 0);
      const tva = Number(inv.montant_tva || 0);
      const ttc = Number(inv.montant_ttc || 0);

      summary.total_htva += ht;
      summary.total_ttc += ttc;
      summary.total_tva += tva;

      // Dispatch TVA by group
      if (inv.groupe_tva === 'A') summary.total_tva_a += tva;
      else if (inv.groupe_tva === 'B') summary.total_tva_b += tva;
      else summary.total_tva_c += tva;

      if (inv.type_facture_dgi === 'FV') summary.nombre_fv++;
      else if (inv.type_facture_dgi === 'EV') summary.nombre_ev++;
      else if (inv.type_facture_dgi === 'FT') summary.nombre_ft++;
      summary.nombre_total++;
    }

    setSummary(summary);
  };

  useEffect(() => {
    if (!setupLoading && companyId) {
      fetchDeclarations();
    }
  }, [setupLoading, companyId, fetchDeclarations]);

  // Générer la déclaration
  const handleGenerateDeclaration = async () => {
    if (!summary || !companyId) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Find declarant for this company
      const { data: declarants } = await supabase
        .from('declarants')
        .select('id')
        .eq('organization_id', companyId)
        .limit(1);

      let declarantId = declarants?.[0]?.id;

      // Create declarant if not found
      if (!declarantId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        const { data: newDecl, error: newDeclErr } = await supabase
          .from('declarants')
          .insert({
            organization_id: companyId,
            nom: profile?.full_name || 'Déclarant principal',
            email: (await supabase.auth.getUser()).data.user?.email,
          })
          .select('id')
          .single();

        if (newDeclErr) throw newDeclErr;
        declarantId = newDecl.id;
      }

      // Check if declaration already exists
      const { data: existing } = await supabase
        .from('dgi_declarations')
        .select('id')
        .eq('declarant_id', declarantId)
        .eq('mois', summary.mois)
        .eq('annee', summary.annee);

      if (existing && existing.length > 0) {
        setError('Une déclaration existe déjà pour cette période.');
        setIsGenerating(false);
        return;
      }

      // Insert declaration
      const { error: insertErr } = await supabase
        .from('dgi_declarations')
        .insert({
          declarant_id: declarantId,
          mois: summary.mois,
          annee: summary.annee,
          nombre_fv: summary.nombre_fv,
          nombre_ev: summary.nombre_ev,
          nombre_ft: summary.nombre_ft,
          nombre_total: summary.nombre_total,
          total_htva: summary.total_htva,
          total_tva_a: summary.total_tva_a,
          total_tva_b: summary.total_tva_b,
          total_tva_c: summary.total_tva_c,
          total_tva: summary.total_tva,
          total_ttc: summary.total_ttc,
          statut: 'draft',
        });

      if (insertErr) throw insertErr;

      await fetchDeclarations();
    } catch (err: any) {
      console.error('Error generating declaration:', err);
      setError(err.message || 'Erreur lors de la génération de la déclaration');
    } finally {
      setIsGenerating(false);
    }
  };

  // Soumettre à la DGI
  const handleSubmit = async (declarationId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error: updateErr } = await supabase
        .from('dgi_declarations')
        .update({
          statut: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', declarationId);

      if (updateErr) throw updateErr;

      await fetchDeclarations();
    } catch (err: any) {
      console.error('Error submitting declaration:', err);
      setError(err.message || 'Erreur lors de la soumission à la DGI');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!summary) return;

    const headers = ['Période', 'Type', 'Nombre', 'HTVA', 'TVA A (16%)', 'TVA B (8%)', 'TVA C (0%)', 'Total TVA', 'TTC'];
    const typeRows = [
      ['FV - Factures Vente', summary.nombre_fv, summary.total_htva, summary.total_tva_a, summary.total_tva_b, summary.total_tva_c, summary.total_tva, summary.total_ttc],
      ['EV - Avoirs', summary.nombre_ev, 0, 0, 0, 0, 0, 0],
      ['FT - Travaux', summary.nombre_ft, 0, 0, 0, 0, 0, 0],
    ];

    const rows = typeRows.map(([type, count, htva, tvaA, tvaB, tvaC, tvaTotal, ttc]) =>
      [
        `${MONTHS[summary.mois - 1]} ${summary.annee}`,
        type,
        count,
        htva,
        tvaA,
        tvaB,
        tvaC,
        tvaTotal,
        ttc,
      ].join(',')
    );

    const csv = [
      `Déclaration TVA - ${MONTHS[summary.mois - 1]} ${summary.annee}`,
      '',
      headers.join(','),
      ...rows,
      '',
      `Total général,${summary.nombre_total},${summary.total_htva},${summary.total_tva_a},${summary.total_tva_b},${summary.total_tva_c},${summary.total_tva},${summary.total_ttc}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `declaration_tva_${summary.annee}_${String(summary.mois).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Navigate months
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // Find declaration for selected month
  const currentDeclaration = declarations.find(
    d => d.mois === selectedMonth + 1 && d.annee === selectedYear
  );

  // --- Render ---

  if (setupLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Déclarations TVA
            </h1>
            <p className="text-muted-foreground mt-1">
              Rapports fiscaux mensuels pour la Direction Générale des Impôts (DGI)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Exercice {selectedYear}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Month Navigator + Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[200px]">
              <p className="text-lg font-semibold">{MONTHS[selectedMonth]}</p>
              <p className="text-sm text-muted-foreground">{selectedYear}</p>
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v))}
            >
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canEdit && summary && !currentDeclaration && (
              <Button onClick={handleGenerateDeclaration} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Générer déclaration
              </Button>
            )}

            {summary && (
              <Button variant="outline" onClick={handleExportCSV}>
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}

            <Button variant="outline" onClick={fetchDeclarations} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-60 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total HTVA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(summary.total_htva)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total TVA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_tva)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A: {formatCurrency(summary.total_tva_a)} | B: {formatCurrency(summary.total_tva_b)} | C: {formatCurrency(summary.total_tva_c)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total TTC
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(summary.total_ttc)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{summary.nombre_total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      FV: {summary.nombre_fv} | EV: {summary.nombre_ev} | FT: {summary.nombre_ft}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TVA Breakdown by Group */}
            {summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Décomposition TVA par Groupe
                  </CardTitle>
                  <CardDescription>
                    Détail des taux appliqués selon la classification DGI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Groupe</TableHead>
                        <TableHead>Taux</TableHead>
                        <TableHead className="text-right">Base HTVA</TableHead>
                        <TableHead className="text-right">Montant TVA</TableHead>
                        <TableHead className="text-right">% Total TVA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(TVA_RATES).map(([group, info]) => {
                        const tvaKey = `total_tva_${group.toLowerCase()}` as keyof TVADeclarationSummary;
                        const htKey = 'total_htva';
                        const tvaAmount = Number(summary[tvaKey] || 0);
                        const pct = summary.total_tva > 0
                          ? ((tvaAmount / summary.total_tva) * 100).toFixed(1)
                          : '0.0';

                        return (
                          <TableRow key={group}>
                            <TableCell>
                              <Badge variant="outline" className={info.color}>
                                Groupe {group}
                              </Badge>
                            </TableCell>
                            <TableCell>{info.rate}%</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(summary.total_htva)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {formatCurrency(tvaAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${group === 'A' ? 'bg-blue-500' : group === 'B' ? 'bg-green-500' : 'bg-gray-400'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-sm">{pct}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-semibold bg-gray-50">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.total_htva)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.total_tva)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Period Status / Declaration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Statut de la Période
                </CardTitle>
                <CardDescription>
                  {MONTHS[selectedMonth]} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentDeclaration ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {currentDeclaration.statut === 'draft' && <Clock className="h-5 w-5 text-yellow-500" />}
                        {currentDeclaration.statut === 'submitted' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                        {currentDeclaration.statut === 'validated' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {currentDeclaration.statut === 'rejected' && <Ban className="h-5 w-5 text-red-500" />}
                        <div>
                          <p className="font-medium">
                            Déclaration {STATUS_BADGE[currentDeclaration.statut]?.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Créée le {new Date(currentDeclaration.created_at).toLocaleDateString('fr-FR')}
                            {currentDeclaration.submitted_at && ` · Soumise le ${new Date(currentDeclaration.submitted_at).toLocaleDateString('fr-FR')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEdit && currentDeclaration.statut === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSubmit(currentDeclaration.id)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Soumettre à la DGI
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={handleExportCSV}>
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimer
                        </Button>
                      </div>
                    </div>

                    {/* Declaration detail */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">FV (Ventes)</p>
                        <p className="font-semibold">{formatNumber(currentDeclaration.nombre_fv)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">EV (Avoirs)</p>
                        <p className="font-semibold">{formatNumber(currentDeclaration.nombre_ev)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">FT (Travaux)</p>
                        <p className="font-semibold">{formatNumber(currentDeclaration.nombre_ft)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total documents</p>
                        <p className="font-semibold">{formatNumber(currentDeclaration.nombre_total)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    {summary && summary.nombre_total > 0 ? (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Aucune déclaration générée pour cette période.
                        </p>
                        {canEdit && (
                          <Button onClick={handleGenerateDeclaration} disabled={isGenerating}>
                            {isGenerating ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4 mr-2" />
                            )}
                            Générer la déclaration
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <p className="text-muted-foreground">
                          Aucune facture trouvée pour cette période.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historical Declarations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Historique des Déclarations ({selectedYear})
                </CardTitle>
                <CardDescription>
                  Toutes les déclarations soumises pour l'exercice {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {declarations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune déclaration pour {selectedYear}.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Période</TableHead>
                        <TableHead className="text-right">Documents</TableHead>
                        <TableHead className="text-right">HTVA</TableHead>
                        <TableHead className="text-right">TVA</TableHead>
                        <TableHead className="text-right">TTC</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {declarations.map(decl => (
                        <TableRow key={decl.id}>
                          <TableCell className="font-medium">
                            {MONTHS[decl.mois - 1]} {decl.annee}
                          </TableCell>
                          <TableCell className="text-right">{decl.nombre_total}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(decl.total_htva)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(decl.total_tva)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(decl.total_ttc)}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGE[decl.statut]?.variant}>
                              {STATUS_BADGE[decl.statut]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={handleExportCSV}>
                                <Download className="h-4 w-4" />
                              </Button>
                              {canEdit && decl.statut === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSubmit(decl.id)}
                                  disabled={isSubmitting}
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
