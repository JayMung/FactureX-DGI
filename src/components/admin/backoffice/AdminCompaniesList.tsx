"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  adminBackofficeService,
  type Company,
  type CompanyStatus,
  type CompanyPlan,
} from '@/services/adminBackofficeService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Search,
  Building2,
  MoreHorizontal,
  Eye,
  Power,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Filters {
  search: string;
  status: CompanyStatus | '';
  plan: CompanyPlan | '';
  dateFrom: string;
  dateTo: string;
}

interface AdminCompaniesListProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onCompanySelect: (companyId: string) => void;
  onActionComplete: () => void;
}

const STATUS_CONFIG: Record<CompanyStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  suspended: { label: 'Suspendue', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: AlertCircle },
};

const PLAN_CONFIG: Record<CompanyPlan, { label: string; color: string }> = {
  starter: { label: 'Starter', color: 'bg-gray-100 text-gray-700' },
  pro: { label: 'Pro', color: 'bg-blue-100 text-blue-700' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-700' },
};

const PAGE_SIZE = 10;

export default function AdminCompaniesList({
  filters,
  onFiltersChange,
  onCompanySelect,
  onActionComplete,
}: AdminCompaniesListProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action dialogs
  const [actionTarget, setActionTarget] = useState<Company | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'suspend' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminBackofficeService.getCompanies({
        search: filters.search || undefined,
        status: filters.status || undefined,
        plan: filters.plan || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });
      setCompanies(data);
      setTotalCount(data.length);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const paginatedCompanies = companies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    setActionLoading(true);
    try {
      switch (actionType) {
        case 'activate':
          await adminBackofficeService.activateCompany(actionTarget.id);
          break;
        case 'suspend':
          await adminBackofficeService.suspendCompany(actionTarget.id);
          break;
        case 'delete':
          await adminBackofficeService.deleteCompany(actionTarget.id);
          break;
      }
      setActionTarget(null);
      setActionType(null);
      onActionComplete();
      fetchCompanies();
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (company: Company, type: 'activate' | 'suspend' | 'delete') => {
    setActionTarget(company);
    setActionType(type);
  };

  const clearFilters = () => {
    onFiltersChange({ search: '', status: '', plan: '', dateFrom: '', dateTo: '' });
    setPage(1);
  };

  const hasActiveFilters = filters.status || filters.plan || filters.dateFrom || filters.dateTo;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Gestion des Companies</h2>
        <p className="text-sm text-gray-500 mt-1">
          {totalCount} company(s) trouvée(s)
          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-2 text-green-600 hover:text-green-700 underline text-xs">
              Réinitialiser les filtres
            </button>
          )}
        </p>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email, contact, ville..."
              value={filters.search}
              onChange={(e) => {
                onFiltersChange({ ...filters, search: e.target.value });
                setPage(1);
              }}
              className="pl-9 h-10"
            />
            {filters.search && (
              <button
                onClick={() => onFiltersChange({ ...filters, search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-10"
          >
            <Filter size={14} className="mr-1.5" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-1.5 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Statut</label>
              <Select
                value={filters.status}
                onValueChange={(v) => { onFiltersChange({ ...filters, status: v as CompanyStatus | '' }); setPage(1); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspendue</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Plan</label>
              <Select
                value={filters.plan}
                onValueChange={(v) => { onFiltersChange({ ...filters, plan: v as CompanyPlan | '' }); setPage(1); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Date min</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => { onFiltersChange({ ...filters, dateFrom: e.target.value }); setPage(1); }}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Date max</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => { onFiltersChange({ ...filters, dateTo: e.target.value }); setPage(1); }}
                className="h-9"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : paginatedCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Building2 size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">Aucune company trouvée</p>
            <p className="text-xs mt-1">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Company</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Contact</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Statut</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Plan</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">MRR</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Utilisateurs</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Alertes</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCompanies.map((company) => {
                    const statusCfg = STATUS_CONFIG[company.status];
                    const StatusIcon = statusCfg.icon;
                    const planCfg = PLAN_CONFIG[company.plan];
                    return (
                      <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{company.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{company.city}, {company.country}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-gray-900">{company.contactName}</p>
                            <p className="text-xs text-gray-500">{company.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                            <StatusIcon size={10} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${planCfg.color}`}>
                            {planCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-gray-900">
                            ${company.mrr > 0 ? company.mrr.toLocaleString() : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users size={12} className="text-gray-400" />
                            <span className="text-gray-700">{company.userCount}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {company.overdueCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                              <AlertCircle size={12} />
                              {company.overdueCount} en retard
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">OK</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onCompanySelect(company.id)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir détail"
                            >
                              <Eye size={15} />
                            </button>
                            {company.status !== 'active' && company.status !== 'suspended' && (
                              <button
                                onClick={() => openActionDialog(company, 'activate')}
                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Activer"
                              >
                                <Power size={15} />
                              </button>
                            )}
                            {company.status === 'active' && (
                              <button
                                onClick={() => openActionDialog(company, 'suspend')}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Suspendre"
                              >
                                <Power size={15} className="rotate-180" />
                              </button>
                            )}
                            <button
                              onClick={() => openActionDialog(company, 'delete')}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Affichage {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} sur {totalCount}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionTarget && !!actionType} onOpenChange={() => { setActionTarget(null); setActionType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'activate' && 'Activer cette company ?'}
              {actionType === 'suspend' && 'Suspendre cette company ?'}
              {actionType === 'delete' && 'Supprimer cette company ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'activate' && (
                <>La company <strong>{actionTarget?.name}</strong> sera activée et pourra accéder à la plateforme.</>
              )}
              {actionType === 'suspend' && (
                <>La company <strong>{actionTarget?.name}</strong> sera suspendue. Elle ne pourra plus accéder à la plateforme jusqu'à réactivation.</>
              )}
              {actionType === 'delete' && (
                <>Cette action est irréversible. Toutes les données de <strong>{actionTarget?.name}</strong> seront définitivement supprimées.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionLoading}
              className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {actionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Chargement...
                </div>
              ) : (
                <>
                  {actionType === 'activate' && 'Activer'}
                  {actionType === 'suspend' && 'Suspendre'}
                  {actionType === 'delete' && 'Supprimer'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
