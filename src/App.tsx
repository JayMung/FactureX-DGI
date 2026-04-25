import { lazy, Suspense } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PageProvider } from "@/contexts/PageContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useComptabiliteAI } from '@/hooks/useComptabiliteAI';

// Agent IA Comptabilite - runs silently inside providers
// [COD-56] telegramBotToken supprimé du frontend — passe maintenant par Edge Function server-side
const ComptabiliteAIAgent = () => {
  useComptabiliteAI({
    // [COD-56] telegramChatId reste dans .env (n'est pas une clé secrète)
    // telegramBotToken est stocké server-side dans l'Edge Function api-telegram-send
    telegramChatId: import.meta.env.VITE_TELEGRAM_CHAT_ID,
    maxDaysWithoutReconciliation: 3,
    maxUnrecordedExpenses: 3,
  });
  return null;
};

// Page Loader component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Auth pages (small, loaded early)
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import SetupWizard from "./pages/SetupWizard";
import TeamManagement from "./pages/TeamManagement";
import UserEdit from "./pages/UserEdit";
import UserInvite from "./pages/UserInvite";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index-Protected"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const Clients = lazy(() => import("./pages/Clients-Protected"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const ClientsNew = lazy(() => import("./pages/Clients-New"));
const Transactions = lazy(() => import("./pages/Transactions-Protected"));
const Factures = lazy(() => import("./pages/Factures-Protected"));
const FacturesCreate = lazy(() => import("./pages/Factures-Create"));
const FacturesView = lazy(() => import("./pages/Factures-View"));
const FacturesPreview = lazy(() => import("./pages/Factures-Preview"));
const DgiStatus = lazy(() => import("./pages/DgiStatus"));
const Devis = lazy(() => import("./pages/Devis"));
const Rapports = lazy(() => import("./pages/Rapports"));
const TVADeclarations = lazy(() => import("./pages/TVADeclarations"));

const Settings = lazy(() => import("./pages/Settings"));
const CompanySettings = lazy(() => import("./pages/CompanySettings"));
const TwoFactorSetup = lazy(() => import("./pages/TwoFactorSetup"));
const RBACManager = lazy(() => import("./pages/RBACManager"));
const SubscriptionPlans = lazy(() => import("./pages/SubscriptionPlans"));

const POSCaisse = lazy(() => import("./pages/POS-Caisse"));
const POSSettings = lazy(() => import("./pages/POS-Settings"));
const POSHistorique = lazy(() => import("./pages/POS-Historique"));
const Declarants = lazy(() => import("./pages/Declarants"));
const Articles = lazy(() => import("./pages/Articles"));
const CaisseSessions = lazy(() => import("./pages/Caisse-Sessions"));
const CaisseOuverture = lazy(() => import("./pages/Caisse-Ouverture"));
const CaisseJournal = lazy(() => import("./pages/Caisse-Journal"));
const CaisseFermeture = lazy(() => import("./pages/Caisse-Fermeture"));
const CaisseTransfert = lazy(() => import("./pages/Caisse-Transfert"));

