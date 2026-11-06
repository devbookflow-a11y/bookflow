/**
 * @file ConfirmLogoutModal.tsx
 * @description Modal elegante de confirmação antes de encerrar a sessão (Logout) no BookFlow.
 */

import React, { useEffect } from 'react';
import { LogOut, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ConfirmLogoutModal: React.FC = () => {
  const { user, isLogoutConfirmOpen, cancelSignOut, confirmSignOut } = useAuth();

  // Fechar no ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLogoutConfirmOpen) {
        cancelSignOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutConfirmOpen, cancelSignOut]);

  if (!isLogoutConfirmOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      onClick={cancelSignOut}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 overflow-hidden transition-all transform animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shadow-xs">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold block">
                Confirmação de Segurança
              </span>
              <h2
                id="logout-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white leading-tight"
              >
                Encerrar Sessão
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={cancelSignOut}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensagem Principal */}
        <div className="relative z-10 space-y-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Tem certeza que deseja sair do BookFlow?
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Sua biblioteca, metas literárias e histórico de leitura continuarão sincronizados e protegidos. Você poderá entrar novamente a qualquer momento com suas credenciais.
          </p>

          {/* Card do Usuário Conectado */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm shrink-0">
                {(user.name || user.email || 'U').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  {user.name || user.email.split('@')[0]}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                <span>Salvo</span>
              </div>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex items-center justify-end gap-2.5 relative z-10">
          <button
            type="button"
            onClick={cancelSignOut}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => confirmSignOut()}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-rose-600/25 active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sim, Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
