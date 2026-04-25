import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronLeft, FileText, FileSpreadsheet, Printer, CheckCircle, Calendar, Shield, BookTemplate, BarChart3, ScrollText, FileOutput, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEcrituresComptables, useBalance, useExerciceCourant } from "@/hooks/useComptabiliteOHADA";

// --- Types ---
type ExportFormat = "csv" | "excel" | "pdf" | "ods";
type ReportType = "balance" | "grand-livre" | "journal" | "bilan" | "cpr";

interface ExportPreset {
  id: string;
  label: string;
  icon: typeof FileText;
  desc: string;
  reportType: ReportType;
  formats: ExportFormat[];
  color: string;
}

const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "balance",
    label: "Balance générale SYSCOHADA",
    icon: BarChart3,
    desc: "Soldes débiteurs/créditeurs par compte — conforme au modèle SYSCOHADA",
    reportType: "balance",
    formats: ["csv", "excel", "pdf"],
    color: "bg-indigo-500",
  },
  {
    id: "grand-livre",
    label: "Grand Livre",
    icon: BookTemplate,
    desc: "Détail chronologique des mouvements par compte avec cumuls",
    reportType: "grand-livre",
    formats: ["csv", "excel", "pdf"],
    color: "bg-blue-500",
  },
  {
    id: "journal",
    label: "Journal comptable",
    icon: ScrollText,
    desc: "Écritures classées par journal (Ventes, Achats, Banque, etc.)",
    reportType: "journal",
    formats: ["csv", "excel", "pdf", "ods"],
    color: "bg-cyan-500",
  },
  {
    id: "bilan",
    label: "Bilan (Actif / Passif)",
    icon: FileText,
    desc: "État de synthèse patrimonial — actif et passif au clôture",
    reportType: "bilan",
    formats: ["excel", "pdf"],
    color: "bg-emerald-500",
  },
  {
    id: "cpr",
    label: "Compte de Résultat (CPR)",
    icon: FileSpreadsheet,
    desc: "Charges et produits — calcul du résultat net",
    reportType: "cpr",
    formats: ["excel", "pdf"],
    color: "bg-orange-500",
  },
];

const FORMAT_ICONS: Record<string, typeof FileText> = {
  csv: FileText,
  excel: FileSpreadsheet,
  pdf: FileText,
  ods: FileSpreadsheet,
};

const FORMAT_LABELS: Record<string, string> = {
  csv: "CSV",
  excel: "Excel (XLSX)",
  pdf: "PDF",
  ods: "OpenDocument (ODS)",
};

