/**
 * @file ProfileDropdown.tsx
 * @description Menu dropdown elegante e moderno acionado pela foto de perfil na barra superior.
 * Inclui atalhos para Configurações, Termos de Uso, Política de Privacidade, Diagnóstico de Conexão e Logout Seguro.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  FileText,
  Lock,
  Wifi,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Activity,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';

export const ProfileDropdown: React.FC = () => {
  const { user, isAdmin, requestSignOut, openAuthModal } = useAuth();
  const {
    setCurrentTab,
    databaseHealth,
    checkDatabaseHealth,
  } = useBooks();

  const [isOpen, setIsOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fechar no ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsTermsOpen(false);
        setIsPrivacyOpen(false);
        setIsHealthOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenSettings = () => {
    setIsOpen(false);
    setCurrentTab('settings');
  };

  const handleOpenTerms = () => {
    setIsOpen(false);
    setIsTermsOpen(true);
  };

  const handleOpenPrivacy = () => {
    setIsOpen(false);
    setIsPrivacyOpen(true);
  };

  const handleOpenHealth = async () => {
    setIsOpen(false);
    setIsHealthOpen(true);
    setIsCheckingHealth(true);
    try {
      await checkDatabaseHealth();
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleManualHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      await checkDatabaseHealth();
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    requestSignOut();
  };

  const handleLogin = () => {
    setIsOpen(false);
    openAuthModal();
  };

  const isGuest = !user;
  const displayName = user ? (user.name || user.email.split('@')[0]) : 'Visitante';
  const initial = user ? (user.name || user.email || 'U').charAt(0).toUpperCase() : 'V';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Perfil / Gatilho do Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu do perfil e opções da conta"
        title={user ? `Menu do perfil: ${user.email}` : 'Menu do usuário e opções'}
        className={`group flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer border ${
          isOpen
            ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/40 text-slate-900 dark:text-white shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
        }`}
      >
        {/* Foto ou Inicial */}
        <div className="relative shrink-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-7 h-7 rounded-full object-cover shadow-xs border border-amber-500/40 group-hover:border-amber-500 transition-colors"
            />
          ) : (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black uppercase shadow-xs border ${
              isGuest 
                ? 'bg-slate-500 border-slate-400/40' 
                : 'bg-gradient-to-tr from-amber-500 to-amber-600 border-amber-400/30'
            }`}>
              {isGuest ? <User className="w-3.5 h-3.5" /> : initial}
            </div>
          )}
          {/* Indicador de status online */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
            isGuest ? 'bg-slate-400' : 'bg-emerald-500'
          }`} />
        </div>

        {/* Nome do Usuário */}
        <span className="max-w-[100px] sm:max-w-[130px] truncate font-semibold hidden md:inline text-left">
          {displayName}
        </span>

        {/* Seta indicativa */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-500' : ''
          }`}
        />
      </button>

      {/* Menu Flutuante (Dropdown) */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Cabeçalho do Perfil */}
          <div className="p-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-11 h-11 rounded-2xl object-cover shadow-sm border border-amber-500/40 shrink-0"
                />
              ) : (
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-black uppercase shadow-sm shrink-0 border ${
                  isGuest 
                    ? 'bg-slate-600 border-slate-500/40' 
                    : 'bg-gradient-to-tr from-amber-500 to-amber-600 border-amber-400/30'
                }`}>
                  {isGuest ? <User className="w-5 h-5" /> : initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </h4>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  ) : isGuest ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                      Visitante
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user ? user.email : 'Acesso temporário / local'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Opções */}
          <div className="p-2 space-y-1 text-xs">
            {/* Opção se for Visitante: Entrar */}
            {isGuest && (
              <button
                type="button"
                onClick={handleLogin}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors text-left group cursor-pointer shadow-xs mb-1"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-950" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-black block">Entrar ou Criar Conta</span>
                  <span className="text-[11px] text-slate-900/80 block truncate">
                    Sincronize seus livros na nuvem
                  </span>
                </div>
              </button>
            )}
            {/* Opção 1: Meu Perfil / Configurações */}
            <button
              type="button"
              onClick={handleOpenSettings}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-semibold block text-slate-900 dark:text-white">
                  Meu Perfil / Configurações
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Personalização, temas e metas
                </span>
              </div>
            </button>

            {/* Opção 2: Diagnóstico de Conexão */}
            <button
              type="button"
              onClick={handleOpenHealth}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Wifi className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold block text-slate-900 dark:text-white">
                    Diagnóstico de Conexão
                  </span>
                  {databaseHealth?.latencyMs ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/40">
                      {databaseHealth.latencyMs}ms
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {databaseHealth?.status === 'healthy'
                    ? 'Nuvem Supabase operacional'
                    : 'Testar saúde do banco'}
                </span>
              </div>
            </button>

            {/* Separador */}
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            {/* Opção 3: Termos de Uso */}
            <button
              type="button"
              onClick={handleOpenTerms}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:text-amber-500 transition-colors">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Termos de Uso</span>
            </button>

            {/* Opção 4: Política de Privacidade */}
            <button
              type="button"
              onClick={handleOpenPrivacy}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:text-emerald-500 transition-colors">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Política de Privacidade</span>
            </button>

            {/* Separador e Opção 5: Sair (Logout) com Confirmação Elegante */}
            {!isGuest && (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold block">Sair do BookFlow</span>
                    <span className="text-[11px] text-rose-500/80 dark:text-rose-400/80 block truncate">
                      Encerramento seguro com confirmação
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Diagnóstico de Conexão */}
      {isHealthOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="health-modal-title"
          onClick={() => setIsHealthOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                    Monitor de Infraestrutura
                  </span>
                  <h3
                    id="health-modal-title"
                    className="text-base font-bold text-slate-900 dark:text-white"
                  >
                    Diagnóstico de Conexão
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHealthOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Card */}
            <div className="space-y-4 my-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Status do Banco de Dados
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        databaseHealth?.status === 'healthy'
                          ? 'bg-emerald-500 animate-pulse'
                          : databaseHealth?.status === 'degraded'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {databaseHealth?.status === 'healthy'
                        ? '100% Operacional'
                        : databaseHealth?.status === 'degraded'
                        ? 'Latência Elevada'
                        : 'Modo Local / Offline'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                      Tempo de Resposta (Ping)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {databaseHealth?.latencyMs ? `${databaseHealth.latencyMs} ms` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                      Nuvem Sincronizada
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      Supabase Cloud
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {databaseHealth?.message ||
                  'Sua biblioteca, metas e sessões estão protegidas com sincronização contínua e criptografia ponta a ponta.'}
              </p>
            </div>

            {/* Ações do Modal */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 mt-4">
              <button
                type="button"
                onClick={handleManualHealthCheck}
                disabled={isCheckingHealth}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                <span>{isCheckingHealth ? 'Testando...' : 'Testar Novamente'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHealthOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-amber-600 dark:hover:bg-amber-500 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Termos de Uso */}
      {isTermsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsTermsOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[85vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Termos de Uso do BookFlow
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-600 dark:text-slate-300 space-y-3 overflow-y-auto pr-1">
              <p>
                <strong>1. Aceitação dos Termos:</strong> Ao utilizar o BookFlow, você concorda em gerenciar seu acervo pessoal de leitura de acordo com as diretrizes aqui estabelecidas.
              </p>
              <p>
                <strong>2. Propriedade dos Seus Dados:</strong> Todo o seu histórico de leitura, notas, livros cadastrados e sessões pertencem única e exclusivamente a você. Você tem o direito de exportar seus dados a qualquer momento via arquivo JSON ou planilha CSV.
              </p>
              <p>
                <strong>3. Sincronização em Nuvem e Modo Local:</strong> O BookFlow oferece sincronização contínua com seu banco de dados Supabase e modo offline/local para que você nunca perca suas sessões de leitura mesmo sem internet.
              </p>
              <p>
                <strong>4. Disponibilidade do Serviço:</strong> Nos empenhamos em manter 99.9% de disponibilidade em todos os serviços. Em caso de manutenção programada, avisos globais serão exibidos com antecedência.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-amber-600 text-xs font-bold cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Política de Privacidade */}
      {isPrivacyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsPrivacyOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[85vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Política de Privacidade & Proteção de Dados
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-600 dark:text-slate-300 space-y-3 overflow-y-auto pr-1">
              <p>
                <strong>1. Compromisso com a Privacidade:</strong> O BookFlow não comercializa, não compartilha e não expõe suas informações de leitura ou dados pessoais a terceiros.
              </p>
              <p>
                <strong>2. Segurança na Autenticação:</strong> A autenticação utiliza o protocolo seguro do Supabase Auth com criptografia TLS de ponta a ponta e senhas com hash criptográfico irreversível.
              </p>
              <p>
                <strong>3. Armazenamento Local e Cookies:</strong> Utilizamos armazenamento seguro no seu navegador apenas para preservar suas preferências visuais (tema claro/escuro, cores de perfil e lembretes diários).
              </p>
              <p>
                <strong>4. Exclusão de Conta e Dados:</strong> Você pode solicitar a remoção integral de suas informações ou restaurar configurações padrão a qualquer instante pelo painel de Configurações.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-amber-600 text-xs font-bold cursor-pointer"
              >
                Compreendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
