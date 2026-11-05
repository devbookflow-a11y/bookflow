/**
 * @file GlobalBroadcastBanner.tsx
 * @description Banner de aviso/comunicado global gerenciado pelo Administrador do BookFlow.
 */

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Sparkles,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  supabaseAdminService,
  GlobalBroadcast,
} from '../services/supabaseAdminService';

export const GlobalBroadcastBanner: React.FC = () => {
  const [broadcast, setBroadcast] = useState<GlobalBroadcast>(() =>
    supabaseAdminService.getGlobalBroadcast()
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Carrega configuração inicial
    const cur = supabaseAdminService.getGlobalBroadcast();
    setBroadcast(cur);

    // Escuta evento customizado de alteração de configurações do sistema
    const handleSettingsChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'broadcast') {
        const updated = supabaseAdminService.getGlobalBroadcast();
        setBroadcast(updated);
        setIsDismissed(false); // Reseta dismiss quando o admin atualiza a mensagem
      }
    };

    window.addEventListener('bookflow_system_settings_changed', handleSettingsChanged);
    window.addEventListener('storage', handleSettingsChanged);

    return () => {
      window.removeEventListener('bookflow_system_settings_changed', handleSettingsChanged);
      window.removeEventListener('storage', handleSettingsChanged);
    };
  }, []);

  if (!broadcast.enabled || !broadcast.message.trim() || isDismissed) {
    return null;
  }

  // Estilos e ícone de acordo com o tipo
  const getTypeConfig = () => {
    switch (broadcast.type) {
      case 'announcement':
        return {
          bg: 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-600/15 border-amber-500/30 text-amber-900 dark:text-amber-200',
          badge: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30',
          icon: <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
          label: 'Novidade',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-rose-600/15 border-rose-500/30 text-rose-900 dark:text-rose-200',
          badge: 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
          label: 'Importante',
        };
      case 'update':
        return {
          bg: 'bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-indigo-600/15 border-indigo-500/30 text-indigo-900 dark:text-indigo-200',
          badge: 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/30',
          icon: <Megaphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />,
          label: 'Atualização',
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-blue-600/15 border-blue-500/30 text-blue-900 dark:text-blue-200',
          badge: 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-500/30',
          icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
          label: 'Aviso',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div
      role="alert"
      className={`relative z-30 border-b px-4 py-2.5 transition-all animate-fade-in ${config.bg}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {config.icon}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${config.badge}`}
          >
            {config.label}
          </span>
          <div className="flex items-center gap-2 truncate">
            {broadcast.title && (
              <span className="font-bold shrink-0">{broadcast.title}:</span>
            )}
            <span className="truncate font-medium">{broadcast.message}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity shrink-0"
          title="Fechar comunicado"
          aria-label="Fechar comunicado"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
