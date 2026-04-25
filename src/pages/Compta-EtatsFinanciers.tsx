import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  ChevronLeft,
  Shield,
  FileText,
  ChartBar,
  ChartColumnIncreasing,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBilan, useCPR } from "@/hooks/useComptabiliteOHADA";

// ─── Types OHADA ───────────────────────────────────────────────
interface LigneBilan {
  code: string;
  label: string;
  note: number;
  montant: number;
  isTotal: boolean;
  isSousTotal: boolean;
  depth: number;
}

interface CompteResultat {
  code: string;
  label: string;
  montant: number;
  isTotal: boolean;
  isSousTotal: boolean;
  depth: number;
  signe: "positif" | "negatif" | "neutre";
}

interface NoteAnnexe {
  numero: number;
  titre: string;
  contenu: string[];
}

// ─── DONNÉES EXERCICE 2026 ─────────────────────────────────────
const actifData: LigneBilan[] = [
  { code: "", label: "ACTIF NON COURANT", note: 0, montant: 0, isTotal: false, isSousTotal: true, depth: 0 },
  { code: "2111", label: "Terrains nus", note: 1, montant: 0, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "2181", label: "Matériel informatique", note: 2, montant: 66500, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "2182", label: "Mobilier de bureau", note: 2, montant: 7200, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "2183", label: "Matériel roulant", note: 2, montant: 35000, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "2481", label: "Dépôts et cautionnements versés", note: 3, montant: 500, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "", label: "Total Actif non courant", note: 0, montant: 109200, isTotal: true, isSousTotal: false, depth: 1 },
  { code: "", label: "ACTIF COURANT", note: 0, montant: 0, isTotal: false, isSousTotal: true, depth: 0 },
  { code: "3111", label: "Marchandises en stock", note: 4, montant: 90000, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "4111", label: "Clients et comptes rattachés", note: 5, montant: 125913, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "5211", label: "Banque Rawbank", note: 6, montant: 468200, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "5711", label: "Caisse principale", note: 6, montant: 24900, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "", label: "Total Actif courant", note: 0, montant: 709013, isTotal: true, isSousTotal: false, depth: 1 },
  { code: "", label: "TOTAL ACTIF", note: 0, montant: 818213, isTotal: true, isSousTotal: false, depth: 0 },
];

const passifData: LigneBilan[] = [
  { code: "", label: "CAPITAUX PROPRES", note: 0, montant: 0, isTotal: false, isSousTotal: true, depth: 0 },
  { code: "1011", label: "Capital social", note: 7, montant: 500000, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "1061", label: "Réserves légales", note: 8, montant: 25000, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "1201", label: "Résultat net de l'exercice", note: 9, montant: 214749, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "", label: "Total Capitaux propres", note: 0, montant: 739749, isTotal: true, isSousTotal: false, depth: 1 },
  { code: "", label: "PASSIF NON COURANT", note: 0, montant: 0, isTotal: false, isSousTotal: true, depth: 0 },
  { code: "", label: "Total Passif non courant", note: 0, montant: 0, isTotal: true, isSousTotal: false, depth: 1 },
  { code: "", label: "PASSIF COURANT", note: 0, montant: 0, isTotal: false, isSousTotal: true, depth: 0 },
  { code: "4011", label: "Fournisseurs et comptes rattachés", note: 10, montant: 77950, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "4452", label: "TVA due", note: 11, montant: 22464, isTotal: false, isSousTotal: false, depth: 1 },
  { code: "", label: "Total Passif courant", note: 0, montant: 100414, isTotal: true, isSousTotal: false, depth: 1 },
  { code: "", label: "TOTAL PASSIF", note: 0, montant: 818213, isTotal: true, isSousTotal: false, depth: 0 },
];

