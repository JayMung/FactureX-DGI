import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGrandLivre, usePlanComptable, JOURNAL_COLORS } from "@/hooks/useComptabiliteOHADA";

interface GLEntry {
  date: string;
  piece: string;
  journal: string;
  journalColor: { bg: string; text: string };
  libelle: string;
  lettre: string;
  debit: number;
  credit: number;
  solde: number;
}

interface AccountOption {
  code: string;
  label: string;
}

const accounts: AccountOption[] = [
  { code: "4111", label: "Clients — facturas en cours" },
  { code: "4011", label: "Fournisseurs — nationaux" },
  { code: "5211", label: "Banque Rawbank" },
  { code: "5711", label: "Caisse principale" },
  { code: "7011", label: "Ventes de marchandises" },
];

const glData: Record<string, { totalDebit: number; totalCredit: number; solde: number; entries: GLEntry[] }> = {
  "4111": {
    totalDebit: 247890,
    totalCredit: 158440,
    solde: 89450,
    entries: [
      { date: "01/01/2026", piece: "—", journal: "—", journalColor: { bg: "bg-gray-100", text: "text-gray-400" }, libelle: "Solde initial au 01/01/2026", lettre: "—", debit: 0, credit: 0, solde: 0 },
      { date: "05/01/2026", piece: "FAC-2026-0001", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Facture n° FAC-2026-0001 — Kin Import SARL", lettre: "A", debit: 14520.00, credit: 0, solde: 14520.00 },
      { date: "12/01/2026", piece: "FAC-2026-0003", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Facture n° FAC-2026-0003 — Asbl Lumière", lettre: "B", debit: 8900.00, credit: 0, solde: 23420.00 },
      { date: "20/01/2026", piece: "FAC-2026-0001", journal: "TRESO", journalColor: { bg: "bg-orange-50", text: "text-orange-700" }, libelle: "Règlement Kin Import SARL — M-Pesa", lettre: "A", debit: 0, credit: 14520.00, solde: 8900.00 },
      { date: "15/02/2026", piece: "FAC-2026-0007", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Facture n° FAC-2026-0007 — Kimbélavo Sprl", lettre: "C", debit: 34500.00, credit: 0, solde: 43400.00 },
      { date: "23/04/2026", piece: "FAC-2026-0142", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Facture n° FAC-2026-0142 — Congo Tech SARL", lettre: "—", debit: 1463.20, credit: 0, solde: 44863.20 },
      { date: "23/04/2026", piece: "FAC-2026-0142", journal: "TRESO", journalColor: { bg: "bg-orange-50", text: "text-orange-700" }, libelle: "Règlement Asbl Lumière — Airtel Money", lettre: "B", debit: 0, credit: 8900.00, solde: 35963.20 },
    ],
  },
  "4011": {
    totalDebit: 45200,
    totalCredit: 45200,
    solde: -45200,
    entries: [
      { date: "01/01/2026", piece: "—", journal: "—", journalColor: { bg: "bg-gray-100", text: "text-gray-400" }, libelle: "Solde initial au 01/01/2026", lettre: "—", debit: 0, credit: 0, solde: 0 },
      { date: "10/02/2026", piece: "ACH-2026-0001", journal: "Achats", journalColor: { bg: "bg-orange-50", text: "text-orange-700" }, libelle: "Dette fournisseur — Congo Distribution", lettre: "A", debit: 0, credit: 8500.00, solde: 8500.00 },
      { date: "15/03/2026", piece: "ACH-2026-0003", journal: "Achats", journalColor: { bg: "bg-orange-50", text: "text-orange-700" }, libelle: "Dette fournisseur — Maxi Prix SPRL", lettre: "B", debit: 0, credit: 12450.00, solde: 20950.00 },
      { date: "20/04/2026", piece: "ACH-2026-0089", journal: "Achats", journalColor: { bg: "bg-orange-50", text: "text-orange-700" }, libelle: "Règlement Congo Distribution — Airtel Money", lettre: "A", debit: 8500.00, credit: 0, solde: 12450.00 },
      { date: "22/04/2026", piece: "ACH-2026-0045", journal: "Achats", journalColor: { bg: "bg-orange-50", text: "text-orange-700" }, libelle: "Dette nouveau fournisseur —Kin Auto SARL", lettre: "C", debit: 0, credit: 32750.00, solde: 45200.00 },
    ],
  },
  "5211": {
    totalDebit: 248000,
    totalCredit: 13900,
    solde: 234100,
    entries: [
      { date: "01/01/2026", piece: "—", journal: "—", journalColor: { bg: "bg-gray-100", text: "text-gray-400" }, libelle: "Solde initial au 01/01/2026", lettre: "—", debit: 0, credit: 0, solde: 0 },
      { date: "05/01/2026", piece: "OD-2026-0001", journal: "OD", journalColor: { bg: "bg-indigo-50", text: "text-indigo-700" }, libelle: "Apport en compte courant associés", lettre: "A", debit: 200000.00, credit: 0, solde: 200000.00 },
      { date: "15/02/2026", piece: "TRESO-0012", journal: "Trésorerie", journalColor: { bg: "bg-green-50", text: "text-green-700" }, libelle: "Virement bancaire — paiement fournisseur", lettre: "B", debit: 0, credit: 8500.00, solde: 191500.00 },
      { date: "20/03/2026", piece: "OD-2026-0015", journal: "OD", journalColor: { bg: "bg-indigo-50", text: "text-indigo-700" }, libelle: "Acquisition matériel informatique", lettre: "C", debit: 48000.00, credit: 0, solde: 239500.00 },
      { date: "10/04/2026", piece: "TRESO-0028", journal: "Trésorerie", journalColor: { bg: "bg-green-50", text: "text-green-700" }, libelle: "Encaissement客户端 — virement Rawbank", lettre: "D", debit: 13900.00, credit: 0, solde: 253400.00 },
    ],
  },
  "5711": {
    totalDebit: 24850,
    totalCredit: 12400,
    solde: 12450,
    entries: [
      { date: "01/01/2026", piece: "—", journal: "—", journalColor: { bg: "bg-gray-100", text: "text-gray-400" }, libelle: "Solde initial au 01/01/2026", lettre: "—", debit: 0, credit: 0, solde: 0 },
      { date: "03/01/2026", piece: "OD-2026-0002", journal: "OD", journalColor: { bg: "bg-indigo-50", text: "text-indigo-700" }, libelle: "Fonds de caisse initial", lettre: "A", debit: 10000.00, credit: 0, solde: 10000.00 },
      { date: "15/01/2026", piece: "TRESO-0004", journal: "Trésorerie", journalColor: { bg: "bg-green-50", text: "text-green-700" }, libelle: "Encaissement点小客户 — espèces", lettre: "B", debit: 4850.00, credit: 0, solde: 14850.00 },
      { date: "28/01/2026", piece: "TRESO-0008", journal: "Trésorerie", journalColor: { bg: "bg-green-50", text: "text-green-700" }, libelle: "Paiement fournisseur — espèces", lettre: "C", debit: 0, credit: 3400.00, solde: 11450.00 },
      { date: "20/02/2026", piece: "TRESO-0015", journal: "Trésorerie", journalColor: { bg: "bg-green-50", text: "text-green-700" }, libelle: "Encaissement client Asbl Lumière", lettre: "D", debit: 10000.00, credit: 0, solde: 21450.00 },
      { date: "15/03/2026", piece: "TRESO-0020", journal: "Trésorerie", journalColor: { bg: "bg-green-50", text: "text-green-700" }, libelle: "Paiement acompt IRPP", lettre: "E", debit: 0, credit: 9000.00, solde: 12450.00 },
    ],
  },
  "7011": {
    totalDebit: 0,
    totalCredit: 487200,
    solde: -487200,
    entries: [
      { date: "01/01/2026", piece: "—", journal: "—", journalColor: { bg: "bg-gray-100", text: "text-gray-400" }, libelle: "Solde initial au 01/01/2026", lettre: "—", debit: 0, credit: 0, solde: 0 },
      { date: "05/01/2026", piece: "FAC-2026-0001", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Vente marchandises — Kin Import SARL", lettre: "A", debit: 0, credit: 14520.00, solde: -14520.00 },
      { date: "12/01/2026", piece: "FAC-2026-0003", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Vente marchandises — Asbl Lumière", lettre: "B", debit: 0, credit: 8900.00, solde: -23420.00 },
      { date: "15/02/2026", piece: "FAC-2026-0007", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Vente marchandises — Kimbélavo Sprl", lettre: "C", debit: 0, credit: 34500.00, solde: -57920.00 },
      { date: "20/03/2026", piece: "FAC-2026-0012", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Vente prestations — Congo Freight SARL", lettre: "D", debit: 0, credit: 125000.00, solde: -182920.00 },
      { date: "23/04/2026", piece: "FAC-2026-0142", journal: "Ventes", journalColor: { bg: "bg-blue-50", text: "text-blue-700" }, libelle: "Vente marchandises — Congo Tech SARL", lettre: "E", debit: 0, credit: 1463.20, solde: -184383.20 },
    ],
  },
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ComptaGrandLivre() {
  const [selectedAccount, setSelectedAccount] = useState("4111");
  const [month, setMonth] = useState("Avril 2026");

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
  const { data: planComptes = [] } = usePlanComptable(companyId);
  const { data: grandLivre, isLoading: glLoading } = useGrandLivre(companyId, selectedAccount);

  // Build account list from plan comptable
  const accounts = planComptes.map((p) => ({ code: p.code, label: p.label || p.code }));

  // Build GL entries from grand livre data
  const entries = (grandLivre?.entries || []).map((e) => {
    const color = { bg: "bg-gray-100", text: "text-gray-400" }; // fallback
    return {
      id: e.id,
      date: e.date_ecriture ? new Date(e.date_ecriture).toLocaleDateString('fr-FR') : '',
      piece: e.piece_numero || '—',
      journal: typeof e.journaux_comptables === 'object' && e.journaux_comptables !== null
        ? (e.journaux_comptables as { nom?: string }).nom || '—'
        : '—',
      journalColor: color,
      libelle: e.libelle,
      lettre: e.lettrage || '—',
      debit: e.debit,
      credit: e.credit,
      solde: 0, // computed below
    };
  });

  // Compute running saldo for each entry
  let runningSolde = 0;
  const entriesWithSolde = entries.map((e) => {
    runningSolde += e.debit - e.credit;
    return { ...e, solde: runningSolde };
  });

  const data = grandLivre ? {
    totalDebit: grandLivre.total_debit,
    totalCredit: grandLivre.total_credit,
    solde: grandLivre.solde,
    entries: entriesWithSolde,
  } : { totalDebit: 0, totalCredit: 0, solde: 0, entries: [] as typeof entriesWithSolde };

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
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Grand Livre</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white">
              <option>Exercice 2026</option>
              <option>Exercice 2025</option>
            </select>
            <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Account selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <i className="ri-book-2-line text-green-600" />
              Compte affiché :
            </div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 bg-white flex-1 min-w-64"
            >
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.label}
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white"
            >
              {["Tous les mois", "Janvier", "Février", "Mars", "Avril 2026"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <button className="ml-auto px-4 py-2.5 rounded-xl bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors">
              Lettrer
            </button>
          </div>
        </div>

        {/* Account summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total débit", value: `${fmt(data.totalDebit)} $`, color: "text-gray-900" },
            { label: "Total crédit", value: `${fmt(data.totalCredit)} $`, color: "text-gray-900" },
            { label: "Solde débiteur", value: data.solde >= 0 ? `${fmt(data.solde)} $` : "—", color: data.solde >= 0 ? "text-green-600" : "text-gray-300" },
            { label: "Solde créditeur", value: data.solde < 0 ? `${fmt(Math.abs(data.solde))} $` : "—", color: data.solde < 0 ? "text-red-600" : "text-gray-300" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={`text-xl font-extrabold font-mono ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Grand livre entries */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">N° Pièce</th>
                  <th className="text-left px-4 py-3">Journal</th>
                  <th className="text-left px-4 py-3">Libellé</th>
                  <th className="text-center px-4 py-3">Lettre</th>
                  <th className="text-right px-4 py-3">Débit ($)</th>
                  <th className="text-right px-4 py-3">Crédit ($)</th>
                  <th className="text-right px-4 py-3">Solde ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.entries.map((entry, idx) => (
                  <tr
                    key={`${entry.piece}-${idx}`}
                    className={`hover:bg-gray-50 transition-colors ${idx === 0 ? "bg-gray-50 font-bold" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ color: idx === 0 ? "#6B7280" : "#111827" }}>
                      {entry.date}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: idx === 0 ? "#9CA3AF" : "#6B7280" }}>
                      {entry.piece}
                    </td>
                    <td className="px-4 py-3">
                      {entry.journal === "—" ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${entry.journalColor.bg} ${entry.journalColor.text}`}>
                          {entry.journal}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" style={{ color: idx === 0 ? "#9CA3AF" : "#374151" }}>
                      {entry.libelle}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.lettre === "—" ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          {entry.lettre}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${entry.debit > 0 ? "font-bold text-gray-900" : "text-gray-300"}`}>
                      {entry.debit > 0 ? fmt(entry.debit) : "—"}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${entry.credit > 0 ? "font-bold text-gray-900" : "text-gray-300"}`}>
                      {entry.credit > 0 ? fmt(entry.credit) : "—"}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${data.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {entry.solde >= 0 ? fmt(entry.solde) : `(${fmt(Math.abs(entry.solde))})`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-50 border-t-2 border-green-200">
                  <td colSpan={5} className="px-4 py-3 text-xs font-bold text-gray-900">
                    Totaux du compte {selectedAccount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-gray-900">{fmt(data.totalDebit)} $</td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-gray-900">{fmt(data.totalCredit)} $</td>
                  <td className={`px-4 py-3 text-right font-mono font-extrabold ${data.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.solde >= 0 ? fmt(data.solde) : `(${fmt(Math.abs(data.solde))})`} $
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
