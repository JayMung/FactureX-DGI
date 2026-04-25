"use client";

import React, { useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '@/hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

const BILLS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];
const COINS = [5, 1];

function formatCDF(n: number) {
  return n.toLocaleString('fr-FR') + ' CDF';
}

interface DenomEntry {
  denom: number;
  count: number;
}

const DEFAULT_DENOMS = (): DenomEntry[] => {
  const defaults: Record<number, number> = {
    10000: 20, 5000: 4, 2000: 8, 1000: 5, 500: 6,
    200: 5, 100: 20, 50: 7, 20: 0, 10: 0, 5: 0, 1: 0,
  };
  return [...BILLS, ...COINS].map(d => ({ denom: d, count: defaults[d] ?? 0 }));
};

const MOTIF_OPTIONS = [
  { value: '', label: 'Aucun écart — pas de motif nécessaire' },
  { value: 'client-remboursement', label: 'Remboursement client non enregistré' },
  { value: 'faux-billet', label: 'Faux billet rendu' },
  { value: 'erreur-rendu', label: 'Erreur de rendu monnaie' },
  { value: 'vol', label: 'Vol / Manquant constaté' },
  { value: 'autre', label: 'Autre motif' },
];

const THEORETICAL_BALANCE = 247350;

export default function CaisseL3Fermeture() {
  usePageSetup({ title: 'Fermeture de Caisse', subtitle: 'Clôture de session et comptage' });

  const [denoms, setDenoms] = useState<DenomEntry[]>(DEFAULT_DENOMS());
  const [motif, setMotif] = useState('');
  const [motifDetail, setMotifDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentTime] = useState(new Date());

  const countedTotal = denoms.reduce((sum, d) => sum + d.denom * d.count, 0);
  const ecart = countedTotal - THEORETICAL_BALANCE;
  const isBalanced = ecart === 0;

  const updateCount = useCallback((denom: number, count: number) => {
    setDenoms(prev => prev.map(d => (d.denom === denom ? { ...d, count: Math.max(0, count) } : d)));
  }, []);

  const dateStr = currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handleValidateFermeture = async () => {
    if (!isBalanced && !motif) {
      showError('Veuillez sélectionner un motif d'\'écart');
      return;
    }
    if (motif === 'autre' && !motifDetail.trim()) {
      showError('Veuillez décrire le motif');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Find open session
      const { data: session } = await supabase
        .from('caisse_sessions')
        .select('id')
        .eq('statut', 'ouverte')
        .maybeSingle();

      if (!session) {
        showError('Aucune session ouverte trouvée');
        setSaving(false);
        return;
      }

      const notes = motif
        ? `${motif}${motifDetail ? ': ' + motifDetail : ''}`
        : 'Fermeture équilibrée';

      const { error } = await supabase
        .from('caisse_sessions')
        .update({
          closed_by: user.id,
          closed_at: new Date().toISOString(),
          solde_fermeture: countedTotal,
          statut: 'fermee',
          notes,
        })
        .eq('id', session.id);

      if (error) throw error;
      showSuccess('Session de caisse fermée avec succès');
      setTimeout(() => { window.location.href = '/caisse-sessions'; }, 1200);
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la fermeture');
    } finally {
      setSaving(false);
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
              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-3 py-1.5 rounded-lg hidden sm:block">
                {dateStr} — {timeStr}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                En attente validation
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

          {/* Session info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 text-lg">👤</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Jean-Pierre Kabongo</div>
                  <div className="text-xs text-gray-400">Session : 08:00 — {timeStr} (en cours)</div>
                </div>
              </div>
              <div className="ml-auto grid grid-cols-3 gap-4 text-right">
                <div>
                  <div className="text-[10px] text-gray-400">Ventes</div>
                  <div className="text-sm font-bold text-emerald-600 font-mono">+189 400</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Retraits</div>
                  <div className="text-sm font-bold text-red-600 font-mono">-12 050</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Net jour</div>
                  <div className="text-sm font-bold text-gray-900 font-mono">+177 350</div>
                </div>
              </div>
            </div>
          </div>

          {/* Counting card */}
          <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-base font-bold text-gray-900">Comptage de fermeture</div>
                <div className="text-xs text-gray-400">Comtez les billets et pièces réellement présents dans la caisse</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Solde théorique</div>
                <div className="text-xl font-extrabold text-orange-600 font-mono">{formatCDF(THEORETICAL_BALANCE)}</div>
              </div>
            </div>

            {/* Bills */}
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billets CDF</div>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                {BILLS.map(d => {
                  const entry = denoms.find(x => x.denom === d)!;
                  const subtotal = d * entry.count;
                  return (
                    <div key={d} className="flex flex-col items-center gap-1">
                      <div className="text-sm font-bold text-gray-700">{d.toLocaleString('fr-FR')}</div>
                      <div className="w-full h-12 rounded-xl border-2 border-orange-300 bg-orange-50 flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={entry.count}
                          onChange={e => updateCount(d, parseInt(e.target.value) || 0)}
                          className="w-10 text-center font-mono font-bold text-orange-700 bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">
                        ×{d.toLocaleString('fr-FR')} = <span className="font-bold text-gray-700">{subtotal.toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coins */}
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pièces CDF</div>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {COINS.map(d => {
                  const entry = denoms.find(x => x.denom === d)!;
                  const subtotal = d * entry.count;
                  return (
                    <div key={d} className="flex flex-col items-center gap-1">
                      <div className="text-sm font-bold text-gray-700">{d}</div>
                      <div className="w-full h-10 rounded-xl border-2 border-orange-300 bg-orange-50 flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={entry.count}
                          onChange={e => updateCount(d, parseInt(e.target.value) || 0)}
                          className="w-8 text-center font-mono font-bold text-orange-700 bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">
                        ×{d} = <span className="font-bold text-gray-700">{subtotal.toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Result comparison */}
            <div className="bg-orange-50 rounded-xl p-4 mt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Solde théorique</div>
                  <div className="text-xl font-extrabold text-orange-700 font-mono">{formatCDF(THEORETICAL_BALANCE)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Compté réel</div>
                  <div className="text-xl font-extrabold text-orange-700 font-mono">{formatCDF(countedTotal)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Écart</div>
                  <div className={`text-xl font-extrabold font-mono ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                    {ecart >= 0 ? '+' : ''}{formatCDF(ecart)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Motif card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Motif d'écart (si écart)</label>
              <select
                value={motif}
                onChange={e => setMotif(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                {MOTIF_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {motif !== '' && (
                <textarea
                  value={motifDetail}
                  onChange={e => setMotifDetail(e.target.value)}
                  placeholder="Décrivez le motif..."
                  rows={2}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                />
              )}
            </div>

            {/* PIN validation */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Validation PIN Responsable</div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center text-xl font-bold text-gray-900">•</div>
                  ))}
                </div>
                <Button
                  onClick={handleValidateFermeture}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-extrabold shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'Validation...' : 'Valider fermeture'}
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
