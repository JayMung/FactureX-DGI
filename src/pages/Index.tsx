"use client";

import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  Receipt,
  TrendingUp,
  Activity,
  FileText,
  Settings,
  Plus,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useRealTimeActivity } from '../hooks/useRealTimeActivity';
import RemixIcon from '@/lib/icons';
import { useNavigate } from 'react-router-dom';

// DRC geometric motif background style (from mockup)
const rdcBgStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='40' height='40' fill='%2310B981' fill-opacity='0.025'/%3E%3Crect x='40' y='40' width='40' height='40' fill='%2310B981' fill-opacity='0.025'/%3E%3Crect x='40' width='40' height='40' fill='none' stroke='%2310B981' stroke-opacity='0.03' stroke-width='1'/%3E%3Crect y='40' width='40' height='40' fill='none' stroke='%2310B981' stroke-opacity='0.03' stroke-width='1'/%3E%3Cpath d='M0 40 L40 0' stroke='%2310B981' stroke-opacity='0.015' stroke-width='1' fill='none'/%3E%3Cpath d='M40 80 L80 40' stroke='%2310B981' stroke-opacity='0.015' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
  backgroundSize: '80px 80px',
};

// Monthly chart data (mockup: 12 months)
const monthlyData = [
  { month: 'Jan', emitted: 98, validated: 82 },
  { month: 'Fév', emitted: 110, validated: 95 },
  { month: 'Mar', emitted: 125, validated: 108 },
  { month: 'Avr', emitted: 142, validated: 121 },
  { month: 'Mai', emitted: 0, validated: 0 },
  { month: 'Juin', emitted: 0, validated: 0 },
  { month: 'Juil', emitted: 0, validated: 0 },
  { month: 'Août', emitted: 0, validated: 0 },
  { month: 'Sep', emitted: 0, validated: 0 },
  { month: 'Oct', emitted: 0, validated: 0 },
  { month: 'Nov', emitted: 0, validated: 0 },
  { month: 'Déc', emitted: 0, validated: 0 },
];

// Recent invoices mock data
const recentInvoices = [
  { id: 'FAC-2026-0142', client: 'ETS Mulamba & Fils', amount: 'CDF 1,450,000', date: '22 Avr 2026', status: 'Validée' },
  { id: 'FAC-2026-0141', client: 'SARL Kasaï Services', amount: 'USD 3,200', date: '21 Avr 2026', status: 'En attente' },
  { id: 'FAC-2026-0140', client: 'Compagnie minière du Katanga', amount: 'USD 18,500', date: '20 Avr 2026', status: 'Validée' },
  { id: 'FAC-2026-0139', client: 'BTP Construction SARL', amount: 'CDF 850,000', date: '19 Avr 2026', status: 'Validée' },
  { id: 'FAC-2026-0138', client: 'Importations Pétrole Kinshasa', amount: 'USD 7,800', date: '18 Avr 2026', status: 'Rejetée' },
];

