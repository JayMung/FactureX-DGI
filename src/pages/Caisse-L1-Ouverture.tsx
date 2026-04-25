"use client";

import React, { useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, LockOpen, ArrowLeft, User, CheckCircle2 } from 'lucide-react';

const BILLS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];
const COINS = [5, 1];

function formatCDF(n: number) {
  return n.toLocaleString('fr-FR') + ' CDF';
}

interface DenomEntry {
  denom: number;
  count: number;
}

const defaultDenoms = (): DenomEntry[] =>
  [...BILLS, ...COINS].map(denom => ({ denom, count: 0 }));

export default function CaisseL1Ouverture() {
  usePageSetup({ title: 'Ouverture de Caisse', subtitle: 'Démarrer une session de caisse' });

  const [denoms, setDenoms] = useState<DenomEntry[]>(defaultDenoms());
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const totalCDF = denoms.reduce((sum, d) => sum + d.denom * d.count, 0);
  const billsTotal = denoms.filter(d => d.denom >= 10).reduce((sum, d) => sum + d.denom * d.count, 0);
  const coinsTotal = denoms.filter(d => d.denom < 10).reduce((sum, d) => sum + d.denom * d.count, 0);

  const updateCount = useCallback((denom: number, count: number) => {
    setDenoms(prev =>
      prev.map(d => (d.denom === denom ? { ...d, count: Math.max(0, count) } : d))
    );
  }, []);

  const handleOpenCaisse = async () => {
    if (totalCDF <= 0) {
      showError('Le montant d\'ouverture doit être supérieur à 0 CDF');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Check for existing open session
      const { data: existing } = await supabase
        .from('caisse_sessions')
        .select('id')
        .eq('statut', 'ouverte')
        .maybeSingle();

      if (existing) {
        showError('Une session est déjà ouverte. Fermez-la d\'abord.');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('caisse_sessions').insert({
        opened_by: user.id,
        solde_ouverture: totalCDF,
        total_ventes: 0,
        total_especes: 0,
        total_carte: 0,
        total_mobile: 0,
        total_sorties: 0,
        statut: 'ouverte',
        notes: null,
      });

      if (error) throw error;
      showSuccess('Session de caisse ouverte avec succès');
      setTimeout(() => {
        window.location.href = '/caisse-journal';
      }, 1200);
    } catch (err: any) {
      showError(err.message || 'Erreur lors de l\'ouverture de la caisse');
    } finally {
      setSaving(false);
    }
  };

  const dateStr = currentTime.toLocaleDateString('fr-FR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

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
                {dateStr}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Prête
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

          {/* Cashier info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Caissier actuel</div>
                  <div className="text-xs text-gray-400">Boutique Gombe</div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-bold">Session inactive — ouvrez la caisse</span>
              </div>
            </div>
          </div>

          {/* Denomination card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-base font-bold text-gray-900">Fonds d'ouverture</div>
                <div className="text-xs text-gray-400">Sélectionnez les quantités par dénomination</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Total ouvert</div>
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">{formatCDF(totalCDF)}</div>
              </div>
            </div>

            {/* Bills */}
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billets CDF</div>
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2">
                {BILLS.map(d => {
                  const entry = denoms.find(x => x.denom === d)!;
                  return (
                    <div key={d} className="flex flex-col items-center gap-1">
                      <div className="text-lg font-bold text-gray-700">{d.toLocaleString('fr-FR')}</div>
                      <div className="w-full h-14 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={entry.count}
                          onChange={e => updateCount(d, parseInt(e.target.value) || 0)}
                          className="w-10 text-center font-mono font-bold text-lg bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">×{d.toLocaleString('fr-FR')}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coins */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pièces CDF</div>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {COINS.map(d => {
                  const entry = denoms.find(x => x.denom === d)!;
                  return (
                    <div key={d} className="flex flex-col items-center gap-1">
                      <div className="text-sm font-bold text-gray-700">{d}</div>
                      <div className="w-full h-12 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={entry.count}
                          onChange={e => updateCount(d, parseInt(e.target.value) || 0)}
                          className="w-8 text-center font-mono font-bold bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">×{d}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-gray-900">Récapitulatif</div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-semibold">Équilibré</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xs text-emerald-600 mb-1">Billets</div>
                <div className="text-lg font-extrabold text-emerald-700 font-mono">{formatCDF(billsTotal)}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xs text-emerald-600 mb-1">Pièces</div>
                <div className="text-lg font-extrabold text-emerald-700 font-mono">{formatCDF(coinsTotal)}</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-3 text-center col-span-2">
                <div className="text-xs text-gray-500 mb-1">Total ouverture</div>
                <div className="text-xl font-extrabold text-emerald-600 font-mono">{formatCDF(totalCDF)}</div>
              </div>
            </div>

            {/* PIN validation */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Validation PIN Caissier</div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center text-xl font-bold text-gray-900">•</div>
                  ))}
                </div>
                <Button
                  onClick={handleOpenCaisse}
                  disabled={saving || totalCDF <= 0}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-extrabold shadow-sm flex items-center justify-center gap-2"
                >
                  <LockOpen className="w-4 h-4" />
                  {saving ? 'Ouverture...' : 'Ouvrir la caisse'}
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
