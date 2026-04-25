import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useEcrituresComptables,
  useJournauxComptables,
  useExerciceCourant,
  JOURNAL_COLORS,
} from "@/hooks/useComptabiliteOHADA";

const PAGE_SIZE = 8;

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getJournalColor(journalType?: string): { bg: string; text: string } {
  if (!journalType) return { bg: "bg-gray-50", text: "text-gray-600" };
  const colors = JOURNAL_COLORS[journalType];
  return colors ? { bg: colors.bg, text: colors.text } : { bg: "bg-gray-50", text: "text-gray-600" };
}

export default function ComptaJournal() {
  const [month, setMonth] = useState("Avril 2026");
  const [journalFilter, setJournalFilter] = useState("Tous les journaux");
  const [pieceFilter, setPieceFilter] = useState("");
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
  const { data: ecritures = [], isLoading: ecrituresLoading } = useEcrituresComptables(companyId);
  const { data: journaux = [] } = useJournauxComptables();

  // Map ecritures to display entries with journal colors
  const journalEntries = ecritures.map((e) => {
    const journal = journaux.find((j) => j.id === e.journal_id);
    const color = getJournalColor(journal?.type);
    return {
      id: e.id,
      date: e.date_ecriture ? new Date(e.date_ecriture).toLocaleDateString('fr-FR') : '',
      piece: e.piece_numero,
      compte: e.compte_code,
      compteLabel: typeof e.plan_comptable === 'object' && e.plan_comptable !== null
        ? (e.plan_comptable as { label?: string }).label || e.compte_code
        : e.compte_code,
      libelle: e.libelle,
      journal: journal?.nom || e.journal_id,
      journalColor: color,
      debit: e.debit,
      credit: e.credit,
    };
  });

  const filtered = journalEntries.filter((e) => {
    const matchPiece = !pieceFilter || e.piece.toLowerCase().includes(pieceFilter.toLowerCase());
    const matchJournal = journalFilter === "Tous les journaux" || e.journal === journalFilter;
    return matchPiece && matchJournal;
  });

  const totalDebit = filtered.reduce((s, e) => s + e.debit, 0);
  const totalCredit = filtered.reduce((s, e) => s + e.credit, 0);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const journalOptions = ["Tous les journaux", ...journaux.map((j) => j.nom)];

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
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 bg-white"
            >
              {["Janvier 2026", "Février 2026", "Mars 2026", "Avril 2026"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              value={journalFilter}
              onChange={(e) => { setJournalFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white"
            >
              {journalOptions.map((j) => (
                <option key={j}>{j}</option>
              ))}
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Filtrer par n° pièce..."
                value={pieceFilter}
                onChange={(e) => { setPieceFilter(e.target.value); setPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
              />
            </div>
          </div>
        </div>

        {/* Journal table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">N° Pièce</th>
                  <th className="text-left px-4 py-3">Journal</th>
                  <th className="text-left px-4 py-3">Compte</th>
                  <th className="text-left px-4 py-3">Libellé</th>
                  <th className="text-right px-4 py-3">Débit</th>
                  <th className="text-right px-4 py-3">Crédit</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ecrituresLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <div className="flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" /></div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">Aucune écriture trouvée</td>
                  </tr>
                ) : (
                  paginated.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700 font-medium">{e.date}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">{e.piece}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.journalColor.bg} ${e.journalColor.text}`}>
                          {e.journal}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-gray-900">{e.compte}</span>
                        <span className="ml-2 text-gray-400 text-[10px]">{e.compteLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{e.libelle}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${e.debit > 0 ? "text-gray-900" : "text-gray-300"}`}>
                        {e.debit > 0 ? fmt(e.debit) : "—"}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${e.credit > 0 ? "text-gray-900" : "text-gray-300"}`}>
                        {e.credit > 0 ? fmt(e.credit) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-gray-400 hover:text-green-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-xs font-extrabold text-gray-900">TOTAUX</td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-gray-900">{fmt(totalDebit)}</td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-gray-900">{fmt(totalCredit)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} écritures
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