const Index = () => {
  usePageSetup({
    title: 'Tableau de bord',
    subtitle: "Vue d'ensemble de votre activité fiscale"
  });

  const navigate = useNavigate();
  const { stats, isLoading: statsLoading } = useDashboard();
  const { logs, isLoading: logsLoading } = useActivityLogs(1, 50);
  const { activities } = useRealTimeActivity(50);

  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(now.toLocaleDateString('fr-FR', options));
  }, []);

  const formatCurrencyValue = (amount: number, currency: string = 'USD') => {
    if (currency === 'CDF') {
      return `${amount.toLocaleString('fr-FR')} CDF`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Mock KPIs from maquette
  const dashboardStats = [
    {
      title: 'Factures émises',
      value: '142',
      change: '+12%',
      changeType: 'up' as const,
      icon: 'file-list-3-line',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      tagColor: 'text-green-600 bg-green-50',
      period: 'Ce mois-ci',
    },
    {
      title: 'Montant total',
      value: 'CDF 184.5M',
      change: '+8%',
      changeType: 'up' as const,
      icon: 'money-dollar-circle-line',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      tagColor: 'text-green-600 bg-green-50',
      period: 'Ce mois-ci',
    },
    {
      title: 'TVA collectée',
      value: 'CDF 28.2M',
      change: '+18%',
      changeType: 'up' as const,
      icon: 'percent-line',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      tagColor: 'text-green-600 bg-green-50',
      period: 'Taux 18%',
    },
    {
      title: 'En attente DGI',
      value: '7',
      change: 'En cours',
      changeType: 'pending' as const,
      icon: 'time-line',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      tagColor: 'text-orange-600 bg-orange-50',
      period: 'À valider',
    },
  ];

  // Calculate chart bar heights
  const maxValue = Math.max(...monthlyData.map(d => d.emitted));
  const getBarHeight = (value: number) => maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-6">

        {/* Page title + actions (matches maquette header section) */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Aperçu général</h2>
            <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de votre activité fiscale</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-300">
              <option>Janvier — Avril 2026</option>
              <option>Janvier — Décembre 2025</option>
            </select>
            <Button variant="outline" className="flex items-center gap-2 text-sm">
              <RemixIcon name="download-line" size={16} />
              Exporter
            </Button>
            <Button
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
              onClick={() => navigate('/factures/new')}
            >
              <RemixIcon name="add-line" size={16} />
              Nouvelle facture
            </Button>
          </div>
        </div>

        {/* Stat cards — 4 KPI cards matching maquette */}
        <div className="grid grid-cols-4 gap-5">
          {dashboardStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <RemixIcon name={stat.icon} size={20} className={stat.iconColor} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.tagColor}`}>
                  {stat.changeType === 'up' && <i className="ri-arrow-up-s-line align-middle mr-0.5" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.period}</p>
            </div>
          ))}
        </div>

        {/* Main grid: Chart + Recent invoices */}
        <div className="grid grid-cols-3 gap-5">

          {/* Chart: Monthly invoices */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Factures mensuelles</h3>
                <p className="text-xs text-gray-400 mt-0.5">Évolution sur 12 mois</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-600 inline-block"></span>
                  Émises
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block"></span>
                  Validées
                </span>
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-3 h-44">
              {monthlyData.map((d, i) => {
                const emittedH = getBarHeight(d.emitted);
                const validatedH = getBarHeight(d.validated);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-36 justify-center">
                      <div
                        className="w-4 rounded-sm bg-green-600 transition-all duration-500"
                        style={{ height: `${emittedH}%`, minHeight: d.emitted > 0 ? '4px' : '0' }}
                      />
                      <div
                        className="w-4 rounded-sm bg-green-400 transition-all duration-500"
                        style={{ height: `${validatedH}%`, minHeight: d.validated > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent invoices panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Dernières factures</h3>
                <p className="text-xs text-gray-400 mt-0.5">Émises cette semaine</p>
              </div>
              <button
                onClick={() => navigate('/factures')}
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                Voir tout
              </button>
            </div>

            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inv.client}</p>
                    <p className="text-xs text-gray-400">{inv.id}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold text-gray-900">{inv.amount}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      inv.status === 'Validée' ? 'bg-green-50 text-green-600' :
                      inv.status === 'En attente' ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DGI Status section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Statut DGI</h3>
              <p className="text-xs text-gray-400 mt-0.5">Conformité et immatriculation</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <i className="ri-shield-check-line"></i>
              Conforme
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">7</p>
              <p className="text-xs text-gray-500">En attente validation</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-green-600">135</p>
              <p className="text-xs text-gray-500">Factures validées</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">#DGI-2847</p>
              <p className="text-xs text-gray-500">N° Immatriculation</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">18%</p>
              <p className="text-xs text-gray-500">Taux TVA actif</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