// Pages comptables SYSCOHADA [COD-65/66/67]
const ComptaPlanComptable = lazy(() => import("./pages/Compta-PlanComptable"));
const ComptaJournal = lazy(() => import("./pages/Compta-Journal"));
const ComptaGrandLivre = lazy(() => import("./pages/Compta-GrandLivre"));
const ComptaBalance = lazy(() => import("./pages/Compta-Balance"));
const ComptaEtatsFinanciers = lazy(() => import("./pages/Compta-EtatsFinanciers"));
const ComptaTresorerie = lazy(() => import("./pages/Compta-K7-Tresorerie"));
const ComptaReleveBancaire = lazy(() => import("./pages/Compta-K8-ReleveBancaire"));
const ComptaExportOHADA = lazy(() => import("./pages/Compta-K9-ExportOhada"));
const Documentation = lazy(() => import("./pages/Documentation"));
const APIReference = lazy(() => import("./pages/APIReference"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const AdminInvitation = lazy(() => import("./pages/AdminInvitation"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ComptabiliteAIAgent />
          <PageProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Admin setup disabled in production for security */}
                {import.meta.env.DEV && (
                  <Route path="/admin-setup" element={<AdminSetup />} />
                )}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/setup" element={<SetupWizard />} />
                <Route path="/settings/team" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TeamManagement />
                  </ProtectedRoute>
                } />
                <Route path="/settings/team/invite" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserInvite />
                  </ProtectedRoute>
                } />
                <Route path="/settings/team/edit/:id" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserEdit />
                  </ProtectedRoute>
                } />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin-invitation" element={<AdminInvitation />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/company-dashboard" element={
                  <ProtectedRoute>
                    <CompanyDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/pos" element={
                  <ProtectedRoute>
                    <POSCaisse />
                  </ProtectedRoute>
                } />
                <Route path="/pos/settings" element={
                  <ProtectedRoute>
                    <POSSettings />
                  </ProtectedRoute>
                } />
                <Route path="/pos/historique" element={
                  <ProtectedRoute>
                    <POSHistorique />
                  </ProtectedRoute>
                } />
                <Route path="/declarants" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <Declarants />
                  </ProtectedRoute>
                } />
                <Route path="/articles" element={
                  <ProtectedRoute>
                    <Articles />
                  </ProtectedRoute>
                } />
                <Route path="/caisse" element={
                  <ProtectedRoute>
                    <CaisseSessions />
                  </ProtectedRoute>
                } />
                <Route path="/caisse/ouverture" element={
                  <ProtectedRoute>
                    <CaisseOuverture />
                  </ProtectedRoute>
                } />
                <Route path="/caisse/journal" element={
                  <ProtectedRoute>
                    <CaisseJournal />
                  </ProtectedRoute>
                } />
                <Route path="/caisse/fermeture" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <CaisseFermeture />
                  </ProtectedRoute>
                } />
                <Route path="/caisse/transfert" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <CaisseTransfert />
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                } />
                <Route path="/clients/:id" element={
                  <ProtectedRoute>
                    <ClientDetail />
                  </ProtectedRoute>
                } />
                <Route path="/transactions" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <Transactions />
                  </ProtectedRoute>
                } />
                <Route path="/factures" element={
                  <ProtectedRoute>
                    <Factures />
                  </ProtectedRoute>
                } />
                <Route path="/factures/new" element={
                  <ProtectedRoute>
                    <FacturesCreate />
                  </ProtectedRoute>
                } />
                <Route path="/factures/edit/:id" element={
                  <ProtectedRoute>
                    <FacturesCreate />
                  </ProtectedRoute>
                } />
                <Route path="/factures/view/:id" element={
                  <ProtectedRoute>
                    <FacturesView />
                  </ProtectedRoute>
                } />
                <Route path="/factures/preview/:id" element={
                  <ProtectedRoute>
                    <FacturesPreview />
                  </ProtectedRoute>
                } />
                <Route path="/factures/:id/dgi-status" element={
                  <ProtectedRoute>
                    <DgiStatus />
                  </ProtectedRoute>
                } />
                <Route path="/devis" element={
                  <ProtectedRoute>
                    <Devis />
                  </ProtectedRoute>
                } />
                <Route path="/devis/new" element={
                  <ProtectedRoute>
                    <FacturesCreate />
                  </ProtectedRoute>
                } />
                <Route path="/clients/new" element={
                  <ProtectedRoute>
                    <ClientsNew />
                  </ProtectedRoute>
                } />
                <Route path="/rapports" element={
                  <ProtectedRoute>
                    <Rapports />
                  </ProtectedRoute>
                } />
                <Route path="/rapports/tva" element={
                  <ProtectedRoute>
                    <TVADeclarations />
                  </ProtectedRoute>
                } />
                <Route path="/pos-caisse" element={
                  <ProtectedRoute>
                    <POSCaisse />
                  </ProtectedRoute>
                } />
                <Route path="/encaissements" element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                } />
                <Route path="/settings/facture" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/settings/permissions" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                {/* Routes comptabilité SYSCOHADA [COD-65/66/67] */}
                <Route path="/compta/plan-comptable" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <ComptaPlanComptable />
                  </ProtectedRoute>
                } />
                <Route path="/compta/journal" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <ComptaJournal />
                  </ProtectedRoute>
                } />
                <Route path="/compta/grand-livre" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <ComptaGrandLivre />
                  </ProtectedRoute>
                } />
                <Route path="/compta/balance" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <ComptaBalance />
                  </ProtectedRoute>
                } />
                <Route path="/compta/etats-financiers" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <ComptaEtatsFinanciers />
                  </ProtectedRoute>
                } />
                <Route path="/compta/tresorerie" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <ComptaTresorerie />
                  </ProtectedRoute>
                } />
                <Route path="/compta/releve-bancaire" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <ComptaReleveBancaire />
                  </ProtectedRoute>
                } />
                <Route path="/compta/export-ohada" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <ComptaExportOHADA />
                  </ProtectedRoute>
                } />
                <Route path="/settings/entreprise" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CompanySettings />
                  </ProtectedRoute>
                } />
                <Route path="/settings/securite" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TwoFactorSetup />
                  </ProtectedRoute>
                } />
                <Route path="/settings/rbac" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <RBACManager />
                  </ProtectedRoute>
                } />
                <Route path="/settings/abonnement" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SubscriptionPlans />
                  </ProtectedRoute>
                } />
                <Route path="/docs" element={
                  <ProtectedRoute>
                    <Documentation />
                  </ProtectedRoute>
                } />
                <Route path="/api-reference" element={
                  <ProtectedRoute>
                    <APIReference />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </PageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
