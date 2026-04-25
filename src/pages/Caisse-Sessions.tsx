"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Wallet,
  Plus,
  Lock,
  Unlock,
  Eye,
  ArrowLeftRight,
  Clock,
  DollarSign,
  CreditCard,
  Banknote,
  X,
  Check,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatUsd } from '@/utils/dgiUtils';

interface CaisseSession {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opened_by: string;
  closed_by: string | null;
  solde_ouverture: number;
  total_ventes: number;
  total_especes: number;
  total_carte: number;
  total_mobile: number;
  total_sorties: number;
  solde_fermeture: number | null;
  statut: 'ouverte' | 'fermee';
  notes: string | null;
  created_at: string;
}

const defaultOpenForm = {
  solde_ouverture: 0,
  notes: '',
};

export default function CaisseSessions() {
  usePageSetup({
    title: 'Caisse',
    subtitle: 'Gestion des sessions de caisse',
  });

  const [sessions, setSessions] = useState<CaisseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CaisseSession | null>(null);
  const [openForm, setOpenForm] = useState(defaultOpenForm);
  const [closeForm, setCloseForm] = useState({ notes: '', solde_fermeture: 0 });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('caisse_sessions')
        .select('*')
        .order('opened_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (err: any) {
      showError('Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const currentSession = sessions.find(s => s.statut === 'ouverte');
  const filteredSessions = sessions.filter(s =>
    activeTab === 'open' ? s.statut === 'ouverte' : s.statut === 'fermee'
  );

  const handleOpenSession = async () => {
    if (currentSession) {
      showError('Une session est déjà ouverte. Fermez-la d\'abord.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('caisse_sessions').insert({
        opened_by: user.id,
        solde_ouverture: openForm.solde_ouverture,
        total_ventes: 0,
        total_especes: 0,
        total_carte: 0,
        total_mobile: 0,
        total_sorties: 0,
        statut: 'ouverte',
        notes: openForm.notes || null,
      });

      if (error) throw error;
      showSuccess('Session de caisse ouverte avec succès');
      setOpenDialog(false);
      setOpenForm(defaultOpenForm);
      fetchSessions();
    } catch (err: any) {
      showError(err.message || 'Erreur lors de l\'ouverture');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('caisse_sessions')
        .update({
          closed_by: user.id,
          closed_at: new Date().toISOString(),
          solde_fermeture: closeForm.solde_fermeture,
          statut: 'fermee',
          notes: closeForm.notes || selectedSession.notes,
        })
        .eq('id', selectedSession.id);

      if (error) throw error;
      showSuccess('Session de caisse fermée avec succès');
      setCloseDialog(false);
      setSelectedSession(null);
      setCloseForm({ notes: '', solde_fermeture: 0 });
      fetchSessions();
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la fermeture');
    } finally {
      setSaving(false);
    }
  };

  const openCloseDialog = (session: CaisseSession) => {
    setSelectedSession(session);
    setCloseForm({
      notes: '',
      solde_fermeture: session.total_ventes + session.solde_ouverture,
    });
    setCloseDialog(true);
  };

  const expectedClose = selectedSession
    ? selectedSession.solde_ouverture + selectedSession.total_ventes - selectedSession.total_sorties
    : 0;

  const getStatutBadge = (statut: string) => {
    if (statut === 'ouverte') {
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Ouverte</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200 gap-1"><Lock className="w-3 h-3" />Fermée</Badge>;
  };

  const getDuration = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions de Caisse</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentSession ? 'Session active en cours' : 'Aucune session ouverte'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!currentSession ? (
              <Button
                onClick={() => setOpenDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Unlock className="h-4 w-4" />
                Ouvrir la caisse
              </Button>
            ) : (
              <Button
                onClick={() => openCloseDialog(currentSession)}
                variant="destructive"
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                Fermer la caisse
              </Button>
            )}
          </div>
        </div>

        {/* Active Session Banner */}
        {currentSession && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-100">Session active</p>
                  <p className="text-2xl font-extrabold">
                    {formatUsd(currentSession.solde_ouverture + currentSession.total_ventes)}
                  </p>
                  <p className="text-xs text-emerald-200 mt-1">
                    Solde initial: {formatUsd(currentSession.solde_ouverture)} · Vendus: {formatUsd(currentSession.total_ventes)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-200">Caisse #1</p>
                <p className="text-sm font-mono font-bold text-white">
                  {getDuration(currentSession.opened_at, null)}
                </p>
                <p className="text-xs text-emerald-200 mt-1">
                  Ouverte à {new Date(currentSession.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Banknote className="h-4 w-4 mx-auto text-emerald-200 mb-1" />
                <p className="text-xs text-emerald-200">Espèces</p>
                <p className="text-sm font-extrabold font-mono">{formatUsd(currentSession.total_especes)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <CreditCard className="h-4 w-4 mx-auto text-emerald-200 mb-1" />
                <p className="text-xs text-emerald-200">Carte</p>
                <p className="text-sm font-extrabold font-mono">{formatUsd(currentSession.total_carte)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Clock className="h-4 w-4 mx-auto text-emerald-200 mb-1" />
                <p className="text-xs text-emerald-200">Mobile</p>
                <p className="text-sm font-extrabold font-mono">{formatUsd(currentSession.total_mobile)}</p>
              </div>
            </div>
          </div>
        )}

        {/* No active session */}
        {!currentSession && (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Caisse fermée</h3>
            <p className="text-sm text-gray-400 mb-4">Ouvrez une session pour commencer les ventes</p>
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Unlock className="h-4 w-4" />
              Ouvrir la caisse
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'open'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sessions ouvertes
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'closed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historique
          </button>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold text-gray-700">Session</TableHead>
                <TableHead className="font-bold text-gray-700">Date</TableHead>
                <TableHead className="font-bold text-gray-700">Durée</TableHead>
                <TableHead className="font-bold text-gray-700 text-right">Solde Ouverture</TableHead>
                <TableHead className="font-bold text-gray-700 text-right">Ventes</TableHead>
                <TableHead className="font-bold text-gray-700 text-right">Espèces</TableHead>
                <TableHead className="font-bold text-gray-700 text-right">Solde Fermeture</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Statut</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-700">
                        {activeTab === 'open' ? 'Aucune session ouverte' : 'Aucun historique'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map(session => (
                  <TableRow key={session.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          session.statut === 'ouverte'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Wallet className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-900">
                          Caisse #{session.id.slice(-4).toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {new Date(session.opened_at).toLocaleDateString('fr-FR')}
                      </span>
                      <p className="text-xs text-gray-400">
                        {new Date(session.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-700">
                        {getDuration(session.opened_at, session.closed_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900 font-mono">
                      {formatUsd(session.solde_ouverture)}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.total_ventes > 0 && (
                        <div>
                          <span className="font-bold text-emerald-700 font-mono">{formatUsd(session.total_ventes)}</span>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <Banknote className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400 font-mono">{formatUsd(session.total_especes)}</span>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">
                      {formatUsd(session.total_especes)}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.solde_fermeture !== null ? (
                        <span className={`font-bold font-mono ${
                          session.solde_fermeture >= session.solde_ouverture + session.total_ventes
                            ? 'text-emerald-700'
                            : 'text-red-600'
                        }`}>
                          {formatUsd(session.solde_fermeture)}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatutBadge(session.statut)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCloseDialog(session)}
                          className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Fermer la session"
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Open Session Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-emerald-600" />
              Ouvrir une session de caisse
            </DialogTitle>
            <DialogDescription>
              Définissez le solde d'ouverture pour démarrer la journée.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="solde_ouverture">Solde d'ouverture (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="solde_ouverture"
                  type="number"
                  min="0"
                  step="0.01"
                  value={openForm.solde_ouverture || ''}
                  onChange={e => setOpenForm(f => ({ ...f, solde_ouverture: parseFloat(e.target.value) || 0 }))}
                  className="pl-9 font-mono"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-400">Montant initial en espèces dans la caisse</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="open_notes">Notes (optionnel)</Label>
              <Input
                id="open_notes"
                value={openForm.notes}
                onChange={e => setOpenForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observations initiales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)} className="gap-2">
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button
              onClick={handleOpenSession}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              Ouvrir la caisse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              Fermer la session de caisse
            </DialogTitle>
            <DialogDescription>
              Vérifiez les totaux et definissez le solde de fermeture.
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 py-4">
              {/* Session Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Solde ouverture</span>
                  <span className="font-bold font-mono">{formatUsd(selectedSession.solde_ouverture)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">+ Ventes</span>
                  <span className="font-bold font-mono text-emerald-700">+ {formatUsd(selectedSession.total_ventes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">- Sorties</span>
                  <span className="font-bold font-mono text-red-600">- {formatUsd(selectedSession.total_sorties)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-gray-700">Solde théorique</span>
                  <span className="font-extrabold font-mono text-gray-900">{formatUsd(expectedClose)}</span>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <Banknote className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs text-blue-600">Espèces</p>
                  <p className="text-sm font-bold font-mono text-blue-700">{formatUsd(selectedSession.total_especes)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <CreditCard className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                  <p className="text-xs text-purple-600">Carte</p>
                  <p className="text-sm font-bold font-mono text-purple-700">{formatUsd(selectedSession.total_carte)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <Clock className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                  <p className="text-xs text-amber-600">Mobile</p>
                  <p className="text-sm font-bold font-mono text-amber-700">{formatUsd(selectedSession.total_mobile)}</p>
                </div>
              </div>

              {/* Solde fermeture */}
              <div className="space-y-2">
                <Label htmlFor="solde_fermeture">Solde de fermeture (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="solde_fermeture"
                    type="number"
                    min="0"
                    step="0.01"
                    value={closeForm.solde_fermeture || ''}
                    onChange={e => setCloseForm(f => ({ ...f, solde_fermeture: parseFloat(e.target.value) || 0 }))}
                    className="pl-9 font-mono"
                  />
                </div>
                {closeForm.solde_fermeture !== expectedClose && (
                  <p className={`text-xs flex items-center gap-1 ${closeForm.solde_fermeture < expectedClose ? 'text-red-600' : 'text-emerald-600'}`}>
                    {closeForm.solde_fermeture < expectedClose ? (
                      <><TrendingDown className="h-3 w-3" /> Manque: {formatUsd(expectedClose - closeForm.solde_fermeture)}</>
                    ) : (
                      <><TrendingUp className="h-3 w-3" /> Surplus: {formatUsd(closeForm.solde_fermeture - expectedClose)}</>
                    )}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="close_notes">Notes de fermeture</Label>
                <Input
                  id="close_notes"
                  value={closeForm.notes}
                  onChange={e => setCloseForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observations de clôture..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)} className="gap-2">
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button
              onClick={handleCloseSession}
              disabled={saving}
              variant="destructive"
              className="gap-2"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Confirmer la fermeture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
