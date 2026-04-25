"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RemixIcon from '@/lib/icons';
import {
  BookOpen,
  ScrollText,
  BookMarked,
  Scale,
  ChartBar,
  TrendingUp,
  Landmark,
  FileOutput,
  ChevronDown,
  BookOpenCheck,
  FileCode,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';

interface SidebarProps {
  isMobileOpen?: boolean;
  currentPath?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath }) => {
  const { user, profileRole } = useAuth();
  const location = useLocation();
  const path = currentPath || location.pathname;

  const role = profileRole || 'caissier';
  const isAdmin = role === 'admin';
  const isComptable = role === 'comptable';

  const [comptaOpen, setComptaOpen] = React.useState(() =>
    ['/compta/plan-comptable', '/compta/journal', '/compta/grand-livre', '/compta/balance', '/compta/etats-financiers', '/compta/tresorerie', '/compta/releve-bancaire', '/compta/export-ohada'].some(p => path.startsWith(p))
  );

  // Maquette sections: NAVIGATION + OUTILS
  const navigationItems = [
    { iconName: 'dashboard-line', label: 'Dashboard', path: '/' },
    { iconName: 'file-list-3-line', label: 'Factures', path: '/factures' },
    { iconName: 'user-line', label: 'Clients', path: '/clients' },
    { iconName: 'package-2-line', label: 'Articles', path: '/articles' },
    { iconName: 'bank-card-line', label: 'Caisse', path: '/caisse' },
    { iconName: 'bar-chart-2-line', label: 'Rapports', path: '/rapports' },
    { iconName: 'file-list-3-line', label: 'Déclarations TVA', path: '/rapports/tva' },
    { iconName: 'settings-3-line', label: 'Paramètres', path: '/settings', adminOnly: true },
  ];

  const outilItems: Array<{ iconName: string; label: string; path: string; badge?: number }> = [];

  const filteredNav = navigationItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess('Déconnexion réussie');
  };

  // Build user initials for avatar
  const getInitials = () => {
    const first = user?.user_metadata?.first_name || '';
    const last = user?.user_metadata?.last_name || '';
    if (first || last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    const first = user?.user_metadata?.first_name || '';
    const last = user?.user_metadata?.last_name || '';
    if (first || last) return `${first} ${last}`.trim();
    return user?.email?.split('@')[0] || 'Utilisateur';
  };

  const getCompanyName = () => {
    return user?.user_metadata?.company_name || 'SARL Pambu & Fils';
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-file-paper-2-line text-white text-base" />
          </div>
          <div>
            <span className="text-gray-900 text-base font-bold">Facture Smart</span>
            <span className="block text-[10px] text-gray-400 font-medium -mt-0.5">DGI — RDC</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        {/* NAVIGATION section label */}
        <div className="px-3 py-2 mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigation</span>
        </div>

        {filteredNav.map((item) => {
          const isActive = path === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-green-50 text-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <RemixIcon name={item.iconName} size={18} className={isActive ? "text-green-600" : "text-gray-500"} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Section Documentation */}
        <div className="mt-4">
          <div className="px-3 py-2 mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ressources</span>
          </div>
          {[
            { icon: BookOpenCheck, label: 'Documentation', path: '/docs' },
            { icon: FileCode, label: 'Référence API', path: '/api-reference' },
          ].map((item) => {
            const IconComp = item.icon;
            const isActive = path === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-green-50 text-green-600"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <IconComp className={cn("w-[18px] h-[18px]", isActive ? "text-green-600" : "text-gray-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Section Comptabilité SYSCOHADA (admin only) */}
        {isAdmin && (
          <div className="mt-4">
            <button
              onClick={() => setComptaOpen(!comptaOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Comptabilité OHADA
              </span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", comptaOpen && "rotate-180")} />
            </button>
            {comptaOpen && (
              <ul className="mt-1 space-y-0.5">
                {[
                  { label: 'Plan comptable', path: '/compta/plan-comptable', icon: BookOpen },
                  { label: 'Journal', path: '/compta/journal', icon: ScrollText },
                  { label: 'Grand livre', path: '/compta/grand-livre', icon: BookMarked },
                  { label: 'Balance', path: '/compta/balance', icon: Scale },
                  { label: 'États financiers', path: '/compta/etats-financiers', icon: ChartBar },
                  { label: 'Trésorerie', path: '/compta/tresorerie', icon: TrendingUp },
                  { label: 'Relevé bancaire', path: '/compta/releve-bancaire', icon: Landmark },
                  { label: 'Export OHADA', path: '/compta/export-ohada', icon: FileOutput },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isActive = path === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-green-50 text-green-600"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        )}
                      >
                        <IconComp className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </nav>

      {/* User profile */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 text-sm font-bold">{getInitials()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{getUserDisplayName()}</p>
            <p className="text-xs text-gray-400 truncate">{getCompanyName()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Déconnexion"
          >
            <i className="ri-logout-box-r-line text-base" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
