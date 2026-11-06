/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookProvider, useBooks } from './context/BookContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileTabBar } from './components/MobileTabBar';
import { ReadingMonitor } from './components/ReadingMonitor';
import { LibraryView } from './components/LibraryView';
import { DashboardView } from './components/DashboardView';
import { BookFormModal } from './components/BookFormModal';
import { LogSessionModal } from './components/LogSessionModal';
import { BookDetailModal } from './components/BookDetailModal';
import { CsvImportModal } from './components/CsvImportModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ReadingReminderToast } from './components/ReadingReminderToast';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { SettingsView } from './components/SettingsView';
import { EditSessionModal } from './components/EditSessionModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { Footer } from './components/Footer';
import { ConfirmLogoutModal } from './components/ConfirmLogoutModal';
import { GlobalBroadcastBanner } from './components/GlobalBroadcastBanner';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import {
  supabaseAdminService,
  MaintenanceConfig,
} from './services/supabaseAdminService';
import { ShieldAlert, ArrowRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentTab, setCurrentTab, isOnboardingOpen, closeOnboarding } = useBooks();
  const { user, loading, isAdmin } = useAuth();

  const [maintenance, setMaintenance] = useState<MaintenanceConfig>(() =>
    supabaseAdminService.getMaintenanceConfig()
  );

  const checkMaintenance = () => {
    const cfg = supabaseAdminService.getMaintenanceConfig();
    setMaintenance(cfg);
  };

  useEffect(() => {
    const handleSettingsChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'maintenance') {
        checkMaintenance();
      }
    };

    window.addEventListener('bookflow_system_settings_changed', handleSettingsChanged);
    window.addEventListener('storage', handleSettingsChanged);

    return () => {
      window.removeEventListener('bookflow_system_settings_changed', handleSettingsChanged);
      window.removeEventListener('storage', handleSettingsChanged);
    };
  }, []);

  // Redefine a aba ativa para o padrão ao deslogar
  useEffect(() => {
    if (!user) {
      setCurrentTab('reading');
    }
  }, [user, setCurrentTab]);

  // Carregamento inicial do estado de autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black animate-pulse shadow-lg shadow-amber-500/20">
            B
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Carregando BookFlow...
          </span>
        </div>
      </div>
    );
  }

  // Redirecionamento obrigatório de Logout: se o usuário não estiver autenticado, exibe a tela de login
  // impedindo que ele permaneça na interface interna da aplicação
  if (!user) {
    return (
      <div
        className="min-h-screen flex flex-col bg-slate-950 text-slate-100 justify-between"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <AuthModal isFullScreen={true} />
        <Footer />
      </div>
    );
  }

  // Bloqueio do Modo de Manutenção para usuários comuns
  if (maintenance.enabled && !isAdmin) {
    return <MaintenanceScreen config={maintenance} onRefreshCheck={checkMaintenance} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'reading':
        return <ReadingMonitor />;
      case 'library':
        return <LibraryView initialStatusFilter="all" />;
      case 'to_read':
        return <LibraryView initialStatusFilter="to_read" />;
      case 'completed':
        return <LibraryView initialStatusFilter="completed" />;
      case 'dashboard':
        return <DashboardView />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return <AdminDashboardView />;
      default:
        return <ReadingMonitor />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Alerta de Modo de Manutenção Ativo (Visível Exclusivamente para o Administrador) */}
      {maintenance.enabled && isAdmin && (
        <div className="bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 shadow-sm z-50">
          <div className="flex items-center gap-2 truncate">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Modo de Manutenção ATIVO: Usuários comuns estão vendo a tela de manutenção. Seu acesso de administrador continua liberado.
            </span>
          </div>
          <button
            onClick={() => setCurrentTab('admin')}
            className="underline flex items-center gap-1 shrink-0 hover:text-white transition-colors"
          >
            <span>Gerenciar no Painel</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <Navbar />

      {/* Container principal com compensação de padding-top para a barra fixa e safe-area */}
      <div
        className="flex-1 flex w-full max-w-[1600px] mx-auto min-w-0 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))]"
        style={{
          paddingTop: 'calc(var(--navbar-height, 56px) + env(safe-area-inset-top, 0px))',
        }}
      >
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 min-w-0">
          {renderContent()}
        </main>
      </div>

      {/* Premium SaaS Footer */}
      <Footer />

      <MobileTabBar />

      {/* Global Modals & Notifications */}
      <BookFormModal />
      <LogSessionModal />
      <EditSessionModal />
      <BookDetailModal />
      <CsvImportModal />
      <CategoryManagerModal />
      <ConfirmDeleteModal />
      <ReadingReminderToast />
      <AuthModal />
      <ConfirmLogoutModal />
      <OnboardingTourModal isOpen={isOnboardingOpen} onClose={closeOnboarding} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BookProvider>
        <AppContent />
      </BookProvider>
    </AuthProvider>
  );
}
