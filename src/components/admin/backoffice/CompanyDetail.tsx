"use client";

import React, { useState, useEffect } from 'react';
import {
  adminBackofficeService,
  type Company,
  type Invoice,
  type AuditLog,
  type SupportTicket,
} from '@/services/adminBackofficeService';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Shield,
  Activity,
  Ticket,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CompanyDetailProps {
  companyId: string;
  onBack: () => void;
  onActionComplete: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  suspended: { label: 'Suspendue', color: 'bg-red-100 text-red-700', icon: XCircle },
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  paid: { label: 'Payée', color: 'bg-green-100 text-green-700' },
  sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-500' },
};

const AUDIT_ICONS: Record<string, string> = {
  login: '🔵',
  create: '🟢',
  update: '🟡',
  delete: '🔴',
  activate: '✅',
  suspend: '⛔',
};

export default function CompanyDetail({ companyId, onBack, onActionComplete }: CompanyDetailProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<'activate' | 'suspend' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      adminBackofficeService.getCompany(companyId),
      adminBackofficeService.getCompanyInvoices(companyId),
      adminBackofficeService.getCompanyAuditLogs(companyId),
      adminBackofficeService.getCompanyTickets(companyId),
    ]).then(([companyData, invoicesData, logsData, ticketsData]) => {
      setCompany(companyData);
      setInvoices(invoicesData);
      setAuditLogs(logsData);
      setTickets(ticketsData);
      setLoading(false);
    });
  }, [companyId]);

  const handleAction = async () => {
    if (!company || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === 'activate') {
        await adminBackofficeService.activateCompany(company.id);
      } else if (actionType === 'suspend') {
        await adminBackofficeService.suspendCompany(company.id);
      }
      const updated = await adminBackofficeService.getCompany(company.id);
      setCompany(updated);
      onActionComplete();
      setActionType(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !company) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[company.status];
  const StatusIcon = statusCfg.icon;
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div>
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
        <ArrowLeft size={14} className="mr-1.5" />
        Retour à la liste
      </Button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-6">
        <div className="bg-gradient-to-r from-green-600 to-cyan-600 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Building2 size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{company.name}</h2>
                <p className="text-green-100 text-sm mt-0.5">{company.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 text-white`}>
                <StatusIcon size={14} />
                {statusCfg.label}
              </span>
              {company.status === 'active' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setActionType('suspend')}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 h-8"
                >
                  Suspendre
                </Button>
              )}
              {(company.status === 'suspended' || company.status === 'pending' || company.status === 'inactive') && (
                <Button
                  size="sm"
                  onClick={() => setActionType('activate')}
                  className="bg-white text-green-700 hover:bg-green-50 h-8"
                >
                  Activer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {[
            { label: 'MRR', value: `$${company.mrr.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
            { label: 'CA Total', value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-cyan-600' },
            { label: 'Utilisateurs', value: String(company.userCount), icon: Users, color: 'text-blue-600' },
            { label: 'Factures', value: String(invoices.length), icon: FileText, color: 'text-purple-600' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="px-5 py-4 text-center">
                <Icon size={18} className={`mx-auto mb-1.5 ${stat.color}`} />
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <TabsList className="w-full justify-start rounded-none border-b border-gray-200 bg-gray-50 p-0 h-auto">
          {[
            { value: 'overview', label: 'Aperçu', icon: Building2 },
            { value: 'invoices', label: `Factures (${invoices.length})`, icon: FileText },
            { value: 'logs', label: `Logs (${auditLogs.length})`, icon: Activity },
            { value: 'tickets', label: `Tickets (${tickets.length})`, icon: Ticket },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-white data-[state=active]:text-green-700 text-gray-600 text-sm font-medium"
              >
                <Icon size={14} />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 size={15} className="text-gray-400" />
                Informations Company
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Secteur', value: company.sector.charAt(0).toUpperCase() + company.sector.slice(1) },
                  { label: 'Plan', value: company.plan.charAt(0).toUpperCase() + company.plan.slice(1) },
                  { label: 'NIF', value: company.nif },
                  { label: 'RCCM', value: company.rccm },
                  { label: 'Adresse', value: company.address },
                  { label: 'Ville', value: `${company.city}, ${company.country}` },
                  { label: 'Website', value: company.website || '—' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">{item.label}</span>
                    <span className="text-sm text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield size={15} className="text-gray-400" />
                Contact Principal
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Nom', value: company.contactName },
                  { label: 'Titre', value: company.contactTitle },
                  { label: 'Email', value: company.email, icon: Mail },
                  { label: 'Téléphone', value: company.phone, icon: Phone },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">{item.label}</span>
                      <div className="flex items-center gap-1.5">
                        {Icon && <Icon size={13} className="text-gray-400" />}
                        <span className="text-sm text-gray-900">{item.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dates */}
              <h3 className="text-sm font-semibold text-gray-900 mb-3 mt-6 flex items-center gap-2">
                <Calendar size={15} className="text-gray-400" />
                Dates Clés
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Inscription', value: new Date(company.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  ...(company.activatedAt ? [{ label: 'Activation', value: new Date(company.activatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }] : []),
                  ...(company.suspendedAt ? [{ label: 'Suspension', value: new Date(company.suspendedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }] : []),
                  { label: 'Dernière activité', value: new Date(company.lastActivity).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">{item.label}</span>
                    <span className="text-sm text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="p-6">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <FileText size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Aucune facture</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">N° Facture</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Client</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Montant</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Statut</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Date Émission</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Échéance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => {
                    const invStatus = INVOICE_STATUS[inv.status];
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-3 py-2.5 text-gray-900">{inv.clientName}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                          ${inv.amount.toLocaleString()} {inv.currency}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${invStatus.color}`}>
                            {invStatus.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{new Date(inv.issueDate).toLocaleDateString('fr-FR')}</td>
                        <td className="px-3 py-2.5 text-gray-500">{new Date(inv.dueDate).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="p-6">
          {auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Activity size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Aucun log</p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-base">{AUDIT_ICONS[log.action] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{log.description}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{log.userEmail} • {log.ipAddress}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="p-6">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Ticket size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Aucun ticket</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">{ticket.ticketNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          ticket.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                          ticket.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          ticket.status === 'open' ? 'bg-green-100 text-green-700' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          ticket.status === 'resolved' ? 'bg-gray-100 text-gray-700' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{ticket.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'activate' ? 'Activer cette company ?' : 'Suspendre cette company ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'activate' && (
                <>La company <strong>{company.name}</strong> sera activée.</>
              )}
              {actionType === 'suspend' && (
                <>La company <strong>{company.name}</strong> sera suspendue. Elle ne pourra plus accéder à la plateforme.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionLoading}
              className={actionType === 'suspend' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                actionType === 'activate' ? 'Activer' : 'Suspendre'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
