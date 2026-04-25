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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  Landmark,
  Check,
  X,
  History,
  Plus,
  TrendingUp,
  TrendingDown,
  Search,
  Banknote,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatUsd, formatCdf } from '@/utils/dgiUtils';

interface CompteBancaire {
  id: string;
  nom: string;
  banque: string;
  numero_compte: string;
  devise: string;
  solde: number;
}

type Direction = 'caisse_vers_banque' | 'banque_vers_caisse';
type Devise = 'CDF' | 'USD';

export default function CaisseTransfert() {
  usePageSetup({
    title: 'Transfert Caisse ↔ Banque',
    subtitle: 'Gérer les mouvements entre caisse et comptes bancaires',
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comptes, setComptes] = useState<CompteBancaire[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  // Form state
  const [direction, setDirection] = useState<Direction>('caisse_vers_banque');
  const [compteId, setCompteId] = useState('');
  const [montant, setMontant] = useState('');
  const [devise, setDevise] = useState<Devise>('USD');
  const [motif, setMotif] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Vérifier s'il y a une session active
      const { data: activeSession } = await supabase
        .from('caisse_sessions')
        .select('id')
        .eq('statut', 'ouverte')
        .limit(1)
        .maybeSingle();
      setSessionActive(!!activeSession);

      // Charger les comptes bancaires
      const { data: comptesData } = await supabase
        .from('comptes_financiers')
        .select('*')
        .eq('type', 'banque')
        .order('nom');

      setComptes(comptesData || []);

      // Charger l'historique des transferts (depuis mouvements_comptes)
      const { data: mouvements } = await supabase
        .from('mouvements_comptes')
        .select('*')
        .in('categorie', ['transfert_caisse_banque', 'transfert_banque_caisse'])
        .order('date_mouvement', { ascending: false })
        .limit(50);

      setHistory(mouvements || []);
    } catch (err: any) {
      showError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const selectedCompte = comptes.find(c => c.id === compteId);

  const handleSubmit = async () => {
    const montantNum = parseFloat(montant);
    if (!montantNum || montantNum <= 0) {
      showError('Veuillez saisir un montant valide');
      return;
    }
    if (!compteId) {
      showError('Veuillez sélectionner un compte bancaire');
      return;
    }
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const categorie = direction === 'caisse_vers_banque'
        ? 'transfert_caisse_banque'
        : 'transfert_banque_caisse';

      const sens = direction === 'caisse_vers_banque' ? 'sortie' : 'entree';
      const description = direction === 'caisse_vers_banque'
        ? `Transfert caisse → ${selectedCompte?.nom || 'Banque'}`
        : `Retrait ${selectedCompte?.nom || 'Banque'} → caisse`;

      const { error } = await supabase.from('mouvements_comptes').insert({
        compte_id: compteId,
        type: 'transfert',
        sens,
        categorie,
        montant: montantNum,
        devise,
        description: `${description}${motif ? ` — ${motif}` : ''}`,
        reference: reference || null,
        notes: notes || null,
        date_mouvement: new Date().toISOString(),
        created_by: user.id,
      });

      if (error) throw error;

      // Mettre à jour le solde du compte
      const ajustement = direction === 'caisse_vers_banque' ? montantNum : -montantNum;
      const nouveauSolde = (selectedCompte?.solde || 0) + ajustement;
      await supabase.from('comptes_financiers').update({ solde: nouveauSolde }).eq('id', compteId);

      showSuccess(
        direction === 'caisse_vers_banque'
          ? `Transfert de ${formatUsd(montantNum)} vers ${selectedCompte?.nom} effectué`
          : `Retrait de ${formatUsd(montantNum)} depuis ${selectedCompte?.nom} effectué`
      );
      setConfirmDialog(false);
      resetForm();
      loadData();
    } catch (err: any) {
      showError(err.message || 'Erreur lors du transfert');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setDirection('caisse_vers_banque');
    setCompteId('');
    setMontant('');
    setMotif('');
    setReference('');
    setNotes('');
  };

  const getDirectionIcon = (dir: Direction) => {
    if (dir === 'caisse_vers_banque') {
      return <ArrowUpRight className="h-4 w-4 text-amber-600" />;
    }
    return <ArrowDownLeft className="h-4 w-4 text-emerald-600" />;
  };

  const getDirectionLabel = (dir: Direction) => {
    return dir === 'caisse_vers_banque' ? 'Caisse → Banque' : 'Banque → Caisse';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
              <h1 className="text-2xl font-bold text-gray-900">Transfert Caisse ↔ Banque</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Mouvements entre la caisse et les comptes bancaires
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
              Historique
            </Button>
          </div>
        </div>

        {!sessionActive && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                Aucune session de caisse active. Les transferts seront enregistrés mais sans session rattachée.
              </p>
            </div>
          </div>
        )}

        {/* Formulaire de transfert */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gauche: formulaire */}
          <Card>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Nouveau transfert</h2>
                  <p className="text-xs text-gray-400">
                    Déplacez des fonds entre votre caisse et vos comptes bancaires
                  </p>
                </div>
              </div>

              {/* Direction */}
              <div>
                <Label className="text-xs font-bold text-gray-500">Direction</Label>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 mt-2">
                  <button
                    onClick={() => setDirection('caisse_vers_banque')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      direction === 'caisse_vers_banque'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Caisse → Banque
                  </button>
                  <button
                    onClick={() => setDirection('banque_vers_caisse')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      direction === 'banque_vers_caisse'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    Banque → Caisse
                  </button>
                </div>
              </div>

              {/* Compte bancaire */}
              <div>
                <Label htmlFor="compte" className="text-xs font-bold text-gray-500">Compte bancaire</Label>
                <Select value={compteId} onValueChange={setCompteId}>
                  <SelectTrigger id="compte" className="mt-2">
                    <SelectValue placeholder="Sélectionner un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {comptes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-gray-400" />
                          <span>{c.nom}</span>
                          <span className="text-xs text-gray-400">— {c.banque}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {comptes.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        Aucun compte bancaire trouvé
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Montant & Devise */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="montant" className="text-xs font-bold text-gray-500">Montant</Label>
                  <Input
                    id="montant"
                    type="number"
                    min="0"
                    step="0.01"
                    value={montant}
                    onChange={e => setMontant(e.target.value)}
                    placeholder="0.00"
                    className="mt-2 h-12 text-lg font-extrabold font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500">Devise</Label>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 mt-2">
                    <button
                      onClick={() => setDevise('USD')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        devise === 'USD'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500'
                      }`}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => setDevise('CDF')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        devise === 'CDF'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500'
                      }`}
                    >
                      CDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Motif */}
              <div>
                <Label htmlFor="motif" className="text-xs font-bold text-gray-500">Motif</Label>
                <Input
                  id="motif"
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                  placeholder="Ex: Dépôt journalier"
                  className="mt-2"
                />
              </div>

              {/* Référence */}
              <div>
                <Label htmlFor="ref" className="text-xs font-bold text-gray-500">Référence (optionnel)</Label>
                <Input
                  id="ref"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Ex: Bordereau #12345"
                  className="mt-2"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-xs font-bold text-gray-500">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Informations complémentaires..."
                  className="mt-2"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button variant="outline" onClick={resetForm} className="gap-2">
                  <X className="h-4 w-4" />
                  Effacer
                </Button>
                <Button
                  onClick={() => setConfirmDialog(true)}
                  disabled={!compteId || !montant || parseFloat(montant) <= 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Effectuer le transfert
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Droite: infos du compte sélectionné */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Comptes bancaires</h2>
              </div>

              {comptes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Aucun compte bancaire configuré</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ajoutez des comptes dans les paramètres de comptabilité
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comptes.map(c => (
                    <div
                      key={c.id}
                      className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        compteId === c.id
                          ? 'border-purple-300 bg-purple-50/50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                      onClick={() => setCompteId(c.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{c.nom}</p>
                          <p className="text-xs text-gray-500">{c.banque}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white"
                        >
                          {c.devise}
                        </Badge>
                      </div>
                      <p className="text-sm font-mono font-extrabold">
                        {c.devise === 'CDF' ? formatCdf(c.solde || 0) : formatUsd(c.solde || 0)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">
                        {c.numero_compte}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Derniers mouvements */}
              {history.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-3">Derniers mouvements</p>
                  <div className="space-y-2">
                    {history.slice(0, 5).map(h => (
                      <div key={h.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {h.categorie === 'transfert_caisse_banque'
                            ? <ArrowUpRight className="h-3 w-3 text-amber-500" />
                            : <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                          }
                          <div>
                            <p className="font-medium text-gray-700">
                              {h.categorie === 'transfert_caisse_banque' ? 'Dépôt' : 'Retrait'}
                            </p>
                            <p className="text-[10px] text-gray-400">{formatDate(h.date_mouvement)}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold">
                          {h.sens === 'sortie' ? '-' : '+'}{formatUsd(h.montant)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-purple-600" />
              Confirmer le transfert
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'effectuer le mouvement suivant :
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex justify-between bg-purple-50 rounded-xl p-4">
              <span className="text-sm text-purple-700">Direction</span>
              <span className="text-sm font-bold">{getDirectionLabel(direction)}</span>
            </div>
            <div className="flex justify-between bg-gray-50 rounded-xl p-4">
              <span className="text-sm text-gray-600">Montant</span>
              <span className="text-sm font-extrabold font-mono">
                {devise === 'CDF' ? formatCdf(parseFloat(montant) || 0) : formatUsd(parseFloat(montant) || 0)}
              </span>
            </div>
            {selectedCompte && (
              <div className="flex justify-between bg-gray-50 rounded-xl p-4">
                <span className="text-sm text-gray-600">Compte</span>
                <span className="text-sm font-medium">{selectedCompte.nom}</span>
              </div>
            )}
            {motif && (
              <div className="flex justify-between bg-gray-50 rounded-xl p-4">
                <span className="text-sm text-gray-600">Motif</span>
                <span className="text-sm">{motif}</span>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <X className="h-4 w-4" />
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirmer le transfert
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
              Historique des transferts
            </DialogTitle>
            <DialogDescription>
              Tous les mouvements entre la caisse et les comptes bancaires
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-gray-700 text-xs">Date</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Direction</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Description</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs text-right">Montant</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs text-center">Devise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-sm text-gray-400">
                      Aucun transfert pour le moment
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map(h => (
                    <TableRow key={h.id} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-mono text-gray-700">
                        {formatDate(h.date_mouvement)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          {h.categorie === 'transfert_caisse_banque' ? (
                            <>
                              <ArrowUpRight className="h-3 w-3 text-amber-500" />
                              <span className="text-amber-700">Caisse → Banque</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-700">Banque → Caisse</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">
                        {h.description}
                      </TableCell>
                      <TableCell className={`text-xs font-extrabold font-mono text-right ${
                        h.type === 'sortie' || h.categorie === 'transfert_caisse_banque'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}>
                        {h.categorie === 'transfert_caisse_banque' ? '-' : '+'}
                        {formatUsd(h.montant)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] bg-gray-50">
                          {h.devise || 'USD'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
