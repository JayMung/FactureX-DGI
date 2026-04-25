import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanComptable } from "@/hooks/useComptabiliteOHADA";
import type { PlanCompte } from "@/hooks/useComptabiliteOHADA";

interface Account extends PlanCompte {
  colorClass: string;
}

function getColorClassForClasse(classe: number): string {
  const colors: Record<number, string> = {
    1: "border-l-blue-500",
    2: "border-l-green-500",
    3: "border-l-yellow-500",
    4: "border-l-purple-500",
    5: "border-l-red-500",
    6: "border-l-cyan-500",
    7: "border-l-lime-500",
    8: "border-l-gray-400",
  };
  return colors[classe] ?? "border-l-gray-400";
}

const PAGE_SIZE = 10;

const classeColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-500" },
  2: { bg: "bg-green-50", text: "text-green-700", border: "border-green-500" },
  3: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-500" },
  4: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-500" },
  5: { bg: "bg-red-50", text: "text-red-700", border: "border-red-500" },
  6: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-500" },
  7: { bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-500" },
  8: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-400" },
};

const natureColors: Record<string, { bg: string; text: string }> = {
  Actif: { bg: "bg-blue-50", text: "text-blue-700" },
  Passif: { bg: "bg-red-50", text: "text-red-700" },
  Charge: { bg: "bg-gray-100", text: "text-gray-700" },
  Produit: { bg: "bg-lime-100", text: "text-lime-700" },
  Hors_bilan: { bg: "bg-orange-100", text: "text-orange-700" },
};

function formatSolde(n: number) {
  const abs = Math.abs(n);
  const formatted = abs >= 1000 ? `${(abs / 1000).toFixed(0)} ${abs >= 1000000 ? "M" : "K"} $` : `${abs} $`;
  return n >= 0 ? formatted : `-${formatted}`;
}

export default function ComptaPlanComptable() {
  const [search, setSearch] = useState("");
  const [classeFilter, setClasseFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

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
  const { data: planComptes = [], isLoading } = usePlanComptable(companyId);

  // Map PlanCompte to Account with computed colorClass and solde
  const allAccounts: Account[] = planComptes.map((p) => ({
    ...p,
    colorClass: getColorClassForClasse(p.classe),
    // Compute net solde from debit/credit
    solde: (p.solde_debit || 0) - (p.solde_credit || 0),
  }));

  const filtered = allAccounts.filter((a) => {
    const matchSearch =
      !search ||
      a.code.includes(search) ||
      (a.custom_label || a.label).toLowerCase().includes(search.toLowerCase());
    const matchClasse = classeFilter === "all" || a.classe === parseInt(classeFilter);
    const matchType = typeFilter === "all" || a.nature === typeFilter;
    return matchSearch && matchClasse && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              <i className="ri-shield-check-line text-indigo-500" />
              <span className="font-semibold">Conforme SYSCOHADA</span>
            </div>
            <button className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm">
              <i className="ri-add-line" />
              Nouveau compte
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total comptes", value: allAccounts.length, mono: true },
            { label: "Classes actives", value: 8, mono: false },
            { label: "Classe 4 — Tiers", value: allAccounts.filter(a => a.classe === 4).length, mono: true },
            { label: "Dernière mise à jour", value: new Date().toLocaleDateString('fr-FR'), mono: false },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={`text-2xl font-extrabold text-gray-900 ${s.mono ? "font-mono" : ""}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par code ou libellé..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-300 bg-white"
              />
            </div>
            <select
              value={classeFilter}
              onChange={(e) => { setClasseFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-100 bg-white"
            >
              <option value="all">Toutes les classes</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
                <option key={c} value={c}>Classe {c}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-100 bg-white"
            >
              <option value="all">Tous les types</option>
              <option>Actif</option>
              <option>Passif</option>
              <option>Charge</option>
              <option>Produit</option>
            </select>
            <button className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* OHADA Classes reference */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Classes OHADA :</span>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
            <span
              key={c}
              className={`px-2 py-0.5 rounded text-xs font-semibold border-l-2 ${classeColors[c].bg} ${classeColors[c].text} ${classeColors[c].border}`}
            >
              Cl.{c}
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="text-left px-4 py-3">Classe</th>
                  <th className="text-left px-4 py-3">Code</th>
                  <th className="text-left px-4 py-3">Libellé</th>
                  <th className="text-center px-4 py-3">Nature</th>
                  <th className="text-center px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Solde</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((a) => (
                  <tr key={a.code} className={`hover:bg-gray-50 transition-colors ${a.colorClass} border-l-[3px]`}>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${classeColors[a.classe].bg} ${classeColors[a.classe].text}`}>
                        Cl.{a.classe}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{a.code}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{a.label}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${natureColors[a.nature].bg} ${natureColors[a.nature].text}`}>
                        {a.nature}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{a.type}</td>
                    <td className={`px-4 py-3 text-right font-mono font-extrabold ${a.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {a.solde >= 0 ? formatSolde(a.solde) : `(${formatSolde(a.solde)})`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-gray-400 hover:text-green-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                      Aucun compte trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} comptes
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold disabled:cursor-not-allowed hover:bg-gray-200"
              >
                Préc.
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${p === page ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 3 && (
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold disabled:cursor-not-allowed hover:bg-gray-200"
                >
                  Suiv.
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
