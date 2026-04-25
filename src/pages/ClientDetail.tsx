import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Pencil, Trash2, User, Phone, Mail, MapPin,
  FileText, Receipt, Wallet, TrendingUp, DollarSign, Percent,
  Calendar, Building2, CheckCircle2, XCircle, Clock,
  AlertCircle, Archive, Plus, ChevronLeft,
  ChevronRight as ChevronRightIcon, Tag, ArrowRightLeft,
  StickyNote,
} from "lucide-react";
import type { Client } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatCurrency";

type Transaction = {
  id: string;
  montant: number;
  devise: string;
  motif: string;
  mode_paiement: string;
  statut: string;
  date_paiement: string;
  created_at: string;
  type_transaction: string;
  frais: number | null;
  benefice: number | null;
  client_id: string | null;
  client?: Client | null;
};

type Facture = {
  id: string;
  numero: string;
  client_id: string;
  montant_total: number;
  devise: string;
  statut: string;
  created_at: string;
  date_facture: string;
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  payé: { label: "Payé", color: "text-green-700", bg: "bg-green-100" },
  "en attente": { label: "En attente", color: "text-amber-700", bg: "bg-amber-100" },
  annulé: { label: "Annulé", color: "text-red-700", bg: "bg-red-100" },
  remboursé: { label: "Remboursé", color: "text-blue-700", bg: "bg-blue-100" },
  payée: { label: "Payée", color: "text-green-700", bg: "bg-green-100" },
};

const getStatutBadge = (statut: string) => {
  const config = STATUT_CONFIG[statut.toLowerCase()] || {
    label: statut,
    color: "text-gray-700",
    bg: "bg-gray-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
      {statut.toLowerCase() === "payé" || statut.toLowerCase() === "payée" ? <CheckCircle2 className="h-3 w-3" /> : null}
      {statut.toLowerCase() === "en attente" ? <Clock className="h-3 w-3" /> : null}
      {statut.toLowerCase() === "annulé" ? <XCircle className="h-3 w-3" /> : null}
      {config.label}
    </span>
  );
};

const getMotifIcon = (motif: string) => {
  switch (motif?.toLowerCase()) {
    case "vente": return <Tag className="h-4 w-4" />;
    case "facture": return <FileText className="h-4 w-4" />;
    case "transfert": return <ArrowRightLeft className="h-4 w-4" />;
    case "commission": return <TrendingUp className="h-4 w-4" />;
    case "frais": return <Receipt className="h-4 w-4" />;
    default: return <Wallet className="h-4 w-4" />;
  }
};

const ClientsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "factures" | "info">("transactions");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const TRANSACTIONS_PER_PAGE = 10;

  const [factures, setFactures] = useState<Facture[]>([]);
  const [facturesLoading, setFacturesLoading] = useState(true);
  const [facturesPage, setFacturesPage] = useState(1);
  const [facturesTotal, setFacturesTotal] = useState(0);
  const FACTURES_PER_PAGE = 10;

  const [stats, setStats] = useState({
    totalTransactions: 0, totalUSD: 0, totalCDF: 0,
    totalPaidUSD: 0, totalPaidCDF: 0,
    totalPendingUSD: 0, totalPendingCDF: 0,
    totalFactures: 0, totalFacturesPaid: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchClient = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;
      if (!data) { setError("Client introuvable"); return; }
      setClient(data as Client);
    } catch (err: any) {
      console.error("Error fetching client:", err);
      setError(err.message);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger le client." });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!id) return;
    try {
      setTransactionsLoading(true);
      const from = (transactionsPage - 1) * TRANSACTIONS_PER_PAGE;
      const to = from + TRANSACTIONS_PER_PAGE - 1;
      const { data, error: fetchError, count } = await supabase
        .from("transactions")
        .select(`*, client:clients(*)`, { count: "exact" })
        .eq("client_id", id)
        .order("date_paiement", { ascending: false })
        .range(from, to);
      if (fetchError) throw fetchError;
      setTransactions((data || []) as unknown as Transaction[]);
      setTransactionsTotal(count || 0);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchFactures = async () => {
    if (!id) return;
    try {
      setFacturesLoading(true);
      const from = (facturesPage - 1) * FACTURES_PER_PAGE;
      const to = from + FACTURES_PER_PAGE - 1;
      const { data, error: fetchError, count } = await supabase
        .from("factures")
        .select("*", { count: "exact" })
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (fetchError) throw fetchError;
      setFactures((data || []) as Facture[]);
      setFacturesTotal(count || 0);
    } catch (err: any) {
      console.error("Error fetching factures:", err);
    } finally {
      setFacturesLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!id) return;
    try {
      setStatsLoading(true);
      const { data: txns, error: txnsErr } = await supabase
        .from("transactions").select("montant, devise, statut").eq("client_id", id);
      if (txnsErr) throw txnsErr;
      const { count: factCount, error: factErr } = await supabase
        .from("factures").select("*", { count: "exact", head: true }).eq("client_id", id);
      if (factErr) throw factErr;
      const { count: factPaidCount, error: factPaidErr } = await supabase
        .from("factures").select("*", { count: "exact", head: true }).eq("client_id", id).eq("statut", "payée");
      if (factPaidErr) throw factPaidErr;

      const txnsList = txns || [];
      setStats({
        totalTransactions: txnsList.length,
        totalUSD: txnsList.filter(t => t.devise === "USD").reduce((s, t) => s + (t.montant || 0), 0),
        totalCDF: txnsList.filter(t => t.devise === "CDF").reduce((s, t) => s + (t.montant || 0), 0),
        totalPaidUSD: txnsList.filter(t => t.devise === "USD" && t.statut === "payé").reduce((s, t) => s + (t.montant || 0), 0),
        totalPaidCDF: txnsList.filter(t => t.devise === "CDF" && t.statut === "payé").reduce((s, t) => s + (t.montant || 0), 0),
        totalPendingUSD: txnsList.filter(t => t.devise === "USD" && t.statut === "en attente").reduce((s, t) => s + (t.montant || 0), 0),
        totalPendingCDF: txnsList.filter(t => t.devise === "CDF" && t.statut === "en attente").reduce((s, t) => s + (t.montant || 0), 0),
        totalFactures: factCount || 0,
        totalFacturesPaid: factPaidCount || 0,
      });
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => { fetchClient(); }, [id]);
  useEffect(() => {
    if (client) {
      fetchTransactions();
      fetchFactures();
      fetchStats();
    }
  }, [client, transactionsPage, facturesPage]);

  const handleDelete = async () => {
    if (!client) return;
    if (!confirm(`Supprimer définitivement "${client.nom}" ? Cette action est irréversible.`)) return;
    try {
      const { error } = await supabase.from("clients").delete().eq("id", client.id);
      if (error) throw error;
      toast({ title: "Client supprimé", description: `${client.nom} a été supprimé.`, variant: "destructive" });
      navigate("/clients");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleToggleActive = async () => {
    if (!client) return;
    try {
      const { error } = await supabase.from("clients").update({ actif: !client.actif }).eq("id", client.id);
      if (error) throw error;
      toast({ title: client.actif ? "Client archivé" : "Client réactivé", description: `${client.nom} a été ${client.actif ? "archivé" : "réactivé"}.` });
      fetchClient();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-2xl" />
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Client introuvable</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Button variant="outline" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux clients
          </Button>
        </div>
      </div>
    );
  }

  if (!client) return null;

  const totalPagesTxs = Math.ceil(transactionsTotal / TRANSACTIONS_PER_PAGE);
  const totalPagesFact = Math.ceil(facturesTotal / FACTURES_PER_PAGE);
  const displayName = client.nom.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const initial = client.nom.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => navigate("/clients")}>
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-700">{initial}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">{displayName}</h1>
                  {!client.actif && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">Archivé</Badge>}
                </div>
                <p className="text-xs text-gray-400">Créé le {client.created_at ? formatDate(client.created_at) : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={handleToggleActive}>
                {client.actif ? <><Archive className="h-4 w-4 mr-1.5" /> Archiver</> : <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Réactiver</>}
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate(`/clients/${id}/edit`)}>
                <Pencil className="h-4 w-4 mr-1.5" /> Modifier
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Transactions</p>
              <Receipt className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {statsLoading ? "…" : stats.totalTransactions}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total des opérations</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total USD</p>
              <DollarSign className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-extrabold text-green-700">
              {statsLoading ? "…" : formatCurrency(stats.totalUSD, "USD")}
            </p>
            <p className="text-xs text-green-600 mt-1">{formatCurrency(stats.totalPaidUSD, "USD")} payé</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total CDF</p>
              <Percent className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-extrabold text-blue-700">
              {statsLoading ? "…" : formatCurrency(stats.totalCDF, "CDF")}
            </p>
            <p className="text-xs text-blue-600 mt-1">{formatCurrency(stats.totalPaidCDF, "CDF")} payé</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Factures</p>
              <FileText className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-extrabold text-purple-700">
              {statsLoading ? "…" : stats.totalFactures}
            </p>
            <p className="text-xs text-purple-600 mt-1">{stats.totalFacturesPaid} payée{stats.totalFacturesPaid > 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Main Grid: Left sidebar + Right panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel — Client Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-green-700">{initial}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
                    <p className="text-xs text-gray-400">{client.actif ? "Client actif" : "Client archivé"}</p>
                  </div>
                </div>
                <Separator className="mb-5" />
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-gray-300 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Téléphone</p>
                      <p className="text-sm font-medium text-gray-800">{client.telephone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-gray-300 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-gray-800">{client.email || <span className="text-gray-400 italic">Non renseigné</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-300 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Ville</p>
                      <p className="text-sm font-medium text-gray-800">{client.ville || <span className="text-gray-400 italic">Non renseignée</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-gray-300 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">NIF</p>
                      <p className="text-sm font-medium text-gray-800 font-mono">{client.nif || <span className="text-gray-400 italic">Non renseigné</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-gray-300 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Client depuis</p>
                      <p className="text-sm font-medium text-gray-800">{client.created_at ? formatDate(client.created_at) : "—"}</p>
                    </div>
                  </div>
                  {client.notes && (
                    <div className="flex items-start gap-3">
                      <StickyNote className="h-4 w-4 text-gray-300 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Notes</p>
                        <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap">{client.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-100 p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start rounded-xl text-sm" onClick={() => navigate(`/transactions/new?client=${id}`)}>
                  <Plus className="h-4 w-4 mr-2 text-green-600" /> Nouvelle transaction
                </Button>
                <Button variant="ghost" className="w-full justify-start rounded-xl text-sm" onClick={() => navigate(`/factures/new?client=${id}`)}>
                  <FileText className="h-4 w-4 mr-2 text-purple-600" /> Nouvelle facture
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel — Tabs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Tab Bar */}
              <div className="border-b border-gray-100">
                <div className="flex">
                  <button className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "transactions" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`} onClick={() => setActiveTab("transactions")}>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Transactions ({transactionsTotal})
                    </div>
                  </button>
                  <button className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "factures" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`} onClick={() => setActiveTab("factures")}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Factures ({facturesTotal})
                    </div>
                  </button>
                  <button className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "info" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`} onClick={() => setActiveTab("info")}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Informations
                    </div>
                  </button>
                </div>
              </div>

              {/* Transactions Tab */}
              {activeTab === "transactions" && (
                <div>
                  {transactionsLoading ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="p-12 text-center">
                      <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                      <p className="text-gray-500 font-medium">Aucune transaction</p>
                      <p className="text-xs text-gray-400 mb-4">Ce client n'a pas encore de transactions</p>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate(`/transactions/new?client=${id}`)}>
                        <Plus className="h-4 w-4 mr-1.5" /> Créer une transaction
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/transactions/${tx.id}`)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">{getMotifIcon(tx.motif)}</div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{tx.motif || "Transaction"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-400">{formatDate(tx.date_paiement || tx.created_at)}</span>
                                  <span className="text-gray-200">•</span>
                                  <span className="text-xs text-gray-400">{tx.mode_paiement}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{formatCurrency(tx.montant, tx.devise)}</p>
                              <div className="mt-0.5">{getStatutBadge(tx.statut)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {totalPagesTxs > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <p className="text-xs text-gray-400">{transactionsTotal} transaction{transactionsTotal > 1 ? "s" : ""}</p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg" disabled={transactionsPage <= 1}
                          onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-gray-400 px-2">{transactionsPage}/{totalPagesTxs}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg" disabled={transactionsPage >= totalPagesTxs}
                          onClick={() => setTransactionsPage((p) => p + 1)}>
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Factures Tab */}
              {activeTab === "factures" && (
                <div>
                  {facturesLoading ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : factures.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                      <p className="text-gray-500 font-medium">Aucune facture</p>
                      <p className="text-xs text-gray-400 mb-4">Ce client n'a pas encore de factures</p>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate(`/factures/new?client=${id}`)}>
                        <Plus className="h-4 w-4 mr-1.5" /> Créer une facture
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {factures.map((fact) => (
                        <div key={fact.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/factures/${fact.id}`)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                                <FileText className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{fact.numero || "Facture"}</p>
                                <p className="text-xs text-gray-400">{formatDate(fact.date_facture || fact.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{formatCurrency(fact.montant_total, fact.devise)}</p>
                              <div className="mt-0.5">{getStatutBadge(fact.statut)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {totalPagesFact > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <p className="text-xs text-gray-400">{facturesTotal} facture{facturesTotal > 1 ? "s" : ""}</p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg" disabled={facturesPage <= 1}
                          onClick={() => setFacturesPage((p) => Math.max(1, p - 1))}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-gray-400 px-2">{facturesPage}/{totalPagesFact}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg" disabled={facturesPage >= totalPagesFact}
                          onClick={() => setFacturesPage((p) => p + 1)}>
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info Tab */}
              {activeTab === "info" && (
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Coordonnées</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Téléphone</span>
                          <span className="text-sm font-medium text-gray-900">{client.telephone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Email</span>
                          <span className="text-sm font-medium text-gray-900">{client.email || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Ville</span>
                          <span className="text-sm font-medium text-gray-900">{client.ville || "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Informations fiscales</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">NIF</span>
                          <span className="text-sm font-medium text-gray-900 font-mono">{client.nif || "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Statut</span>
                          <span className={`text-sm font-medium ${client.actif ? "text-green-700" : "text-gray-500"}`}>
                            {client.actif ? "Actif" : "Archivé"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Statistiques</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Total dépensé (USD)</span>
                          <span className="text-sm font-bold text-green-700">{formatCurrency(stats.totalPaidUSD, "USD")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Total dépensé (CDF)</span>
                          <span className="text-sm font-bold text-blue-700">{formatCurrency(stats.totalPaidCDF, "CDF")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">En attente (USD)</span>
                          <span className="text-sm font-bold text-amber-700">{formatCurrency(stats.totalPendingUSD, "USD")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">En attente (CDF)</span>
                          <span className="text-sm font-bold text-amber-700">{formatCurrency(stats.totalPendingCDF, "CDF")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsDetailPage;
