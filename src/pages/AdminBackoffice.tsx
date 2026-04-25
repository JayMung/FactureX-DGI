import { useState, useEffect } from 'react';
import { adminBackofficeService, type CompanyStatus, type CompanyPlan } from '@/services/adminBackofficeService';
import AdminBackofficeDashboard from '@/components/admin/backoffice/AdminBackofficeDashboard';
import AdminCompaniesList from '@/components/admin/backoffice/AdminCompaniesList';
import CompanyDetail from '@/components/admin/backoffice/CompanyDetail';
import { LayoutDashboard, Building2, FileText, Settings, ChevronRight, LogOut } from 'lucide-react';

type Tab = 'dashboard' | 'companies' | 'factures' | 'config';

interface Filters {
  search: string;
  status: CompanyStatus | '';
  plan: CompanyPlan | '';
  dateFrom: string;
  dateTo: string;
}

export default function AdminBackoffice() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    plan: '',
    dateFrom: '',
    dateTo: '',
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'companies' as Tab, label: 'Companies', icon: Building2 },
    { id: 'factures' as Tab, label: 'Factures', icon: FileText },
    { id: 'config' as Tab, label: 'Configuration', icon: Settings },
  ];

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setActiveTab('companies');
  };

  const handleBackToList = () => {
    setSelectedCompanyId(null);
  };

  const handleActionComplete = () => {
    // Refresh will happen automatically via React state
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">FS</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">FactureSmart</h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">Admin Backoffice</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedCompanyId(null); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id && !selectedCompanyId
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">Mode Demo</span>
              </div>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6">
        {/* Breadcrumb when viewing company detail */}
        {selectedCompanyId && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <button
              onClick={handleBackToList}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              Companies
            </button>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-gray-900 font-medium">Détail Company</span>
          </div>
        )}

        {/* Tab Content */}
        {selectedCompanyId ? (
          <CompanyDetail
            companyId={selectedCompanyId}
            onBack={handleBackToList}
            onActionComplete={handleActionComplete}
          />
        ) : activeTab === 'dashboard' ? (
          <AdminBackofficeDashboard onCompanySelect={handleCompanySelect} />
        ) : activeTab === 'companies' ? (
          <AdminCompaniesList
            filters={filters}
            onFiltersChange={setFilters}
            onCompanySelect={handleCompanySelect}
            onActionComplete={handleActionComplete}
          />
        ) : activeTab === 'factures' ? (
          <AdminFacturesSection />
        ) : (
          <AdminConfigSection />
        )}
      </main>
    </div>
  );
}

function AdminFacturesSection() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminBackofficeService.getAllInvoices().then(data => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    sent: 'bg-blue-100 text-blue-700',
    draft: 'bg-gray-100 text-gray-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Toutes les Factures</h2>
        <p className="text-sm text-gray-500 mt-1">{invoices.length} factures demo</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">N° Facture</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Company</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Client</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Montant</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.slice(0, 20).map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-900">{inv.companyName}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.clientName}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ${inv.amount.toLocaleString()} {inv.currency}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inv.issueDate).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminConfigSection() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Configuration Système</h2>
        <p className="text-sm text-gray-500 mt-1">Paramètres globaux de la plateforme</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'TVA par défaut', value: '16%', desc: 'Taux TVA applicable sur les factures' },
          { label: 'Mode Maintenance', value: 'Désactivé', desc: 'Lorsque activé, bloque l\'accès client' },
          { label: 'Template Facture', value: 'Standard', desc: 'Template par défaut pour les nouvelles factures' },
          { label: 'Devise principale', value: 'USD', desc: 'Devise de facturation principale' },
          { label: 'Limit API/month', value: '10,000', desc: 'Nombre maximum d\'appels API par mois' },
          { label: 'Session timeout', value: '24h', desc: 'Durée de session avant déconnexion auto' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </div>
              <button className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
