"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Wallet,
  Unlock,
  Lock,
  Plus,
  ArrowLeft,
  Check,
  X,
  Banknote,
  DollarSign,
  History,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatUsd, formatCdf } from '@/utils/dgiUtils';

interface BilletageRow {
  denomination: number;
  quantite: number;
}

const DEFAULT_BILLETAGE: BilletageRow[] = [
  { denomination: 10000, quantite: 0 },
  { denomination: 5000, quantite: 0 },
  { denomination: 2000, quantite: 0 },
  { denomination: 1000, quantite: 0 },
  { denomination: 500, quantite: 0 },
  { denomination: 200, quantite: 0 },
  { denomination: 100, quantite: 0 },
  { denomination: 50, quantite: 0 },
];

const BILL_DENOMINATIONS = [10000, 5000, 2000, 1000, 500];
const COIN_DENOMINATIONS = [200, 100, 50];

export default function CaisseOuverture() {
  usePageSetup({
    title: 'Ouverture de Caisse',
    subtitle: 'Détailler le fonds de caisse initial',
  });

  const navigate = useNavigate();
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [devise, setDevise] = useState<'CDF' | 'USD'>('CDF');
  const [notes, setNotes] = useState('');
  const [billetage, setBilletage] = useState<BilletageRow[]>(DEFAULT_BILLETAGE);
  const [previousSessions, setPreviousSessions] = useState<any[]>([]);

  useEffect(() => {
    checkActiveSession();
    loadPreviousSessions();
  }, []);

  const checkActiveSession = async () => {
    try {
      const { data } = await supabase
        .from('caisse_sessions')
        .select('id')
        .eq('statut', 'ouverte')
        .limit(1)
        .single();
      setSessionActive(!!data);
    } catch (err) {
      setSessionActive(false);
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousSessions = async () => {
    try {
      const { data } = await supabase
        .from('caisse_sessions')
        .select('*')
        .eq('statut', 'fermee')
        .order('closed_at', { ascending: false })
        .limit(10);
      setPreviousSessions(data || []);
    } catch (err) {
      // silent
    }
  };

  const totalBilletage = billetage.reduce(
    (sum, row) => sum + row.denomination * row.quantite,
    0
  );

  const updateQuantite = (denomination: number, quantite: number) => {
    setBilletage(prev =>
      prev.map(row =>
        row.denomination === denomination ? { ...row, quantite: Math.max(0, quantite || 0) } : row
      )
    );
  };

  const resetForm = () => {
    setBilletage(DEFAULT_BILLETAGE.map(r => ({ ...r, quantite: 0 })));
    setNotes('');
    setDevise('CDF');
  };

  const handleOpenSession = async () => {
    if (sessionActive) {
      showError('Une session de caisse est déjà ouverte.');
      return;
    }

    if (totalBilletage <= 0) {
      showError('Le fonds de caisse doit être supérieur à 0.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const billetageJson = billetage
        .filter(r => r.quantite > 0)
        .map(r => ({
          denomination: r.denomination,
          quantite: r.quantite,
          sous_total: r.denomination * r.quantite,
        }));

      const devis = devise;
      const montant = devise === 'USD' ? totalBilletage : 0;
      const soldeOuvertureCdf = devise === 'CDF' ? totalBilletage : 0;
      const soldeOuvertureUsd = devise === 'USD' ? totalBilletage : 0;

      const { error } = await supabase.from('caisse_sessions').insert({
        user_id: user.id,
        opened_by: user.id,
        solde_ouverture: devise === 'USD' ? totalBilletage : 0,
        solde_ouverture_cdf: soldeOuvertureCdf,
        solde_ouverture_usd: soldeOuvertureUsd,
        devise_ouverture: devise,
        billetage_ouverture: billetageJson,
        total_ventes: 0,
        total_especes: 0,
        total_carte: 0,
        total_mobile: 0,
        total_sorties: 0,
        statut: 'ouverte',
        notes: notes || null,
      });

      if (error) throw error;

      showSuccess('Caisse ouverte avec succès !');
      setConfirmDialog(false);
      resetForm();
      navigate('/caisse');
    } catch (err: any) {
      showError(err.message || 'Erreur lors de l\'ouverture de la caisse');
    } finally {
      setSaving(false);
    }
  };

  const isBill = (denom: number) => denom >= 500;
  const isCoin = (denom: number) => denom < 500;

  const rowsBillets = billetage.filter(r => isBill(r.denomination));
  const rowsPieces = billetage.filter(r => isCoin(r.denomination));

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Ouverture de Caisse</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Définissez le fonds de caisse initial pour démarrer la journée
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setHistoryDialog(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Dernières ouvertures
            </Button>
          </div>
        </div>

        {sessionActive ? (
          /* Session déjà ouverte */
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Caisse déjà ouverte</h3>
            <p className="text-sm text-amber-600 mb-6">
              Une session de caisse est actuellement active. Vous devez la fermer avant d'en ouvrir une nouvelle.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate('/caisse')} variant="outline">
                Voir la session active
              </Button>
              <Button onClick={() => navigate('/caisse/fermeture')} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                <Lock className="h-4 w-4" />
                Fermer la caisse
              </Button>
            </div>
          </div>
        ) : (
          /* Formulaire d'ouverture */
          <>
            {/* Devise selector */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Fonds de caisse initial</h2>
                    <p className="text-xs text-gray-400">
                      Déclarez précisément les billets et pièces en caisse au démarrage
                    </p>
                  </div>
                </div>

                {/* Devise switch */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit mb-5">
                  <button
                    onClick={() => setDevise('CDF')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      devise === 'CDF'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    FC (CDF)
                  </button>
                  <button
                    onClick={() => setDevise('USD')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      devise === 'USD'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    $ (USD)
                  </button>
                </div>

                {/* Billetage Billets */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                      Billets
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {rowsBillets.map(row => (
                        <div
                          key={row.denomination}
                          className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-4 text-center hover:border-emerald-200 transition-colors"
                        >
                          <div className="text-xs text-gray-400 mb-1 font-mono">× {row.denomination.toLocaleString('fr-FR')}</div>
                          <input
                            type="number"
                            min="0"
                            value={row.quantite || ''}
                            onChange={e => updateQuantite(row.denomination, parseInt(e.target.value) || 0)}
                            className="w-full h-12 text-center text-xl font-extrabold font-mono bg-transparent border-0 border-b-2 border-gray-100 focus:border-emerald-400 focus:outline-none focus:ring-0"
                            placeholder="0"
                          />
                          <div className="text-xs text-emerald-600 font-mono font-bold mt-1">
                            {(row.denomination * row.quantite).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billetage Pièces */}
                  {rowsPieces.some(r => r.quantite > 0) && (
                    <div>
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                        Pièces
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {rowsPieces.filter(r => r.quantite > 0).map(row => (
                          <div
                            key={row.denomination}
                            className="bg-amber-50/50 rounded-xl border border-amber-100 p-3 text-center"
                          >
                            <div className="text-xs text-amber-500 mb-1 font-mono">× {row.denomination.toLocaleString('fr-FR')}</div>
                            <div className="text-lg font-extrabold font-mono text-amber-700">{row.quantite}</div>
                            <div className="text-xs text-amber-600 font-mono font-bold mt-1">
                              = {(row.denomination * row.quantite).toLocaleString('fr-FR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-800">
                          Total fonds de caisse
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold font-mono text-emerald-700">
                          {devise === 'CDF' ? formatCdf(totalBilletage) : formatUsd(totalBilletage)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-5">
                  <Label htmlFor="ouverture_notes">Notes / observations (optionnel)</Label>
                  <Textarea
                    id="ouverture_notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ex: Fonds de caisse du matin, après comptage..."
                    className="mt-2"
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/caisse')}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Annuler
                  </Button>
                  <Button
                    onClick={() => setConfirmDialog(true)}
                    disabled={totalBilletage <= 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                  >
                    <Unlock className="h-4 w-4" />
                    Ouvrir la caisse
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dernières ouvertures (history preview) */}
        {previousSessions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-gray-500" />
                Dernières sessions fermées
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold text-gray-700 text-xs">Date</TableHead>
                    <TableHead className="font-bold text-gray-700 text-xs text-right">Ouverture</TableHead>
                    <TableHead className="font-bold text-gray-700 text-xs text-right">Ventes</TableHead>
                    <TableHead className="font-bold text-gray-700 text-xs text-right">Fermeture</TableHead>
                    <TableHead className="font-bold text-gray-700 text-xs text-center">Durée</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previousSessions.slice(0, 5).map(s => (
                    <TableRow key={s.id} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-mono text-gray-700">
                        {new Date(s.opened_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-right">
                        {formatUsd(s.solde_ouverture)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-emerald-600 font-bold text-right">
                        {formatUsd(s.total_ventes)}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-right">
                        {s.solde_fermeture !== null
                          ? formatUsd(s.solde_fermeture)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-center text-gray-400">
                        {s.opened_at && s.closed_at
                          ? (() => {
                              const diff = new Date(s.closed_at).getTime() - new Date(s.opened_at).getTime();
                              const h = Math.floor(diff / 3600000);
                              const m = Math.floor((diff % 3600000) / 60000);
                              return `${h}h ${m}m`;
                            })()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-emerald-600" />
              Confirmer l'ouverture
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'ouvrir une session de caisse avec le fonds initial suivant :
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-600 mb-1">Fonds de caisse initial</p>
              <p className="text-2xl font-extrabold font-mono text-emerald-700">
                {devise === 'CDF' ? formatCdf(totalBilletage) : formatUsd(totalBilletage)}
              </p>
            </div>

            {billetage.filter(r => r.quantite > 0).length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Détail du billetage</p>
                <div className="grid grid-cols-2 gap-2">
                  {billetage.filter(r => r.quantite > 0).map(row => (
                    <div key={row.denomination} className="flex justify-between text-sm">
                      <span className="text-gray-600">× {row.quantite} × {row.denomination.toLocaleString('fr-FR')}</span>
                      <span className="font-mono font-bold text-gray-800">
                        {(row.denomination * row.quantite).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <X className="h-4 w-4" />
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOpenSession}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirmer l'ouverture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-600" />
              Historique des ouvertures
            </DialogTitle>
            <DialogDescription>
              Les 10 dernières sessions de caisse réalisées
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-gray-700 text-xs">Date</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs text-right">Ouverture</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs text-right">Ventes</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs text-right">Fermeture</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previousSessions.map(s => (
                  <TableRow key={s.id} className="hover:bg-gray-50">
                    <TableCell className="text-xs">
                      <div className="font-mono text-gray-900">
                        {new Date(s.opened_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(s.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-right">
                      {s.billetage_ouverture
                        ? formatUsd(
                            (s.billetage_ouverture as any[]).reduce(
                              (acc: number, r: any) => acc + (r.sous_total || 0),
                              0
                            )
                          )
                        : formatUsd(s.solde_ouverture)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-emerald-600 font-bold text-right">
                      {formatUsd(s.total_ventes)}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-right">
                      {s.solde_fermeture !== null ? formatUsd(s.solde_fermeture) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]">
                        <Lock className="w-3 h-3 mr-1" />
                        Fermée
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
