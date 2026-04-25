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
  Lock,
  Unlock,
  Plus,
  ArrowLeft,
  Check,
  X,
  Banknote,
  CreditCard,
  Smartphone,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calculator,
  Search,
  DollarSign,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatUsd } from '@/utils/dgiUtils';

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

export default function CaisseFermeture() {
  usePageSetup({
    title: 'Fermeture de Caisse',
    subtitle: 'Comptage final et clôture de la session',
  });

  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [billetage, setBilletage] = useState<BilletageRow[]>(DEFAULT_BILLETAGE);
  const [ecartComment, setEcartComment] = useState('');
  const [devise, setDevise] = useState<'CDF' | 'USD'>('USD');

  useEffect(() => {
    loadActiveSession();
  }, []);

  const loadActiveSession = async () => {
    try {
      const { data, error } = await supabase
        .from('caisse_sessions')
        .select('*')
        .eq('statut', 'ouverte')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSession(data);

      if (data?.devise_ouverture) {
        setDevise(data.devise_ouverture);
      }

      // Précharger le billetage avec les quantités de l'ouverture
      if (data?.billetage_ouverture) {
        const ouvertRows: BilletageRow[] = (data.billetage_ouverture as any[]).map((r: any) => ({
          denomination: r.denomination,
          quantite: r.quantite || 0,
        }));
        const merged = DEFAULT_BILLETAGE.map(def => {
          const existing = ouvertRows.find(o => o.denomination === def.denomination);
          return existing || { ...def };
        });
        setBilletage(merged);
      }
    } catch (err: any) {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantite = (denomination: number, quantite: number) => {
    setBilletage(prev =>
      prev.map(row =>
        row.denomination === denomination ? { ...row, quantite: Math.max(0, quantite || 0) } : row
      )
    );
  };

  const totalComptePhysique = billetage.reduce(
    (sum, row) => sum + row.denomination * row.quantite,
    0
  );

  // Solde théorique = solde_ouverture + ventes - sorties
  const soldeTheorique =
    (session?.solde_ouverture || 0) +
    (session?.total_ventes || 0) -
    (session?.total_sorties || 0);

  const ecart = totalComptePhysique - soldeTheorique;
  const hasEcart = Math.abs(ecart) > 0.01;

  const isBill = (denom: number) => denom >= 500;
  const rowsBillets = billetage.filter(r => isBill(r.denomination));
  const rowsPieces = billetage.filter(r => !isBill(r.denomination));

  const handleCloseSession = async () => {
    if (!session) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const billetageJson = billetage
        .filter(r => r.quantite > 0)
        .map(r => ({
          denomination: r.denomination,
          quantite: r.quantite,
          sous_total: r.denomination * r.quantite,
        }));

      const updateData: any = {
        statut: 'fermee',
        total_especes: session.total_especes || 0,
        total_carte: session.total_carte || 0,
        total_mobile: session.total_mobile || 0,
        solde_fermeture: totalComptePhysique,
        billetage_fermeture: billetageJson,
        ecart: ecart,
        closed_by: user?.id || null,
        closed_at: new Date().toISOString(),
        notes_fermeture: hasEcart ? ecartComment || `Écart de ${formatUsd(Math.abs(ecart))}` : null,
      };

      const { error } = await supabase
        .from('caisse_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (error) throw error;

      showSuccess('Caisse fermée avec succès !');
      setConfirmDialog(false);
      navigate('/caisse');
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la fermeture de la caisse');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/caisse')}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Fermeture de Caisse</h1>
          </div>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Unlock className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Aucune session active</h3>
            <p className="text-sm text-amber-600 mb-6">
              Vous devez d'abord ouvrir une session de caisse avant de pouvoir la fermer.
            </p>
            <Button onClick={() => navigate('/caisse/ouverture')} className="gap-2">
              <Plus className="h-4 w-4" />
              Ouvrir une session
            </Button>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Fermeture de Caisse</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Session ouverte le {new Date(session.opened_at).toLocaleDateString('fr-FR')} à{' '}
                {new Date(session.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Recap — Soldes théoriques */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ouverture</p>
              <p className="text-lg font-extrabold font-mono text-gray-900 mt-1">{formatUsd(session.solde_ouverture)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ventes</p>
              <p className="text-lg font-extrabold font-mono text-emerald-700 mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                {formatUsd(session.total_ventes)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sorties</p>
              <p className="text-lg font-extrabold font-mono text-red-600 mt-1">
                <TrendingDown className="h-3 w-3 inline mr-1" />
                {formatUsd(session.total_sorties)}
              </p>
            </CardContent>
          </Card>
          <Card className={hasEcart ? 'ring-2 ring-amber-400' : 'ring-2 ring-emerald-200'}>
            <CardContent className="p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Solde théorique</p>
              <p className="text-lg font-extrabold font-mono text-gray-900 mt-1">
                <Calculator className="h-3 w-3 inline mr-1 opacity-60" />
                {formatUsd(soldeTheorique)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Détail des paiements */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Détail des encaissements</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800 font-medium">Espèces</span>
                </div>
                <span className="font-bold font-mono text-emerald-700">{formatUsd(session.total_especes || 0)}</span>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-800 font-medium">Carte</span>
                </div>
                <span className="font-bold font-mono text-purple-700">{formatUsd(session.total_carte || 0)}</span>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800 font-medium">Mobile Money</span>
                </div>
                <span className="font-bold font-mono text-amber-700">{formatUsd(session.total_mobile || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comptage physique */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Comptage physique</h2>
                <p className="text-xs text-gray-400">
                  Saisissez le nombre de billets et pièces effectivement en caisse
                </p>
              </div>
            </div>

            {/* Billets */}
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
              Billets
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
              {rowsBillets.map(row => (
                <div
                  key={row.denomination}
                  className={`rounded-xl border p-4 text-center transition-colors ${
                    row.quantite > 0
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-gray-200 bg-gray-50/50'
                  }`}
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

            {/* Pièces (si non nulles) */}
            {rowsPieces.some(r => r.quantite > 0) && (
              <>
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                  Pièces
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-5">
                  {rowsPieces.filter(r => r.quantite > 0).map(row => (
                    <div key={row.denomination} className="bg-amber-50/50 rounded-xl border border-amber-100 p-3 text-center">
                      <div className="text-xs text-amber-500 mb-1 font-mono">× {row.denomination.toLocaleString('fr-FR')}</div>
                      <div className="text-lg font-extrabold font-mono text-amber-700">{row.quantite}</div>
                      <div className="text-xs text-amber-600 font-mono font-bold mt-1">
                        = {(row.denomination * row.quantite).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Comparaison: Solde théorique vs Comptage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Solde théorique</p>
                <p className="text-xl font-extrabold font-mono text-gray-700">{formatUsd(soldeTheorique)}</p>
              </div>
              <div className={`rounded-2xl p-5 border-2 ${
                hasEcart
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Comptage physique</p>
                <p className={`text-xl font-extrabold font-mono ${
                  hasEcart ? 'text-amber-700' : 'text-emerald-700'
                }`}>{formatUsd(totalComptePhysique)}</p>
              </div>
            </div>

            {/* Écart */}
            {hasEcart && (
              <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800 mb-1">
                      Écart détecté : {formatUsd(Math.abs(ecart))} ({ecart > 0 ? 'Excédent' : 'Déficit'})
                    </p>
                    <p className="text-xs text-amber-600 mb-3">
                      Le comptage physique ne correspond pas au solde théorique. Veuillez expliquer cet écart.
                    </p>
                    <Label htmlFor="ecart_comment">Explication de l'écart</Label>
                    <Textarea
                      id="ecart_comment"
                      value={ecartComment}
                      onChange={e => setEcartComment(e.target.value)}
                      placeholder="Expliquez la raison de cet écart (ex: remise client, erreur de calcul, etc.)"
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
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
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm"
          >
            <Lock className="h-4 w-4" />
            Fermer la caisse
          </Button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              Confirmer la fermeture
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de clôturer cette session de caisse. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4">
              <span className="text-sm text-gray-600">Session ouverte</span>
              <span className="text-sm font-mono text-gray-900">
                {new Date(session.opened_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4">
              <span className="text-sm text-gray-600">Solde théorique</span>
              <span className="text-sm font-extrabold font-mono">{formatUsd(soldeTheorique)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4">
              <span className="text-sm text-gray-600">Comptage physique</span>
              <span className={`text-sm font-extrabold font-mono ${
                hasEcart ? 'text-amber-700' : 'text-emerald-700'
              }`}>{formatUsd(totalComptePhysique)}</span>
            </div>
            <div className={`flex justify-between items-center p-4 rounded-xl ${
              hasEcart ? 'bg-amber-50' : 'bg-emerald-50'
            }`}>
              <span className={`text-sm font-bold ${
                hasEcart ? 'text-amber-700' : 'text-emerald-700'
              }`}>{hasEcart ? 'Écart' : 'Aucun écart'}</span>
              <span className={`text-sm font-extrabold font-mono ${
                hasEcart ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {hasEcart
                  ? `${ecart > 0 ? '+' : ''}${formatUsd(ecart)}`
                  : '✓'}
              </span>
            </div>
            {hasEcart && ecartComment && (
              <div className="bg-amber-50/50 rounded-xl p-4 text-xs text-amber-800">
                {ecartComment}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <X className="h-4 w-4" />
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseSession}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Confirmer la fermeture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
