import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Download, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Search, Filter, Landmark, Banknote, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useComptesFinanciers } from "@/hooks/useComptesFinanciers";

type Devise = "USD" | "CDF" | "CNY";

const DEVISE_SYMBOLS: Record<Devise, string> = {
  USD: "$",
  CDF: "FC",
  CNY: "¥",
};

function fmt(n: number, devise: Devise = "USD"): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR");
}

type ReleveStatut = "reconcilié" | "écart" | "en_attente";

const STATUT_CONFIG: Record<ReleveStatut, { label: string; icon: typeof CheckCircle2; bg: string; text: string }> = {
  reconcilié: { label: "Rapproché", icon: CheckCircle2, bg: "bg-green-50", text: "text-green-600" },
  écart: { label: "Écart", icon: AlertCircle, bg: "bg-red-50", text: "text-red-600" },
  en_attente: { label: "En attente", icon: Clock, bg: "bg-amber-50", text: "text-amber-600" },
};

function TypeCompteIcon({ type }: { type: string }) {
  switch (type) {
    case "banque": return <Landmark className="w-5 h-5" />;
    case "mobile_money": return <Smartphone className="w-5 h-5" />;
    default: return <Banknote className="w-5 h-5" />;
  }
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  banque: { bg: "bg-blue-50", text: "text-blue-600" },
  mobile_money: { bg: "bg-purple-50", text: "text-purple-600" },
  cash: { bg: "bg-amber-50", text: "text-amber-600" },
};

