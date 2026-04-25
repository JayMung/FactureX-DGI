"use client";

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  adminBackofficeService,
  getGrowthData,
  getSectorDistribution,
  getTopCompanies,
  type DashboardKPIs,
  type Invoice,
  type Company,
} from '@/services/adminBackofficeService';
import { TrendingUp, TrendingDown, AlertTriangle, Building2, FileText, DollarSign, Users, Activity } from 'lucide-react';

// ============================================================================
// KPI CARD
// ============================================================================

interface KPICardProps {
  title: string;
  value: string;
  growth: number;
  icon: React.ElementType;
  subtitle?: string;
  onClick?: () => void;
}

function KPICard({ title, value, growth, icon: Icon, subtitle, onClick }: KPICardProps) {
  const isPositive = growth >= 0;
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${onClick ? 'hover:border-green-300' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          title.includes('Revenu') || title.includes('MRR')
            ? 'bg-green-50'
            : title.includes('Companies')
            ? 'bg-cyan-50'
            : title.includes('Factures')
            ? 'bg-blue-50'
            : 'bg-purple-50'
        }`}>
          <Icon size={20} className={
            title.includes('Revenu') || title.includes('MRR')
              ? 'text-green-600'
              : title.includes('Companies')
              ? 'text-cyan-600'
              : title.includes('Factures')
              ? 'text-blue-600'
              : 'text-purple-600'
          } />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {isPositive ? (
          <TrendingUp size={14} className="text-green-500" />
        ) : (
          <TrendingDown size={14} className="text-red-500" />
        )}
        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{growth}%
        </span>
        <span className="text-xs text-gray-400">vs mois dernier</span>
      </div>
    </div>
  );
}

// ============================================================================
// ALERT TICKER
// ============================================================================

interface Alert {
  id: string;
  type: 'warning' | 'danger';
  title: string;
  description: string;
  count?: number;
  companyId?: string;
}

interface AlertTickerProps {
  alerts: Alert[];
  onCompanyClick: (companyId: string) => void;
}

function AlertTicker({ alerts, onCompanyClick }: AlertTickerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-600" />
        <h3 className="text-sm font-semibold text-red-800">Alertes</h3>
        <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
          {alerts.length}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              alert.companyId ? 'cursor-pointer' : ''
            }`}
            onClick={() => alert.companyId && onCompanyClick(alert.companyId)}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.type === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{alert.title}</p>
              <p className="text-xs text-gray-500 truncate">{alert.description}</p>
            </div>
            {alert.count && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                alert.type === 'danger'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {alert.count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// GROWTH CHART
// ============================================================================

interface GrowthChartProps {
  data: { month: string; mrr: number; companies: number; invoices: number }[];
}

function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Croissance MRR</h3>
          <p className="text-xs text-gray-500 mt-0.5">12 derniers mois</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']}
          />
          <Line
            type="monotone"
            dataKey="mrr"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#16a34a' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// SECTOR DISTRIBUTION CHART
// ============================================================================

interface SectorChartProps {
  data: { sector: string; label: string; count: number; percentage: number; color: string }[];
}

function SectorChart({ data }: SectorChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Répartition par Secteur</h3>
        <p className="text-xs text-gray-500 mt-0.5">Companies actives</p>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={60}
              paddingAngle={3}
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          {data.map((item) => (
            <div key={item.sector} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-600 truncate">{item.label}</span>
              <span className="text-xs font-medium text-gray-900 ml-auto">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOP COMPANIES CHART
// ============================================================================

interface TopCompaniesProps {
  data: { id: string; name: string; mrr: number; growth: number; sector: string }[];
  onCompanyClick: (companyId: string) => void;
}

function TopCompaniesChart({ data, onCompanyClick }: TopCompaniesProps) {
  const COLORS = ['#22c55e', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Top Companies</h3>
        <p className="text-xs text-gray-500 mt-0.5">Par MRR</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={100} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`$${value}`, 'MRR']}
          />
          <Bar dataKey="mrr" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-1.5">
        {data.map((company, i) => (
          <div
            key={company.id}
            className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onCompanyClick(company.id)}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: COLORS[i] }}>
                {i + 1}
              </div>
              <span className="text-xs font-medium text-gray-800 truncate max-w-[140px]">{company.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">${company.mrr}</span>
              <span className={`text-[10px] font-medium ${company.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {company.growth >= 0 ? '+' : ''}{company.growth}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

interface AdminBackofficeDashboardProps {
  onCompanySelect: (companyId: string) => void;
}

export default function AdminBackofficeDashboard({ onCompanySelect }: AdminBackofficeDashboardProps) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [suspendedCompanies, setSuspendedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsData, setAlertsData] = useState<Alert[]>([]);

  useEffect(() => {
    Promise.all([
      adminBackofficeService.getKPIs(),
      adminBackofficeService.getOverdueInvoices(),
      adminBackofficeService.getCompany('comp-005'),
      adminBackofficeService.getCompany('comp-011'),
      adminBackofficeService.getCompanies({ status: 'pending' }),
    ]).then(([kpisData, overdue, comp5, comp11, pendingCompanies]) => {
      setKpis(kpisData);
      setGrowthData(getGrowthData());
      setSectorData(getSectorDistribution());
      setTopCompanies(getTopCompanies());
      setOverdueInvoices(overdue.slice(0, 5));
      setSuspendedCompanies([comp5!, comp11!].filter(Boolean) as Company[]);

      // Build alerts
      const alerts: Alert[] = [];
      if (kpisData.suspendedCompanies > 0) {
        alerts.push({
          id: 'suspended',
          type: 'danger',
          title: `${kpisData.suspendedCompanies} company(s) suspendue(s)`,
          description: 'Vérifier les raisons de la suspension et prendre action',
          count: kpisData.suspendedCompanies,
        });
      }
      if (kpisData.overdueInvoicesCount > 0) {
        alerts.push({
          id: 'overdue',
          type: 'danger',
          title: `${kpisData.overdueInvoicesCount} factures en retard`,
          description: `Montant total: $${kpisData.totalOverdueAmount.toLocaleString()} à récupérer`,
          count: kpisData.overdueInvoicesCount,
        });
      }
      if (pendingCompanies.length > 0) {
        alerts.push({
          id: 'pending',
          type: 'warning',
          title: `${pendingCompanies.length} inscription(s) en attente`,
          description: 'Nouvelles companies à activer',
          count: pendingCompanies.length,
        });
      }
      setAlertsData(alerts);
      setLoading(false);
    });
  }, []);

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Dashboard Admin</h2>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de la plateforme FactureSmart</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="MRR"
          value={`$${kpis.mrr.toLocaleString()}`}
          growth={kpis.mrrGrowth}
          icon={DollarSign}
          subtitle="Revenu mensuel récurrent"
        />
        <KPICard
          title="Companies Actives"
          value={String(kpis.activeCompanies)}
          growth={kpis.activeCompaniesGrowth}
          icon={Building2}
          subtitle={`${kpis.newCompaniesThisMonth} nouvelles ce mois`}
          onClick={() => onCompanySelect('')}
        />
        <KPICard
          title="Factures ce mois"
          value={String(kpis.invoicesThisMonth)}
          growth={kpis.invoicesThisMonthGrowth}
          icon={FileText}
          subtitle="Total factures émises"
        />
        <KPICard
          title="Taux Conversion"
          value={`${kpis.conversionRate}%`}
          growth={kpis.conversionRateGrowth}
          icon={Activity}
          subtitle="Factures payées / émises"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <GrowthChart data={growthData} />
        </div>
        <div>
          <SectorChart data={sectorData} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TopCompaniesChart data={topCompanies} onCompanyClick={onCompanySelect} />
        </div>
        <div>
          <AlertTicker alerts={alertsData} onCompanyClick={onCompanySelect} />
        </div>
      </div>
    </div>
  );
}
