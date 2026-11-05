import React from 'react';
import {
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';

export const Navbar: React.FC = () => {
  const {
    readingBooks,
    currentTab,
    setCurrentTab,
  } = useBooks();
  const { user, isAdmin, openAuthModal } = useAuth();

  const getBreadcrumb = () => {
    switch (currentTab) {
      case 'reading':
        return 'Lendo Atualmente';
      case 'library':
        return 'Biblioteca Completa';
      case 'to_read':
        return 'Pretendo Ler (Desejos)';
      case 'completed':
        return 'Já Lidos (Histórico)';
      case 'dashboard':
        return 'Dashboard & Estatísticas';
      case 'settings':
        return 'Configurações & Personalização';
      case 'admin':
        return 'Painel do Administrador';
      default:
        return 'Painel';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 flex items-center justify-between gap-1.5 sm:gap-4 md:gap-6 px-2.5 sm:px-6 md:px-8 py-2 sm:py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors pointer-events-auto">
      {/* Zone 1: Wordmark & Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-sm shadow-amber-500/20 bg-slate-900 border border-slate-800 shrink-0">
          <img src="/icon-192x192.png" alt="BookFlow Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            BookFlow
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline -mt-1">
            Gerenciador de Leituras Inteligente
          </span>
        </div>
      </div>

      {/* Zone 2: Contextual indicator / Title */}
      <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 truncate">
        <span className="text-slate-400 dark:text-slate-600">/</span>
        <span className="font-semibold text-slate-900 dark:text-slate-200 whitespace-nowrap">
          {getBreadcrumb()}
        </span>
        {currentTab === 'reading' && readingBooks.length > 0 && (
          <>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {readingBooks.length} livro{readingBooks.length > 1 ? 's' : ''} em andamento
            </span>
          </>
        )}
      </div>

      {/* Zone 3: Auth & Actions (Cleaned & Touch Optimized) */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 pointer-events-auto">
        {/* Quick Admin Dashboard Access */}
        {isAdmin && (
          <button
            onClick={() => setCurrentTab('admin')}
            type="button"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              currentTab === 'admin'
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Acessar Painel do Administrador"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Painel Admin</span>
          </button>
        )}

        {/* Central de Notificações & Avisos */}
        <NotificationDropdown />

        {/* User Account / Profile Dropdown */}
        <div className="flex items-center gap-1.5 pl-0.5 sm:pl-1 border-l border-slate-200 dark:border-slate-800">
          {user ? (
            <ProfileDropdown />
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={openAuthModal}
                type="button"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-500" />
                <span>Entrar</span>
              </button>
              <ProfileDropdown />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
