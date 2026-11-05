/**
 * @file NotificationDropdown.tsx
 * @description Ícone estilizado com sino e menu flutuante de notificações, avisos de sistema e comunicados globais.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Megaphone,
  BookOpen,
  Cloud,
  Sparkles,
  Trophy,
  X,
  Trash2,
  Settings,
  BellOff,
} from 'lucide-react';
import { useBooks, AppNotification } from '../context/BookContext';

export const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    dismissNotification,
    clearAllNotifications,
    setCurrentTab,
  } = useBooks();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'broadcast':
        return <Megaphone className="w-4 h-4 text-rose-500" />;
      case 'reminder':
        return <BookOpen className="w-4 h-4 text-amber-500" />;
      case 'cloud':
        return <Cloud className="w-4 h-4 text-emerald-500" />;
      case 'system':
        return <Sparkles className="w-4 h-4 text-sky-500" />;
      case 'goal':
        return <Trophy className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  const getBadgeStyle = (type: AppNotification['type']) => {
    switch (type) {
      case 'broadcast':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'reminder':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'cloud':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'system':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'goal':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Botão de Notificações com Badge */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label="Abrir central de notificações e avisos"
        aria-expanded={isOpen}
        title="Central de Notificações & Avisos"
        className={`relative min-h-[40px] min-w-[40px] p-2 rounded-xl transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Indicador / Badge de não lidos */}
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60 pointer-events-none" />
          </span>
        )}
      </button>

      {/* Backdrop transparente para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Flutuante (Dropdown) */}
      {isOpen && (
        <div
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header do Menu */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Notificações & Avisos</span>
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {unreadNotificationsCount} nova{unreadNotificationsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">Lidas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <BellOff className="w-8 h-8 stroke-1 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum aviso pendente
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Você está totalmente em dia com suas leituras!
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 transition-colors relative group flex items-start gap-3 ${
                    item.read
                      ? 'bg-transparent hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      : 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06] hover:bg-amber-500/[0.08]'
                  }`}
                >
                  {/* Ícone contextual */}
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-xs mt-0.5">
                    {getIconForType(item.type)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        {item.priority === 'high' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Urgente
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-4">
                      {item.message}
                    </p>
                  </div>

                  {/* Botão de dispensar / fechar aviso individual */}
                  <button
                    type="button"
                    onClick={() => dismissNotification(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity rounded-md"
                    title="Dispensar esta notificação"
                    aria-label="Dispensar notificação"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Ponto indicador de não lido */}
                  {!item.read && (
                    <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer do Menu */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setCurrentTab('settings');
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1 text-[11px] font-medium"
            >
              <Settings className="w-3 h-3" />
              <span>Ajustar Lembretes</span>
            </button>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 text-[11px]"
                title="Limpar todos os avisos da lista"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar Todas</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