const chargesData: CompteResultat[] = [
  { code: "", label: "CHARGES D'EXPLOITATION", montant: 0, isTotal: false, isSousTotal: true, depth: 0, signe: "neutre" },
  { code: "6011", label: "Achats stockés — marchandises", montant: 212500, isTotal: false, isSousTotal: false, depth: 1, signe: "negatif" },
  { code: "6221", label: "Fournitures de bureau", montant: 11950, isTotal: false, isSousTotal: false, depth: 1, signe: "negatif" },
  { code: "6351", label: "Impôts et taxes", montant: 24900, isTotal: false, isSousTotal: false, depth: 1, signe: "negatif" },
  { code: "6211", label: "Salaires et appointements", montant: 45000, isTotal: false, isSousTotal: false, depth: 1, signe: "negatif" },
  { code: "6222", label: "Loyer et charges locatives", montant: 18000, isTotal: false, isSousTotal: false, depth: 1, signe: "negatif" },
  { code: "", label: "Total charges d'exploitation", montant: 312350, isTotal: true, isSousTotal: false, depth: 1, signe: "negatif" },
  { code: "", label: "CHARGES FINANCIÈRES", montant: 0, isTotal: false, isSousTotal: true, depth: 0, signe: "neutre" },
  { code: "", label: "Total charges financières", montant: 0, isTotal: true, isSousTotal: false, depth: 1, signe: "negatif" },
  { code: "", label: "TOTAL CHARGES", montant: 312350, isTotal: true, isSousTotal: false, depth: 0, signe: "negatif" },
];

const produitsData: CompteResultat[] = [
  { code: "", label: "PRODUITS D'EXPLOITATION", montant: 0, isTotal: false, isSousTotal: true, depth: 0, signe: "neutre" },
  { code: "7011", label: "Ventes de marchandises", montant: 671583, isTotal: false, isSousTotal: false, depth: 1, signe: "positif" },
  { code: "7061", label: "Prestations de services", montant: 214000, isTotal: false, isSousTotal: false, depth: 1, signe: "positif" },
  { code: "", label: "Total produits d'exploitation", montant: 885583, isTotal: true, isSousTotal: false, depth: 1, signe: "positif" },
  { code: "", label: "PRODUITS FINANCIERS", montant: 0, isTotal: false, isSousTotal: true, depth: 0, signe: "neutre" },
  { code: "", label: "Total produits financiers", montant: 0, isTotal: true, isSousTotal: false, depth: 1, signe: "positif" },
  { code: "", label: "TOTAL PRODUITS", montant: 885583, isTotal: true, isSousTotal: false, depth: 0, signe: "positif" },
];

