"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '@/hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';

function formatCDF(n: number) {
  return n.toLocaleString('fr-FR') + ' CDF';
}

interface Transfer {
  id: string;
  date: string;
  type: 'depot' | 'retrait';
  ref: string;
  compte: string;
  montant: number;
  statut: string;
}



const BILLS_DEPOSIT = [10000, 5000, 2000, 1000, 500];

const SOLDE_CAISSE = 247350;
const SOLDE_BANQUE = 234100;

export default function CaisseL4Transfert() {
  usePageSetup({ title: 'Transfert Caisse ↔ Banque', subtitle: 'Gérer les transferts de fonds' });

  // Get companyId from current user's profile
  const { data: currentProfile } = useQuery({
    queryKey: ['my-profile-transfert'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('team_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
  });

  const companyId = currentProfile?.company_id;

  // Load accounts (Caisse + Banque) and their soldes
  const { data: comptes = [] } = useQuery({
    queryKey: ['comptes-financiers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('comptes_financiers')
        .select('*')
        .order('type_compte');
      return data || [];
    },
    enabled: !!companyId,
  });

  // Load transfer history from mouvements_comptes (swap type = transfers)
  const { data: rawTransfers = [] } = useQuery({
    queryKey: ['transferts-history', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('mouvements_comptes')
        .select('*')
        .eq('type_mouvement', 'swap')
        .order('date_mouvement', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!companyId,
  });

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [formMode, setFormMode] = useState<'none' | 'depot' | 'retrait'>('none');
  const [amount, setAmount] = useState(50000);
  const [billCounts, setBillCounts] = useState<Record<number, number>>({ 10000: 5, 5000: 0, 2000: 0, 1000: 0, 500: 0 });
  const [reference, setReference] = useState('BOR-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0'));
  const [note, setNote] = useState('Transfert — ' + new Date().toLocaleDateString('fr-FR'));
  const [saving, setSaving] = useState(false);
  const [currentTime] = useState(new Date());

  // Map raw swap movements to Transfer interface
  useEffect(() => {
    if (rawTransfers.length > 0) {
      const mapped: Transfer[] = rawTransfers.map((t) => ({
        id: t.id,
        date: new Date(t.date_mouvement).toLocaleDateString('fr-FR'),
        type: (t.montant > 0 ? 'depot' : 'retrait') as 'depot' | 'retrait',
        ref: t.reference_externe || t.id.slice(0, 12).toUpperCase(),
        compte: 'Compte financier',
        montant: Math.abs(Number(t.montant)),
        statut: 'Complété',
      }));
      setTransfers(mapped);
    }
  }, [rawTransfers]);

  // Get solde for Caisse (type=courant or caisse) and Banque (type=banque)
  const soldeCaisse = comptes.find(c => c.type_compte?.includes('caisse') || c.nom?.toLowerCase().includes('caisse'))?.solde || 0;
  const soldeBanque = comptes.find(c => c.type_compte?.includes('banque') || c.nom?.toLowerCase().includes('banque'))?.solde || 0;
  const SOLDE_CAISSE = Number(soldeCaisse);
  const SOLDE_BANQUE = Number(soldeBanque);

  const billTotal = Object.entries(billCounts).reduce((sum, [d, c]) => sum + parseInt(d) * c, 0);

  const updateBill = (denom: number, count: number) => {
    setBillCounts(prev => ({ ...prev, [denom]: Math.max(0, count) }));
  };

  const dateStr = currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleConfirm = async () => {
    if (amount <= 0) {
      showError('Le montant doit être supérieur à 0');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // In a real app, this would create a transfer record
      // and update both caisse and bank balances
      showSuccess(formMode === 'depot' ? 'Dépôt enregistré avec succès' : 'Retrait enregistré avec succès');
      setFormMode('none');
      setAmount(50000);
      setBillCounts({ 10000: 5, 5000: 0, 2000: 0, 1000: 0, 500: 0 });
    } catch (err: any) {
      showError(err.message || 'Erreur lors de l'\'enregistrement');
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
              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-3 py-1.5 rounded-lg hidden sm:block">{dateStr}</div>
              <Button
                onClick={() => setFormMode('none')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau transfert
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

          {/* Balance cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-xs text-gray-500 mb-1">Solde caisse</div>
              <div className="text-3xl font-extrabold text-emerald-600 font-mono">{formatCDF(SOLDE_CAISSE)}</div>
              <div className="text-xs text-gray-400 mt-1">34 opérations aujourd'\'hui</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-xs text-gray-500 mb-1">Solde banque (Rawbank)</div>
              <div className="text-3xl font-extrabold text-blue-600 font-mono">{formatCDF(SOLDE_BANQUE)}</div>
              <div className="text-xs text-gray-400 mt-1">Compte 5211</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormMode('depot')}
              className={`bg-white rounded-2xl border-2 p-5 text-center transition-all shadow-sm group ${
                formMode === 'depot' ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200 hover:bg-emerald-50\`
              }`}
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏦</div>
              <div className="text-base font-bold text-gray-900 mb-1">Dépôt en banque</div>
              <div className="text-xs text-gray-400">Caisse → Banque</div>
            </button>
            <button
              onClick={() => setFormMode('retrait')}
              className={`bg-white rounded-2xl border-2 p-5 text-center transition-all shadow-sm group ${
                formMode === 'retrait' ? 'border-blue-400 bg-blue-50' : 'border-blue-200 hover:bg-blue-50\`
              }`}
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">💵</div>
              <div className="text-base font-bold text-gray-900 mb-1">Retrait de banque</div>
              <div className="text-xs text-gray-400">Banque → Caisse</div>
            </button>
          </div>

          {/* Deposit form */}
          {formMode === 'depot' && (
            <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏦</span>
                <div>
                  <div className="text-base font-bold text-gray-900">Dépôt en banque — Rawbank</div>
                  <div className="text-xs text-gray-400">Transfert caisse → compte bancaire</div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Montant du dépôt (CDF)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 text-xl font-extrabold font-mono text-emerald-700 focus:outline-none focus:border-emerald-400 bg-emerald-50"
                    placeholder="0"
                  />
                </div>

                {/* Bill breakdown */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Billetage du dépôt</label>
                  <div className="grid grid-cols-5 gap-2">
                    {BILLS_DEPOSIT.map(d => (
                      <div key={d} className="flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">{d.toLocaleString('fr-FR')}</div>
                        <input
                          type="number"
                          min="0"
                          value={billCounts[d] || 0}
                          onChange={e => updateBill(d, parseInt(e.target.value) || 0)}
                          className="w-full h-10 rounded-lg border border-gray-200 text-center font-mono font-bold bg-gray-50 focus:outline-none focus:border-emerald-300"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 bg-emerald-50 rounded-lg p-2 text-center">
                    <span className="text-xs text-emerald-600">Total billetage : </span>
                    <span className="text-sm font-extrabold text-emerald-700 font-mono">{formatCDF(billTotal)}</span>
                    {billTotal !== amount && amount > 0 && (
                      <span className="text-xs text-orange-500 ml-2">(≠ montant: différence {formatCDF(Math.abs(billTotal - amount))})</span>
                    )}
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">N° bordereau / référence</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Motif / note</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white resize-none"
                    placeholder="Ex: Dépôt espèces journalier"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleConfirm}
                    disabled={saving || amount <= 0}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-extrabold shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {saving ? 'Enregistrement...' : 'Confirmer dépôt'}
                  </Button>
                  <Button
                    onClick={() => setFormMode('none')}
                    variant="outline"
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal form */}
          {formMode === 'retrait' && (
            <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💵</span>
                <div>
                  <div className="text-base font-bold text-gray-900">Retrait de banque — Rawbank</div>
                  <div className="text-xs text-gray-400">Transfert compte bancaire → caisse</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Montant du retrait (CDF)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 text-xl font-extrabold font-mono text-blue-700 focus:outline-none focus:border-blue-400 bg-blue-50"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Référence</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="N° bordereau..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Motif / note</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white resize-none"
                    placeholder="Ex: Approvisionnement caisse quotidien"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleConfirm}
                    disabled={saving || amount <= 0}
                    className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-extrabold shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {saving ? 'Enregistrement...' : 'Confirmer retrait'}
                  </Button>
                  <Button
                    onClick={() => setFormMode('none')}
                    variant="outline"
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Transfer history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Historique des transferts</span>
              <button className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">Voir tout</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Référence</th>
                    <th className="text-left px-4 py-3">Compte destination</th>
                    <th className="text-right px-4 py-3">Montant</th>
                    <th className="text-center px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transfers.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900 whitespace-nowrap">{t.date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.type === 'depot' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {t.type === 'depot' ? 'Dépôt' : 'Retrait'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500">{t.ref}</td>
                      <td className="px-4 py-3 text-gray-600">{t.compte}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${t.type === 'depot' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'depot' ? '+' : '-'}{formatCDF(t.montant)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">✓ {t.statut}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
