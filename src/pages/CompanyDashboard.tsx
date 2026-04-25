"use client";

import React from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { useCompanyDashboard } from '../hooks/useCompanyDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Clock,
  DollarSign,
  ArrowRight,
  Activity,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const CompanyDashboard: React.FC = () => {
  const {
    kpi,
    chartData,
    recentFactures,
    alertesRetard,
    recentActivity,
    isLoading,
    refetch,
    formatUsd,
  } = useCompanyDashboard();

  usePageSetup({
    title: 'Tableau de bord',
    subtitle: 'Vue d\'ensemble de votre entreprise',
  });

  const quickActions = [
    {
      id: 'facture',
      title: 'Nouvelle facture',
      description: 'Créez une facture pour un client.',
      icon: FileText,
      href: '/factures/new',
      badge: 'Factures',
      badgeClasses: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      iconClasses: 'bg-emerald-500/15 text-emerald-600',
      borderClasses: 'border-emerald-100/60 hover:border-emerald-200/80',
    },
    {
      id: 'client',
      title: 'Nouveau client',
      description: 'Enregistrez un nouveau client.',
      icon: Users,
      href: '/clients/new',
      badge: 'CRM',
      badgeClasses: 'bg-sky-50 text-sky-700 border border-sky-100',
      iconClasses: 'bg-sky-500/15 text-sky-600',
      borderClasses: 'border-sky-100/70 hover:border-sky-200/80',
    },
  ];

  const getStatutLabel = (statut: string) => {
    const map: Record<string, string> = {
      validee: 'Validée',
      en_attente: 'En attente',
      payee: 'Payée',
      annulee: 'Annulée',
      brouillon: 'Brouillon',
    };
    return map[statut] || statut;
  };

  const getStatutColor = (statut: string) => {
    const map: Record<string, string> = {
      validee: 'bg-green-100 text-green-800',
      en_attente: 'bg-amber-100 text-amber-800',
      payee: 'bg-blue-100 text-blue-800',
      annulee: 'bg-red-100 text-red-800',
      brouillon: 'bg-gray-100 text-gray-800',
    };
    return map[statut] || 'bg-gray-100 text-gray-800';
  };

  const getRetardColor = (jours: number) => {
    if (jours > 30) return 'text-red-600 bg-red-50';
    if (jours > 14) return 'text-amber-600 bg-amber-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <Layout>
      <div className="space-y-5 animate-in fade-in duration-300">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Bienvenue sur FactureSmart
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Kinshasa, RDC
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Alertes Retard Banner */}
        {alertesRetard.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold text-red-800 text-sm">
                  ⚠️ {alertesRetard.length} paiement{alertesRetard.length > 1 ? 's' : ''} en retard
                </p>
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  Action requise
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Total: {formatUsd(kpi?.montantEnRetardUsd || 0)} · La plus ancienne: {alertesRetard[0]?.facture_number} ({alertesRetard[0]?.jours_retard} jours)
              </p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Factures émises */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">Factures émises</p>
            <p className="text-2xl font-extrabold text-gray-900 font-mono">
              {isLoading ? '—' : kpi?.totalFactures ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
            </p>
          </div>

          {/* Clients enregistrés */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded-full flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-sky-500"></span>
                Actifs
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">Clients enregistrés</p>
            <p className="text-2xl font-extrabold text-gray-900 font-mono">
              {isLoading ? '—' : kpi?.totalClients ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">Dans votre base</p>
          </div>

          {/* Chiffre d'affaires */}
          <div
            className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                USD
              </span>
            </div>
            <p className="text-xs font-medium text-emerald-700 mb-1">Chiffre d'affaires</p>
            <p className="text-2xl font-extrabold text-emerald-800 font-mono">
              {isLoading ? '—' : formatUsd(kpi?.chiffreAffairesUsd ?? 0)}
            </p>
            {kpi && kpi.chiffreAffairesCdf > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                ≈ {formatUsd(kpi.chiffreAffairesCdf / 2800)} CDF
              </p>
            )}
          </div>

          {/* Factures en retard */}
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                (kpi?.facturesEnRetard ?? 0) > 0
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-500 bg-gray-50'
              }`}>
                {(kpi?.facturesEnRetard ?? 0) > 0 ? 'Alerte' : 'OK'}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">Factures en retard</p>
            <p className="text-2xl font-extrabold text-gray-900 font-mono">
              {isLoading ? '—' : kpi?.facturesEnRetard ?? 0}
            </p>
            {(kpi?.montantEnRetardUsd ?? 0) > 0 && (
              <p className="text-xs text-red-500 mt-1 font-medium">
                {formatUsd(kpi!.montantEnRetardUsd)} à récupérer
              </p>
            )}
          </div>
        </div>

        {/* Graphique + Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chart: Factures par mois */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Évolution des factures</h3>
                <p className="text-xs text-gray-400">
                  {new Date().getFullYear()} — Nombre de factures émises par mois
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                {new Date().getFullYear()}
              </Badge>
            </div>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Chargement...
              </div>
            ) : chartData.every(d => d.count === 0) ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value: number, name: string) => [
                      name === 'count' ? `${value} factures` : formatUsd(value),
                      name === 'count' ? 'Quantité' : 'Montant'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="count"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Alertes Retard */}
          <Card className="shadow-sm border-red-100">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Retards de paiement
                </CardTitle>
                {alertesRetard.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {alertesRetard.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
              ) : alertesRetard.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Aucun retard</p>
                  <p className="text-xs text-gray-400 mt-1">Tous vos clients sont à jour</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertesRetard.map((alerte) => (
                    <a
                      key={alerte.id}
                      href={`/factures/view/${alerte.id}`}
                      className="block group rounded-lg border border-red-100 p-3 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-red-700">
                            {alerte.facture_number}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{alerte.client_nom}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900 font-mono">
                            {formatUsd(alerte.total_general)}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${getRetardColor(alerte.jours_retard)}`}>
                            <Clock className="w-3 h-3" />
                            {alerte.jours_retard}j
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                  <a href="/factures?statut=en_attente" className="block text-center text-xs text-red-600 font-semibold hover:text-red-700 pt-2 border-t mt-2">
                    Voir tout →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Recent Factures + Activité récente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Navigation</p>
                  <CardTitle className="text-lg font-bold text-gray-900">Accès rapides</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                  {quickActions.length} raccourcis
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {quickActions.map((action) => (
                  <a
                    key={action.id}
                    href={action.href}
                    className={`group block rounded-xl border bg-white/60 p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg ${action.borderClasses}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{action.description}</p>
                      </div>
                      <span className={`rounded-full p-2 ${action.iconClasses}`}>
                        <action.icon className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-medium ${action.badgeClasses}`}>
                        {action.badge}
                      </span>
                      <span className="inline-flex items-center gap-1 text-gray-500 group-hover:text-gray-900 font-medium">
                        Accéder
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dernières factures */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Dernières factures
                </CardTitle>
                <a href="/factures" className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1">
                  Tout voir <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
              ) : recentFactures.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucune facture récente
                </p>
              ) : (
                <div className="space-y-3">
                  {recentFactures.map((f) => (
                    <a key={f.id} href={`/factures/view/${f.id}`} className="block group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-600">
                            {f.facture_number}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{f.client_nom}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatutColor(f.statut)}`}>
                            {getStatutLabel(f.statut)}
                          </span>
                          <span className="text-sm font-bold text-gray-900 font-mono">
                            {formatUsd(f.total_general)}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                  <a href="/factures" className="block text-center text-xs text-emerald-600 font-semibold hover:text-emerald-700 pt-2 border-t mt-2">
                    Voir toutes les factures →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucune activité récente
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-sm">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-relaxed">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(activity.timestamp).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </Layout>
  );
};

export default CompanyDashboard;
