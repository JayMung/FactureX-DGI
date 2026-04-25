import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBalance } from "@/hooks/useComptabiliteOHADA";

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

export default function ComptaBalance() {
  const [period, setPeriod] = useState("Avril 2026");

  // Get companyId from current user's profile
  const { data: currentProfile } = useQuery({
    queryKey: ['my-profile'],
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
  const { data: balanceEntries = [], isLoading } = useBalance(companyId);

  // Use total_debit/total_credit as final balances (no initial breakdown from v_balance)
  const totalFinalDebit = balanceEntries.reduce((s, a) => s + (a.total_debit || 0), 0);
  const totalFinalCredit = balanceEntries.reduce((s, a) => s + (a.total_credit || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-sm">
                <i className="ri-file-chart-line text-white text-sm" />
              </div>
              <span className="text-base font-extrabold text-gray-900">Facture<span className="text-green-600">Smart</span></span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Comptabilité</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              <Shield className="w-3 h-3 text-indigo-500" />
              <span className="font-semibold">Conforme SYSCOHADA</span>
            </div>
            <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <i className="ri-filter-3-line text-green-600" />
              Filtres
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 bg-white"
            >
              {["Janvier 2026", "Février 2026", "Mars 2026", "Avril 2026"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 ml-2">Exercice 2026 — Congo, RDC</span>
          </div>
        </div>

        {/* Balance table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="text-left px-4 py-3 w-8">N°</th>
                  <th className="text-left px-4 py-3">Compte</th>
                  <th className="text-center px-3 py-3" colSpan={2}>Solde initial</th>
                  <th className="text-center px-3 py-3 border-l border-gray-100" colSpan={2}>Mouvements</th>
                  <th className="text-center px-3 py-3 border-l border-gray-100" colSpan={2}>Solde final</th>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-2" />
                  <th className="px-4 py-2" />
                  <th className="text-right px-3 py-2">Débit</th>
                  <th className="text-right px-3 py-2">Crédit</th>
                  <th className="text-right px-3 py-2 border-l border-gray-100">Débit</th>
                  <th className="text-right px-3 py-2">Crédit</th>
                  <th className="text-right px-3 py-2 border-l border-gray-100">Débit</th>
                  <th className="text-right px-3 py-2">Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <div className="flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" /></div>
                    </td>
                  </tr>
                ) : balanceEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">Aucune écriture comptable</td>
                  </tr>
                ) : (
                  balanceEntries.map((a, idx) => (
                    <tr key={a.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-mono font-bold text-gray-900">{a.code}</div>
                        <div className="text-[10px] text-gray-400">{a.compte_label}</div>
                      </td>
                      {/* Solde initial — non disponible dans v_balance */}
                      <td className="px-3 py-2.5 text-right text-gray-300">—</td>
                      <td className="px-3 py-2.5 text-right text-gray-300">—</td>
                      {/* Mouvements — non disponible dans v_balance */}
                      <td className="px-3 py-2.5 text-right text-gray-300 border-l border-gray-100">—</td>
                      <td className="px-3 py-2.5 text-right text-gray-300">—</td>
                      {/* Solde final */}
                      <td className={`px-3 py-2.5 text-right font-mono border-l border-gray-100 font-bold ${a.total_debit > 0 ? "text-green-700" : "text-gray-300"}`}>
                        {a.total_debit > 0 ? fmt(a.total_debit) : "—"}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${a.total_credit > 0 ? "text-red-700" : "text-gray-300"}`}>
                        {a.total_credit > 0 ? fmt(a.total_credit) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-green-50 border-t-2 border-green-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-xs font-extrabold text-gray-900">TOTAUX</td>
                  <td className="px-3 py-3 text-right font-mono font-extrabold text-gray-300">—</td>
                  <td className="px-3 py-3 text-right font-mono font-extrabold text-gray-300">—</td>
                  <td className="px-3 py-3 text-right font-mono font-extrabold text-gray-300 border-l border-gray-100">—</td>
                  <td className="px-3 py-3 text-right font-mono font-extrabold text-gray-300">—</td>
                  <td className="px-3 py-3 text-right font-mono font-extrabold text-green-700 border-l border-gray-100">{fmt(totalFinalDebit)}</td>
                  <td className="px-3 py-3 text-right font-mono font-extrabold text-red-700">{fmt(totalFinalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              Soldes débiteurs en vert
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              Soldes créditeurs en rouge
            </div>
            <div className="ml-auto text-xs text-gray-400">
              Balance conforme SYSCOHADA — {balanceEntries.length} comptes affichés
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