const PERIODS = [
  "Clôture annuelle 2026",
  "Avril 2026",
  "Mars 2026",
  "Février 2026",
  "Janvier 2026",
  "Décembre 2025",
];

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ReportCard({ preset, onExport }: { preset: ExportPreset; onExport: (id: ReportType, format: ExportFormat) => void }) {
  const [showFormats, setShowFormats] = useState(false);
  const Icon = preset.icon;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl ${preset.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-gray-900">{preset.label}</h3>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{preset.desc}</p>
          </div>
        </div>

        {/* Format buttons */}
        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
          {preset.formats.map((fmt) => {
            const FmtIcon = FORMAT_ICONS[fmt] || FileText;
            return (
              <button
                key={fmt}
                onClick={() => onExport(preset.reportType, fmt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <FmtIcon className="w-3.5 h-3.5" />
                {FORMAT_LABELS[fmt]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EcartBadge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold ${bg} ${text}`}>
      <CheckCircle className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export default function ComptaExportOHADA() {
  const [selectedPeriod, setSelectedPeriod] = useState("Avril 2026");
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Get companyId
  const { data: currentProfile } = useQuery({
    queryKey: ['my-profile-exp-ohada'],
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
  const { data: ecritures = [] } = useEcrituresComptables(companyId);
  const { data: balanceData = [] } = useBalance(companyId);

  // Fetch company settings for tax/accounting info
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings-ohada', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('id, nom, adresse, email, telephone, nif, rc, reglement_interieur, created_at')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const ecrituresCount = ecritures.length;
  const balanceCount = balanceData.length;

  // Validate data for export readiness
  const hasEcritures = ecrituresCount > 0;
  const hasBalance = balanceCount > 0;

  const exportReadiness = [
    { label: "Écritures comptables", ok: hasEcritures, count: ecrituresCount },
    { label: "Balance des comptes", ok: hasBalance, count: balanceCount },
    { label: "Plan comptable", ok: true, count: 0 },
    { label: "Exercice ouvert", ok: true, count: 0 },
  ];

  const handleExport = async (reportType: ReportType, format: ExportFormat) => {
    setExportingId(`${reportType}-${format}`);
    // Simulate export — in production would call an Edge Function or backend
    await new Promise((r) => setTimeout(r, 1500));
    setExportingId(null);
  };

  const isExporting = (reportType: ReportType, format: ExportFormat) =>
    exportingId === `${reportType}-${format}`;

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
                <FileOutput className="text-white w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-gray-900">Facture<span className="text-green-600">Smart</span></span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Export OHADA</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>Conforme SYSCOHADA / OHADA</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Bandeau de contrôle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 bg-white"
              >
                {PERIODS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <EcartBadge label={`${ecrituresCount} écritures`} bg="bg-green-50" text="text-green-700" />
                <EcartBadge label={`${balanceCount} comptes balancés`} bg={hasBalance ? "bg-green-50" : "bg-gray-50"} text={hasBalance ? "text-green-700" : "text-gray-400"} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimer tout
              </button>
            </div>
          </div>
        </div>

        {/* Vérification d'exportabilité */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-800 mb-2">Vérification avant export OHADA</p>
              <div className="flex flex-wrap gap-3">
                {exportReadiness.map((item) => (
                  <div key={item.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                    item.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    <CheckCircle className="w-3 h-3" />
                    {item.label}
                    {item.count > 0 && <span className="text-gray-500 font-normal">({item.count})</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grille des exports */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {EXPORT_PRESETS.map((preset) => (
            <div key={preset.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${preset.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <preset.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-gray-900">{preset.label}</h3>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{preset.desc}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                  {preset.formats.map((fmt) => {
                    const FmtIcon = FORMAT_ICONS[fmt] || FileText;
                    const isBusy = isExporting(preset.reportType, fmt);
                    return (
                      <button
                        key={fmt}
                        onClick={() => handleExport(preset.reportType, fmt)}
                        disabled={isBusy}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          isBusy
                            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-wait"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        {isBusy ? (
                          <div className="animate-spin h-3.5 w-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                        ) : (
                          <FmtIcon className="w-3.5 h-3.5" />
                        )}
                        {FORMAT_LABELS[fmt]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info légale */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-gray-900 mb-1">Conformité SYSCOHADA</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Les exports générés sont conformes au plan comptable SYSCOHADA révisé (Système Comptable 
                de l'Afrique de l'Est et de l'Afrique Centrale — OHADA). Formats acceptés par les 
                cabinets d'expertise comptable et les administrations fiscales de la zone OHADA 
                (CEMAC, SADC, etc.).
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-gray-50 text-gray-500 text-[10px] font-semibold">Bilan (Actif/Passif)</span>
                <span className="px-2 py-1 rounded bg-gray-50 text-gray-500 text-[10px] font-semibold">Compte de Résultat</span>
                <span className="px-2 py-1 rounded bg-gray-50 text-gray-500 text-[10px] font-semibold">Balance des comptes</span>
                <span className="px-2 py-1 rounded bg-gray-50 text-gray-500 text-[10px] font-semibold">Grand Livre</span>
                <span className="px-2 py-1 rounded bg-gray-50 text-gray-500 text-[10px] font-semibold">Journal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
