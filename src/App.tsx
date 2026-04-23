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
const ComptabiliteAIAgent = () => {
  useComptabiliteAI({
    telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
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

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index-Protected"));
const Clients = lazy(() => import("./pages/Clients-Protected"));
const Transactions = lazy(() => import("./pages/Transactions-Protected"));
const Factures = lazy(() => import("./pages/Factures-Protected"));
const FacturesCreate = lazy(() => import("./pages/Factures-Create"));
const FacturesView = lazy(() => import("./pages/Factures-View"));
const FacturesPreview = lazy(() => import("./pages/Factures-Preview"));

const Settings = lazy(() => import("./pages/Settings"));

const POSCaisse = lazy(() => import("./pages/POS-Caisse"));
const Declarants = lazy(() => import("./pages/Declarants"));
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
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/pos" element={
                  <ProtectedRoute>
                    <POSCaisse />
                  </ProtectedRoute>
                } />
                <Route path="/declarants" element={
                  <ProtectedRoute allowedRoles={['admin', 'comptable']}>
                    <Declarants />
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <Clients />
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
