/**
 * @file MaintenanceScreen.tsx
 * @description Tela de aviso elegante de Modo de Manutenção (Kill Switch) para usuários comuns do BookFlow.
 */

import React, { useState } from 'react';
import {
  Wrench,
  ShieldAlert,
  Clock,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  supabaseAdminService,
  MaintenanceConfig,
} from '../services/supabaseAdminService';

interface MaintenanceScreenProps {
  config: MaintenanceConfig;
  onRefreshCheck: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  config,
  onRefreshCheck,
}) => {
  const { signOut, user } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckAgain = async () => {
    setChecking(true);
    await onRefreshCheck();
    setTimeout(() => setChecking(false), 800);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 relative overflow-hidden select-none">
      <div className="w-full max-w-lg relative z-10 text-center">
        {/* Animated Brand Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/20 animate-ping opacity-30" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/25 border border-amber-400/30">
            <Wrench className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Manutenção Programada</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
          Estamos em Manutenção Temporária
        </h1>

        {/* Message */}
        <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed max-w-md mx-auto">
          {config.message ||
            'Estamos aprimorando nossa infraestrutura para garantir a melhor estabilidade e velocidade na sua experiência de leitura. O sistema retornará em instantes.'}
        </p>

        {/* Estimated Return Box if available */}
        {config.estimatedReturn && config.estimatedReturn.trim() && (
          <div className="p-3.5 mb-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Previsão de retorno:{' '}
              <strong className="text-white font-semibold">
                {config.estimatedReturn}
              </strong>
            </span>
          </div>
        )}

        {/* Security & Action Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 mb-6 text-xs text-slate-400 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-slate-300 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Seus livros e anotações estão 100% seguros</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Nenhuma informação foi perdida. Você está conectado como{' '}
            <span className="text-slate-200 font-medium">
              {user?.email || 'usuário'}
            </span>
            .
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCheckAgain}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Verificando...' : 'Verificar Novamente'}</span>
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