const notesAnnexes: NoteAnnexe[] = [
  {
    numero: 1,
    titre: "Immobilisations corporelles",
    contenu: [
      "Le matériel informatique (compte 2181) est amorti linéairement sur 3 ans.",
      "Le mobilier de bureau (compte 2182) est amorti linéairement sur 5 ans.",
      "Le matériel roulant (compte 2183) est amorti linéairement sur 4 ans.",
      "Durée de vie estimée conforme aux usages de la profession en RDC.",
    ],
  },
  {
    numero: 2,
    titre: "Stocks et encours",
    contenu: [
      "Les marchandises en stock sont valorisées au coût d'achat selon la méthode du coût unitaire moyen pondéré (CUMP).",
      "Aucune dépréciation constatée sur l'exercice.",
      "Un inventaire physique est réalisé chaque fin de mois.",
    ],
  },
  {
    numero: 3,
    titre: "Créances clients",
    contenu: [
      "Les créances clients sont comptabilisées pour leur valeur nominale.",
      "Aucune provision pour dépréciation n'a été constituée à ce jour.",
      "L'ancienneté des créances est suivie via le module Factures.",
    ],
  },
  {
    numero: 4,
    titre: "Disponibilités",
    contenu: [
      "Banque Rawbank : compte courant USD n° 4001-XXXXXXXXX.",
      "Caisse principale : fonds de caisse en CDF et USD.",
      "Les comptes sont rapprochés mensuellement.",
    ],
  },
  {
    numero: 5,
    titre: "Capital social",
    contenu: [
      "Capital social : 500.000 USD entièrement libéré et souscrit.",
      "Réserve légale : 5% du capital conformément à l'Acte Uniforme OHADA.",
      "Associé unique : Jeancy Mungedi (Coccinelle SARL).",
    ],
  },
  {
    numero: 6,
    titre: "Impôts et taxes",
    contenu: [
      "TVA collectée : taux de 16% appliqué sur les ventes conformément à la législation RDC.",
      "IRPP : acompte provisionnel mensuel versé.",
      "La liasse fiscale sera déposée dans les délais légaux.",
    ],
  },
  {
    numero: 7,
    titre: "Faits marquants de l'exercice",
    contenu: [
      "Lancement de l'activité GPS (COTRACK) via Coccinelle SARL.",
      "Acquisition de matériel roulant pour la flotte de transport.",
      "Démarrage de l'importation via Buckydrop.",
    ],
  },
];

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompact(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────
export default function ComptaEtatsFinanciers() {
  const [activeTab, setActiveTab] = useState<"bilan" | "resultat" | "annexe">("bilan");

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
  const { data: bilanEntries = [], isLoading: bilanLoading } = useBilan(companyId);
  const { data: cprEntries = [], isLoading: cprLoading } = useCPR(companyId);

  // Build actifData from bilanEntries (ACTIF section)
  const actifData: LigneBilan[] = bilanEntries
    .filter((e) => e.section === 'ACTIF')
    .map((e, i) => ({
      code: e.code,
      label: e.rubrique || e.compte_label,
      note: 0,
      montant: e.montant,
      isTotal: e.code === '',
      isSousTotal: false,
      depth: e.code.length <= 2 ? 0 : 1,
    }));

  // Build passifData from bilanEntries (PASSIF section)
  const passifData: LigneBilan[] = bilanEntries
    .filter((e) => e.section === 'PASSIF')
    .map((e) => ({
      code: e.code,
      label: e.rubrique || e.compte_label,
      note: 0,
      montant: e.montant,
      isTotal: e.code === '',
      isSousTotal: false,
      depth: e.code.length <= 2 ? 0 : 1,
    }));

  // Build chargesData and produitsData from cprEntries
  const chargesData: CompteResultat[] = cprEntries
    .filter((e) => e.section === 'CHARGES')
    .map((e) => ({
      code: e.code,
      label: e.rubrique || e.compte_label,
      montant: e.montant,
      isTotal: false,
      isSousTotal: false,
      depth: e.code.length <= 2 ? 0 : 1,
      signe: 'negatif' as const,
    }));

  const produitsData: CompteResultat[] = cprEntries
    .filter((e) => e.section === 'PRODUITS')
    .map((e) => ({
      code: e.code,
      label: e.rubrique || e.compte_label,
      montant: e.montant,
      isTotal: false,
      isSousTotal: false,
      depth: e.code.length <= 2 ? 0 : 1,
      signe: 'positif' as const,
    }));

  const totalActif = actifData.filter((e) => e.isTotal && e.label.includes('Total')).reduce((s, e) => s + e.montant, 0);
  const totalPassif = passifData.filter((e) => e.isTotal && e.label.includes('Total')).reduce((s, e) => s + e.montant, 0);
  const totalCharges = chargesData.reduce((s, e) => s + e.montant, 0);
  const totalProduits = produitsData.reduce((s, e) => s + e.montant, 0);
  const resultatNet = totalProduits - totalCharges;
  const margeBrute = totalProduits > 0 ? (totalProduits - totalCharges) : 0;

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
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-extrabold text-gray-900">Facture<span className="text-green-600">Smart</span></span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">États Financiers</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              <Shield className="w-3 h-3 text-indigo-500" />
              <span className="font-semibold">Conforme SYSCOHADA</span>
            </div>
            <select className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white">
              <option>Exercice 2026</option>
              <option>Exercice 2025</option>
            </select>
            <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pt-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-green-600" />
            <div className="text-xs text-gray-500">Total actif</div>
          </div>
          {bilanLoading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-xl font-extrabold font-mono">{fmtCompact(totalActif)} $</div>
              <div className="text-[10px] text-gray-400 mt-1">Bilan SYSCOHADA</div>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <div className="text-xs text-gray-500">Chiffre d'affaires</div>
          </div>
          {cprLoading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-xl font-extrabold font-mono">{fmtCompact(totalProduits)} $</div>
              <div className="text-[10px] text-gray-400 mt-1">Total produits</div>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ChartColumnIncreasing className="w-4 h-4 text-amber-600" />
            <div className="text-xs text-gray-500">Marge brute</div>
          </div>
          {cprLoading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-xl font-extrabold font-mono">{fmtCompact(margeBrute)} $</div>
              <div className="text-[10px] text-gray-400 mt-1">Taux: {totalProduits > 0 ? ((margeBrute / totalProduits) * 100).toFixed(1) : 0}%</div>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ChartColumnIncreasing className="w-4 h-4 text-violet-600" />
            <div className="text-xs text-gray-500">Résultat net</div>
          </div>
          {cprLoading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className={`text-xl font-extrabold font-mono ${resultatNet >= 0 ? "text-green-700" : "text-red-600"}`}>
                {fmtCompact(Math.abs(resultatNet))} $
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{resultatNet >= 0 ? "Bénéfice" : "Perte"} de l'exercice</div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: "bilan" as const, label: "Bilan actif/passif", icon: FileText },
              { id: "resultat" as const, label: "Compte de résultat", icon: TrendingUp },
              { id: "annexe" as const, label: "Notes annexes", icon: ChartBar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-colors ${
                  activeTab === tab.id
                    ? "text-green-700 border-b-2 border-green-600 bg-green-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex items-center pr-4">
              <span className="text-[10px] text-gray-400">Exercice clos le 31/12/2026</span>
            </div>
          </div>

          {/* ─── BILAN ACTIF/PASSIF ─── */}
          {activeTab === "bilan" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 p-6">
              {/* ACTIF */}
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  ACTIF
                </h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="text-left px-4 py-2.5" colSpan={2}>Rubriques</th>
                        <th className="text-right px-4 py-2.5">Montant ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {actifData.map((ligne, idx) => (
                        <tr
                          key={`actif-${idx}`}
                          className={`${ligne.isTotal ? "bg-green-50 font-extrabold" : ligne.isSousTotal ? "bg-gray-50 font-bold text-gray-700" : "hover:bg-gray-50"}`}
                        >
                          <td className={`px-4 py-2 ${ligne.isSousTotal ? "text-gray-500" : ""}`}>
                            {ligne.isSousTotal || ligne.isTotal ? "" : (
                              <span className="font-mono text-[10px] text-gray-400">{ligne.code}</span>
                            )}
                          </td>
                          <td className={`px-4 py-2 ${ligne.isTotal ? "text-green-800" : ""}`}
                              style={{ paddingLeft: `${16 + ligne.depth * 20}px` }}>
                            {ligne.label}
                          </td>
                          <td className={`px-4 py-2 text-right font-mono ${
                            ligne.isTotal ? "text-green-700 font-extrabold" : "text-gray-900"
                          }`}>
                            {ligne.isSousTotal ? "" : (
                              <>{fmt(ligne.montant)} $</>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-green-100 border-t-2 border-green-300">
                        <td colSpan={2} className="px-4 py-3 text-xs font-extrabold text-green-900">TOTAL BILAN ACTIF</td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-green-900">{fmt(818213)} $</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* PASSIF */}
              <div className="mt-6 lg:mt-0">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  PASSIF
                </h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="text-left px-4 py-2.5" colSpan={2}>Rubriques</th>
                        <th className="text-right px-4 py-2.5">Montant ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {passifData.map((ligne, idx) => (
                        <tr
                          key={`passif-${idx}`}
                          className={`${ligne.isTotal ? "bg-blue-50 font-extrabold" : ligne.isSousTotal ? "bg-gray-50 font-bold text-gray-700" : "hover:bg-gray-50"}`}
                        >
                          <td className={`px-4 py-2 ${ligne.isSousTotal ? "text-gray-500" : ""}`}>
                            {ligne.isSousTotal || ligne.isTotal ? "" : (
                              <span className="font-mono text-[10px] text-gray-400">{ligne.code}</span>
                            )}
                          </td>
                          <td className={`px-4 py-2 ${ligne.isTotal ? "text-blue-800" : ""}`}
                              style={{ paddingLeft: `${16 + ligne.depth * 20}px` }}>
                            {ligne.label}
                          </td>
                          <td className={`px-4 py-2 text-right font-mono ${
                            ligne.isTotal ? "text-blue-700 font-extrabold" : "text-gray-900"
                          }`}>
                            {ligne.isSousTotal ? "" : (
                              <>{fmt(ligne.montant)} $</>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-100 border-t-2 border-blue-300">
                        <td colSpan={2} className="px-4 py-3 text-xs font-extrabold text-blue-900">TOTAL BILAN PASSIF</td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-blue-900">{fmt(818213)} $</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── COMPTE DE RÉSULTAT ─── */}
          {activeTab === "resultat" && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* CHARGES */}
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    CHARGES
                  </h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                          <th className="text-left px-4 py-2.5" colSpan={2}>Rubriques</th>
                          <th className="text-right px-4 py-2.5">Montant ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {chargesData.map((ligne, idx) => (
                          <tr
                            key={`charge-${idx}`}
                            className={`${ligne.isTotal ? "bg-red-50 font-extrabold" : ligne.isSousTotal ? "bg-gray-50 font-bold text-gray-700" : "hover:bg-gray-50"}`}
                          >
                            <td className="px-4 py-2">
                              {ligne.isSousTotal || ligne.isTotal ? "" : (
                                <span className="font-mono text-[10px] text-gray-400">{ligne.code}</span>
                              )}
                            </td>
                            <td className="px-4 py-2" style={{ paddingLeft: `${16 + ligne.depth * 20}px` }}>
                              {ligne.label}
                            </td>
                            <td className={`px-4 py-2 text-right font-mono ${
                              ligne.isTotal ? "text-red-700 font-extrabold" : "text-gray-900"
                            }`}>
                              {ligne.isSousTotal ? "" : `(${fmt(ligne.montant)}) $`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PRODUITS */}
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    PRODUITS
                  </h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                          <th className="text-left px-4 py-2.5" colSpan={2}>Rubriques</th>
                          <th className="text-right px-4 py-2.5">Montant ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {produitsData.map((ligne, idx) => (
                          <tr
                            key={`produit-${idx}`}
                            className={`${ligne.isTotal ? "bg-green-50 font-extrabold" : ligne.isSousTotal ? "bg-gray-50 font-bold text-gray-700" : "hover:bg-gray-50"}`}
                          >
                            <td className="px-4 py-2">
                              {ligne.isSousTotal || ligne.isTotal ? "" : (
                                <span className="font-mono text-[10px] text-gray-400">{ligne.code}</span>
                              )}
                            </td>
                            <td className="px-4 py-2" style={{ paddingLeft: `${16 + ligne.depth * 20}px` }}>
                              {ligne.label}
                            </td>
                            <td className={`px-4 py-2 text-right font-mono ${
                              ligne.isTotal ? "text-green-700 font-extrabold" : "text-gray-900"
                            }`}>
                              {ligne.isSousTotal ? "" : `${fmt(ligne.montant)} $`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Résultat net */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-extrabold text-gray-900">RÉSULTAT NET DE L'EXERCICE</span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">BÉNÉFICE</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Produits totaux — Charges totales
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold font-mono text-green-700">
                      {fmt(resultatNet)} $
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                      Taux de marge nette
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-bold text-green-600">{(resultatNet / 885583 * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── NOTES ANNEXES ─── */}
          {activeTab === "annexe" && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChartBar className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-extrabold text-gray-900">Notes annexes aux états financiers</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">SYSCOHADA art. 143</span>
              </div>
              <div className="space-y-4">
                {notesAnnexes.map((note) => (
                  <div key={note.numero} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-100 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-extrabold text-indigo-700">{note.numero}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-2">{note.titre}</h4>
                        <ul className="space-y-1">
                          {note.contenu.map((c, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-indigo-300 mt-1.5 flex-shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-500">
                <p className="font-semibold text-gray-700 mb-1">Conformité SYSCOHADA</p>
                <p>Les présents états financiers sont établis conformément au Système Comptable OHADA (SYSCOHADA) révisé, en vigueur en République Démocratique du Congo depuis l'Acte Uniforme du 26 janvier 2017.</p>
                <p className="mt-1">La devise de présentation est le Dollar Américain (USD). Tous les montants sont exprimés en USD sauf indication contraire.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-12" />
    </div>
  );
}
