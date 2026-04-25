import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Download, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Landmark, CreditCard, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useComptesFinanciers } from "@/hooks/useComptesFinanciers";

type Devise = "USD" | "CDF" | "CNY";

const DEVISE_SYMBOLS: Record<Devise, string> = {
  USD: "$",
  CDF: "FC",
  CNY: "¥",
};

const DEVISE_FLAGS: Record<Devise, string> = {
  USD: "🇺🇸",
  CDF: "🇨🇩",
  CNY: "🇨🇳",
};

const DEVISE_COLORS: Record<Devise, { from: string; to: string; text: string; bg: string; icon: typeof DollarSign }> = {
  USD: { from: "from-emerald-500", to: "to-emerald-600", text: "text-emerald-600", bg: "bg-emerald-50", icon: DollarSign },
  CDF: { from: "from-blue-500", to: "to-blue-600", text: "text-blue-600", bg: "bg-blue-50", icon: Landmark },
  CNY: { from: "from-red-500", to: "to-red-600", text: "text-red-600", bg: "bg-red-50", icon: CreditCard },
};

function fmt(n: number, devise: Devise = "USD"): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + DEVISE_SYMBOLS[devise];
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR");
}

function DeviseBadge({ devise }: { devise: Devise }) {
  const c = DEVISE_COLORS[devise];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${c.bg} ${c.text}`}>
      {c.icon && <c.icon className="w-3 h-3" />}
      {devise}
    </span>
  );
}

export default function ComptaTresorerie() {
  const [activeDevise, setActiveDevise] = useState<Devise | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Get companyId from current user's profile
  const { data: currentProfile } = useQuery({
    queryKey: ['my-profile-treso'],
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
  const { comptes, loading: comptesLoading } = useComptesFinanciers();

  // Fetch exchange rates
  const { data: exchangeRates } = useQuery({
    queryKey: ['taux-change'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('cle, valeur')
        .eq('categorie', 'taux_change')
        .in('cle', ['usdToCny', 'usdToCdf']);
      const rates: Record<string, number> = { usdToCny: 6.95, usdToCdf: 2200 };
      data?.forEach((s: any) => {
        rates[s.cle] = parseFloat(s.valeur) || rates[s.cle];
      });
      return rates;
    },
  });

  // Fetch latest mouvements (all comptes)
  const { data: latestMouvements = [], isLoading: mouvementsLoading } = useQuery({
    queryKey: ['derniers-mouvements', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('mouvements_comptes')
        .select(`
          *,
          compte:comptes_financiers(id, nom, type_compte, devise),
          transaction:transactions(id, motif, type_transaction)
        `)
        .order('date_mouvement', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Group comptes by devise and compute aggregates
  const deviseData = (["USD", "CDF", "CNY"] as Devise[]).map((devise) => {
    const filtered = comptes.filter((c) => c.devise === devise && c.is_active);
    const totalSolde = filtered.reduce((s, c) => s + parseFloat(c.solde_actuel.toString()), 0);
    const totalDepot = filtered.reduce((s, c) => s + parseFloat(c.solde_actuel.toString() > 0 ? c.solde_actuel.toString() : "0"), 0);
    return { devise, comptes: filtered, totalSolde, nbComptes: filtered.length };
  });

  // Filter movements
  const filteredMouvements = latestMouvements.filter((m: any) => {
    if (activeDevise === "ALL") return true;
    return m.compte?.devise === activeDevise;
  });

  const totalPages = Math.ceil(filteredMouvements.length / PAGE_SIZE);
  const paginated = filteredMouvements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Compute totals in USD equivalent
  const totalSoldeUSD = deviseData.reduce((s, d) => {
    const rate = d.devise === "USD" ? 1 : d.devise === "CDF" ? (1 / (exchangeRates?.usdToCdf || 2200)) : (1 / (exchangeRates?.usdToCny || 6.95));
    return s + d.totalSolde * rate;
  }, 0);

  const totalComptes = comptes.filter((c) => c.is_active).length;

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
                <TrendingUp className="text-white w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-gray-900">Facture<span className="text-green-600">Smart</span></span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Trésorerie</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold flex items-center gap-2 hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Résumé global */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-900">Vue d'ensemble — Trésorerie</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{totalComptes} compte{totalComptes > 1 ? "s" : ""} actif{totalComptes > 1 ? "s" : ""}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>Solde global ~ {totalSoldeUSD.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} $</span>
            </div>
          </div>

          {comptesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deviseData.map(({ devise, totalSolde, nbComptes, comptes: deviseComptes }) => {
                const colors = DEVISE_COLORS[devise];
                const Icon = colors.icon;
                return (
                  <button
                    key={devise}
                    onClick={() => {
                      setActiveDevise(activeDevise === devise ? "ALL" : devise);
                      setPage(1);
                    }}
                    className={`relative overflow-hidden rounded-xl border p-4 transition-all text-left ${
                      activeDevise === devise ? "ring-2 ring-green-500 border-green-500 shadow-md" : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full ${colors.from} ${colors.to} opacity-10`} />
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <DeviseBadge devise={devise} />
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{nbComptes} compte{nbComptes > 1 ? "s" : ""}</p>
                    <p className={`text-lg font-extrabold mt-0.5 ${devise === "CDF" ? "text-gray-900" : devise === "CNY" ? "text-gray-900" : "text-gray-900"}`}>
                      {totalSolde.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {DEVISE_SYMBOLS[devise]}
                    </p>
                    <div className="mt-2 space-y-1">
                      {deviseComptes.slice(0, 3).map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 truncate max-w-[120px]">{c.nom}</span>
                          <span className={`font-semibold ${parseFloat(c.solde_actuel.toString()) >= 0 ? "text-gray-700" : "text-red-500"}`}>
                            {parseFloat(c.solde_actuel.toString()).toLocaleString("fr-FR", { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                      {deviseComptes.length > 3 && (
                        <p className="text-xs text-gray-300 mt-1">+{deviseComptes.length - 3} autre{deviseComptes.length - 3 > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tableau de bord par devise active / Derniers mouvements */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-gray-900">Derniers mouvements</h2>
              {activeDevise !== "ALL" && <DeviseBadge devise={activeDevise} />}
            </div>
            <div className="flex items-center gap-2">
              {(["ALL", "USD", "CDF", "CNY"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => { setActiveDevise(d); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeDevise === d
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {d === "ALL" ? "Tous" : d}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Compte</th>
                  <th className="text-left px-4 py-3">Motif</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Montant</th>
                  <th className="text-right px-4 py-3">Solde après</th>
                  <th className="text-center px-4 py-3">Devise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mouvementsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <div className="flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" /></div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">Aucun mouvement trouvé</td>
                  </tr>
                ) : (
                  paginated.map((m: any) => {
                    const isDebit = m.type_mouvement === "debit";
                    const devise: Devise = m.compte?.devise || "USD";
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 font-medium">{fmtDate(m.date_mouvement)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{m.compte?.nom || "—"}</span>
                            <span className="text-gray-400 text-[10px]">{m.compte?.type_compte}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                          {m.transaction?.motif || m.libelle || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDebit ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                          }`}>
                            {isDebit ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                            {isDebit ? "Débit" : "Crédit"}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-extrabold ${isDebit ? "text-red-600" : "text-green-600"}`}>
                          {isDebit ? "−" : "+"}{m.montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                          {m.solde_apres?.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <DeviseBadge devise={devise} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredMouvements.length)} sur {filteredMouvements.length} mouvements
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold disabled:cursor-not-allowed hover:bg-gray-200"
                >
                  Préc.
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-gray-900">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold disabled:cursor-not-allowed hover:bg-gray-200"
                >
                  Suiv.
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