export default function ComptaReleveBancaire() {
  const [selectedCompteId, setSelectedCompteId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activePeriod, setActivePeriod] = useState("Avril 2026");
  const PAGE_SIZE = 12;

  // Get companyId
  const { data: currentProfile } = useQuery({
    queryKey: ['my-profile-releve'],
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

  // Fetch all mouvements for selected account
  const { data: mouvements = [], isLoading: mouvementsLoading } = useQuery({
    queryKey: ['releve-mouvements', companyId, selectedCompteId],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('mouvements_comptes')
        .select(`
          *,
          compte:comptes_financiers(id, nom, type_compte, devise, solde_actuel),
          transaction:transactions(id, motif, type_transaction, client_id, reference)
        `)
        .order('date_mouvement', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedCompteId !== "ALL") {
        query = query.eq('compte_id', selectedCompteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Filter by search + paginate
  const filtered = mouvements.filter((m: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.transaction?.motif?.toLowerCase().includes(q) ||
      m.transaction?.reference?.toLowerCase().includes(q) ||
      m.libelle?.toLowerCase().includes(q) ||
      m.compte?.nom?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Get the selected compte details
  const selectedCompte = selectedCompteId === "ALL"
    ? null
    : comptes.find((c) => c.id === selectedCompteId);

  // Compute stats
  const totalDebits = filtered
    .filter((m: any) => m.type_mouvement === "debit")
    .reduce((s: number, m: any) => s + m.montant, 0);
  const totalCredits = filtered
    .filter((m: any) => m.type_mouvement === "credit")
    .reduce((s: number, m: any) => s + m.montant, 0);

  const filteredComptes = comptes.filter((c) => c.is_active);

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
                <Landmark className="text-white w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-gray-900">Facture<span className="text-green-600">Smart</span></span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Relevé Bancaire</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Sélecteur de compte + résumé */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-900">Relevé des comptes</h2>
            <div className="flex items-center gap-2">
              <select
                value={activePeriod}
                onChange={(e) => setActivePeriod(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white"
              >
                {["Janvier 2026", "Février 2026", "Mars 2026", "Avril 2026"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Account cards / selector */}
          {comptesLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setSelectedCompteId("ALL"); setPage(1); }}
                className={`px-4 py-3 rounded-xl border text-left transition-all ${
                  selectedCompteId === "ALL"
                    ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
              >
                <p className="text-xs font-extrabold text-gray-900">Tous les comptes</p>
                <p className="text-xs text-gray-400 mt-0.5">{filteredComptes.length} comptes</p>
              </button>
              {filteredComptes.map((c) => {
                const devise = c.devise as Devise;
                const typeColor = TYPE_COLORS[c.type_compte] || { bg: "bg-gray-50", text: "text-gray-600" };
                const isSelected = selectedCompteId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCompteId(c.id); setPage(1); }}
                    className={`px-4 py-3 rounded-xl border text-left transition-all min-w-[180px] ${
                      isSelected
                        ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-lg ${typeColor.bg} flex items-center justify-center ${typeColor.text}`}>
                        <TypeCompteIcon type={c.type_compte} />
                      </div>
                      <span className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{c.nom}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs font-extrabold ${parseFloat(c.solde_actuel.toString()) >= 0 ? "text-gray-900" : "text-red-500"}`}>
                        {parseFloat(c.solde_actuel.toString()).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${typeColor.bg} ${typeColor.text}`}>
                        {devise === "USD" ? "$" : devise === "CDF" ? "FC" : "¥"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filtres et barre de recherche */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter className="w-4 h-4 text-green-600" />
              Filtres
            </div>
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par motif, référence, compte..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl">
              <span>Débits: <span className="font-bold text-red-600">{totalDebits.toLocaleString("fr-FR", { minimumFractionDigits: 0 })}</span></span>
              <span className="text-gray-300">|</span>
              <span>Crédits: <span className="font-bold text-green-600">{totalCredits.toLocaleString("fr-FR", { minimumFractionDigits: 0 })}</span></span>
              {selectedCompte && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>Solde: <span className={`font-bold ${parseFloat(selectedCompte.solde_actuel.toString()) >= 0 ? "text-gray-900" : "text-red-500"}`}>
                    {parseFloat(selectedCompte.solde_actuel.toString()).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  </span></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tableau des mouvements */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Compte</th>
                  <th className="text-left px-4 py-3">Réf.</th>
                  <th className="text-left px-4 py-3">Libellé</th>
                  <th className="text-right px-4 py-3">Débit</th>
                  <th className="text-right px-4 py-3">Crédit</th>
                  <th className="text-right px-4 py-3">Solde</th>
                  <th className="text-center px-4 py-3">Statut</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mouvementsLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      <div className="flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" /></div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400 text-sm">
                      {searchQuery ? "Aucun résultat pour cette recherche" : "Aucun mouvement trouvé pour la période"}
                    </td>
                  </tr>
                ) : (
                  paginated.map((m: any) => {
                    const isDebit = m.type_mouvement === "debit";
                    const devise: Devise = m.compte?.devise || "USD";
                    // Simulated status based on whether there's a related transaction
                    const statut: ReleveStatut = m.transaction?.id ? "reconcilié" : "en_attente";
                    const statutCfg = STATUT_CONFIG[statut];
                    const StatutIcon = statutCfg.icon;
                    const typeColor = TYPE_COLORS[m.compte?.type_compte] || { bg: "bg-gray-50", text: "text-gray-600" };

                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{fmtDate(m.date_mouvement)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded ${typeColor.bg} flex items-center justify-center ${typeColor.text}`}>
                              <TypeCompteIcon type={m.compte?.type_compte} />
                            </div>
                            <span className="font-semibold text-gray-900 text-[11px]">{m.compte?.nom || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-500 text-[10px]">{m.transaction?.reference || "—"}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                          {m.transaction?.motif || m.libelle || "—"}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${isDebit ? "text-red-600" : "text-gray-300"}`}>
                          {isDebit ? fmt(m.montant, devise) : "—"}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${!isDebit ? "text-green-600" : "text-gray-300"}`}>
                          {!isDebit ? fmt(m.montant, devise) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                          {m.solde_apres?.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${statutCfg.bg} ${statutCfg.text}`}>
                            <StatutIcon className="w-3 h-3" />
                            {statutCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-gray-400 hover:text-green-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs font-extrabold text-gray-900">TOTAUX</td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-red-600">
                    {totalDebits.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-green-600">
                    {totalCredits.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} mouvements
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
