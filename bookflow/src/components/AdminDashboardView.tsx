/**
 * @file AdminDashboardView.tsx
 * @description Painel de Administrador exclusivo e seguro do BookFlow com métricas globais e gestão de usuários.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  Database,
  Lock,
  Megaphone,
  Wrench,
  Flame,
  Power,
  Bell,
  AlertCircle,
  Eye,
  Send,
  Download,
  FileJson,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import {
  supabaseAdminService,
  AdminMetrics,
  AdminUserRecord,
  GlobalBroadcast,
  MaintenanceConfig,
} from '../services/supabaseAdminService';

export const AdminDashboardView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { setCurrentTab } = useBooks();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admins' | 'readers'>('all');
  const [copiedSql, setCopiedSql] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);

  // Estados para o Sistema de Broadcast (Mensagem Global)
  const [broadcast, setBroadcast] = useState<GlobalBroadcast>(() =>
    supabaseAdminService.getGlobalBroadcast()
  );
  const [broadcastTitle, setBroadcastTitle] = useState(broadcast.title || '');
  const [broadcastMessage, setBroadcastMessage] = useState(broadcast.message || '');
  const [broadcastType, setBroadcastType] = useState<GlobalBroadcast['type']>(
    broadcast.type || 'announcement'
  );
  const [broadcastEnabled, setBroadcastEnabled] = useState(broadcast.enabled);
  const [isSavingBroadcast, setIsSavingBroadcast] = useState(false);

  // Estados para o Modo de Manutenção (Kill Switch)
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>(() =>
    supabaseAdminService.getMaintenanceConfig()
  );
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(maintenance.enabled);
  const [maintenanceMessage, setMaintenanceMessage] = useState(maintenance.message);
  const [maintenanceReturn, setMaintenanceReturn] = useState(
    maintenance.estimatedReturn || ''
  );
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // Backup Global da Base de Dados (Exclusivo Administrador)
  const handleExportGlobalBackup = async () => {
    if (!isAdmin) return;
    setIsExportingBackup(true);
    try {
      const result = await supabaseAdminService.exportGlobalDatabaseBackup({
        id: user?.id,
        email: user?.email,
      });
      setActionFeedback(
        `✅ Backup global gerado com sucesso! Arquivo: ${result.fileName} (${result.summary.totalRecords} registros consolidados de todas as tabelas).`
      );
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err) {
      console.error('[AdminView] Erro ao exportar backup global:', err);
      setActionFeedback('Falha ao exportar backup global da base de dados.');
      setTimeout(() => setActionFeedback(null), 4000);
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleSaveBroadcast = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (broadcastEnabled && !broadcastMessage.trim()) {
      setActionFeedback('Por favor, digite a mensagem do comunicado antes de transmitir.');
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }
    setIsSavingBroadcast(true);
    const updated: GlobalBroadcast = {
      enabled: broadcastEnabled,
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      type: broadcastType,
    };
    const ok = await supabaseAdminService.saveGlobalBroadcast(updated);
    setIsSavingBroadcast(false);
    if (ok) {
      setBroadcast(updated);
      setActionFeedback(
        updated.enabled
          ? 'Comunicado global transmitido com sucesso para toda a plataforma!'
          : 'Comunicado global desativado com sucesso.'
      );
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleClearBroadcast = async () => {
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastEnabled(false);
    const updated: GlobalBroadcast = {
      enabled: false,
      title: '',
      message: '',
      type: 'announcement',
    };
    await supabaseAdminService.saveGlobalBroadcast(updated);
    setBroadcast(updated);
    setActionFeedback('Comunicado global limpo e desativado.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleToggleMaintenance = async (forceVal?: boolean) => {
    const nextState = typeof forceVal === 'boolean' ? forceVal : !maintenanceEnabled;
    setIsSavingMaintenance(true);
    const updated: MaintenanceConfig = {
      enabled: nextState,
      message:
        maintenanceMessage.trim() ||
        'Estamos aprimorando nossa infraestrutura para garantir a melhor experiência de leitura. O sistema retornará em breve.',
      estimatedReturn: maintenanceReturn.trim(),
    };
    const ok = await supabaseAdminService.saveMaintenanceConfig(updated);
    setIsSavingMaintenance(false);
    if (ok) {
      setMaintenanceEnabled(nextState);
      setMaintenance(updated);
      setActionFeedback(
        nextState
          ? '⚠️ MODO DE MANUTENÇÃO ATIVADO: Usuários comuns verão a tela de manutenção. Seu acesso de administrador continua liberado.'
          : '✅ Modo de Manutenção desativado! Sistema totalmente liberado para todos os leitores.'
      );
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  // Carrega métricas e lista de usuários
  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedMetrics, fetchedUsers] = await Promise.all([
        supabaseAdminService.fetchAdminMetrics(),
        supabaseAdminService.fetchAdminUsers(),
      ]);
      setMetrics(fetchedMetrics);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('[AdminView] Erro ao carregar dados administrativos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  // Alterna o status de administrador de um usuário na tabela
  const handleToggleAdmin = async (targetUser: AdminUserRecord) => {
    const nextStatus = !targetUser.isAdmin;
    const ok = await supabaseAdminService.updateUserAdminStatus(targetUser.id, nextStatus);
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isAdmin: nextStatus } : u))
      );
      setActionFeedback(
        nextStatus
          ? `Privilégios de Administrador concedidos a ${targetUser.email}!`
          : `Privilégios de Administrador removidos de ${targetUser.email}.`
      );
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Alterna o status da conta (ativo/suspenso)
  const handleToggleStatus = async (targetUser: AdminUserRecord) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const ok = await supabaseAdminService.updateUserStatus(targetUser.id, nextStatus);
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u))
      );
      setActionFeedback(
        nextStatus === 'suspended'
          ? `Usuário ${targetUser.email} marcado como Suspenso.`
          : `Usuário ${targetUser.email} reativado com sucesso.`
      );
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const copySqlSnippet = () => {
    const sql = `UPDATE public.profiles SET is_admin = true WHERE email = '${user?.email || 'diegomarques.mat@gmail.com'}';`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Filtragem de usuários
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (roleFilter === 'admins') return u.isAdmin;
      if (roleFilter === 'readers') return !u.isAdmin;
      return true;
    });
  }, [users, searchTerm, roleFilter]);

  // Se o usuário não tiver permissão de administrador, renderiza bloqueio com opção segura
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Acesso Restrito ao Painel Administrativo
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
            Esta seção é exclusiva para contas com a permissão <span className="font-semibold text-slate-900 dark:text-white">is_admin: true</span>. O usuário logado atualmente (<span className="font-medium text-amber-600 dark:text-amber-400">{user?.email || 'Não autenticado'}</span>) não possui privilégios de administrador.
          </p>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left mb-6 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Controle de Permissões:</span>
            </div>
            <p className="leading-relaxed">
              O e-mail mestre <strong>diegomarques.mat@gmail.com</strong> possui privilégios automáticos. Você também pode simular a visão administrativa imediatamente utilizando o botão abaixo.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={() => setCurrentTab('reading')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 hover:opacity-90 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Minhas Leituras</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Painel do Administrador
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Acesso Master
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Métricas consolidadas em tempo real, base de usuários e estatísticas da plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-slate-700"
            title="Recarregar Métricas do Banco"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setShowSqlSchema(!showSqlSchema)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors border border-amber-500/30"
            title="Ver Scripts SQL do Banco de Dados"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{showSqlSchema ? 'Ocultar SQL' : 'Schema SQL'}</span>
          </button>

          <button
            onClick={handleExportGlobalBackup}
            disabled={isExportingBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-600 transition-colors shadow-2xs disabled:opacity-60"
            title="Exportar backup JSON consolidado de todas as tabelas e usuários do Supabase"
          >
            <Download className={`w-3.5 h-3.5 ${isExportingBackup ? 'animate-bounce' : ''}`} />
            <span>{isExportingBackup ? 'Baixando Backup...' : 'Exportar Backup JSON'}</span>
          </button>
        </div>
      </div>

      {/* Visualizador do Schema SQL (Exclusivo do Admin, sem inputs de chaves) */}
      {showSqlSchema && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Database className="w-4 h-4" />
              <span>Estrutura do Banco de Dados Supabase (Schema & RLS)</span>
            </div>
            <button
              onClick={() => setShowSqlSchema(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
            >
              Fechar
            </button>
          </div>
          <p className="text-xs text-slate-400">
            As credenciais do Supabase estão configuradas via variáveis de ambiente seguras (<code className="text-amber-300">VITE_SUPABASE_URL</code> e <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code>). O script abaixo define as tabelas e políticas de Row Level Security (RLS).
          </p>
          <button
            onClick={copySqlSnippet}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Comando SQL Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar SQL de Administrador</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Feedback Toast */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Metrics Cards (Analytics Avançado de Crescimento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users & Recent Growth */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total de Usuários
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {isLoading ? '...' : metrics?.totalUsers.toLocaleString('pt-BR')}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{metrics?.recentUsersCount || 0} novos nos últimos 30 dias</span>
            </div>
            <span className="text-slate-400 dark:text-slate-500">
              {metrics?.activeReadersCount || 0} leitores com acesso ativo
            </span>
          </div>
        </div>

        {/* Card 2: Total Books */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Acervo Total de Livros
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {isLoading ? '...' : metrics?.totalBooks.toLocaleString('pt-BR')}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Média de {metrics?.averageBooksPerUser || 0} livros por leitor</span>
          </div>
        </div>

        {/* Card 3: Total Pages Read (Soma Geral de Páginas da Plataforma) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total de Páginas Lidas
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {isLoading ? '...' : metrics?.totalPagesRead.toLocaleString('pt-BR')}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Soma global em toda a plataforma</span>
          </div>
        </div>

        {/* Card 4: Completed Books & Completion Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Livros Concluídos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {isLoading ? '...' : metrics?.totalCompletedBooks.toLocaleString('pt-BR')}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>{metrics?.completionRatePercentage}% taxa de conclusão global</span>
          </div>
        </div>
      </div>

      {/* Ferramentas Estratégicas de Gestão SaaS: Broadcast & Kill Switch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurso 1: Sistema de Broadcast (Mensagem Global) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Sistema de Broadcast
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Transmita avisos e comunicados em tempo real para todos os usuários logados.
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                  broadcastEnabled && broadcastMessage.trim()
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {broadcastEnabled && broadcastMessage.trim() ? 'Ativo no App' : 'Inativo'}
              </span>
            </div>

            <form onSubmit={handleSaveBroadcast} className="space-y-3.5">
              {/* Opções de Ativação e Tipo */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={broadcastEnabled}
                    onChange={(e) => setBroadcastEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Exibir banner no topo da aplicação
                  </span>
                </label>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">Tipo:</span>
                  <select
                    value={broadcastType}
                    onChange={(e) =>
                      setBroadcastType(e.target.value as GlobalBroadcast['type'])
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="announcement">Novidade 🎉</option>
                    <option value="info">Aviso ℹ️</option>
                    <option value="update">Atualização 🚀</option>
                    <option value="warning">Importante ⚠️</option>
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Título do Comunicado (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 🎉 Nova Versão Disponível!"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Mensagem */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Mensagem Global
                </label>
                <textarea
                  rows={2}
                  placeholder="Digite aqui o texto que será exibido para todos os leitores..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
              </div>

              {/* Live Preview Box */}
              {broadcastMessage.trim() && (
                <div className="pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                    <Eye className="w-3 h-3" />
                    <span>Pré-visualização do Banner:</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-bold">{broadcastTitle || 'Aviso'}:</span>
                    <span className="truncate">{broadcastMessage}</span>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingBroadcast}
                  className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSavingBroadcast
                      ? 'Salvando...'
                      : broadcastEnabled
                      ? 'Salvar e Transmitir'
                      : 'Salvar Comunicado'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleClearBroadcast}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                  title="Limpar mensagem e desativar transmissão"
                >
                  Limpar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recurso 2: Modo de Manutenção (Kill Switch da Plataforma) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    maintenanceEnabled
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Modo de Manutenção (Kill Switch)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bloqueia temporariamente o acesso geral para melhorias e atualizações.
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                  maintenanceEnabled
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                }`}
              >
                {maintenanceEnabled ? 'Manutenção Ativa' : 'Sistema Online'}
              </span>
            </div>

            {/* Switch de Alta Visibilidade */}
            <div
              className={`p-4 rounded-2xl border mb-3.5 transition-colors ${
                maintenanceEnabled
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Power
                    className={`w-4 h-4 ${
                      maintenanceEnabled ? 'text-rose-500 animate-pulse' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold block">
                      {maintenanceEnabled
                        ? 'Modo de Manutenção Ligado'
                        : 'Sistema Operando Normalmente'}
                    </span>
                    <span className="text-[11px] opacity-80 block">
                      {maintenanceEnabled
                        ? 'Usuários comuns verão a tela de aviso de manutenção.'
                        : 'Todos os usuários podem ler e gerenciar seus livros normalmente.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleMaintenance(!maintenanceEnabled)}
                  disabled={isSavingMaintenance}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    maintenanceEnabled ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={maintenanceEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      maintenanceEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Configurações da Mensagem de Manutenção */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Mensagem exibida na tela de bloqueio dos usuários
                </label>
                <textarea
                  rows={2}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Ex: Estamos aprimorando nossa infraestrutura. O sistema retornará em breve."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Previsão de Retorno (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hoje às 16:30 ou Em 30 minutos"
                  value={maintenanceReturn}
                  onChange={(e) => setMaintenanceReturn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Explicação de Acesso do Administrador */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Acesso Master Garantido:</strong> O bloqueio se aplica apenas a usuários comuns. Sua conta de administrador permanece 100% liberada para navegar e testar a plataforma.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleMaintenance(maintenanceEnabled)}
                  disabled={isSavingMaintenance}
                  className={`w-full px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 ${
                    maintenanceEnabled
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>
                    {isSavingMaintenance
                      ? 'Salvando...'
                      : maintenanceEnabled
                      ? 'Atualizar Configurações de Manutenção'
                      : 'Salvar Mensagem de Manutenção'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recurso Estratégico: Backup Global da Base de Dados (Exclusivo Administrador) */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Backup Global da Base de Dados
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Restrito: is_admin = true
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Exportação completa e consolidada de todas as tabelas e dados de todos os usuários cadastrados no Supabase.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              Esta ferramenta de segurança administrativa consulta o banco de dados e gera um arquivo <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-mono text-[11px]">.json</code> consolidado contendo os registros de <strong className="text-slate-800 dark:text-slate-200">perfis, livros, sessões de leitura, notas/citações, metas, categorias, lembretes</strong> e configurações de sistema de toda a plataforma, servindo como uma ferramenta de salvaguarda integral para futuras atualizações do SaaS.
            </p>

            {/* Tags das Tabelas Consolidadas */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-slate-400">Tabelas consolidadas:</span>
              {['profiles', 'books', 'reading_sessions', 'book_notes', 'reading_goals', 'categories', 'reading_reminders', 'system_settings'].map((tab) => (
                <span
                  key={tab}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportGlobalBackup}
              disabled={isExportingBackup}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
              title="Disparar consulta consolidada e baixar backup JSON completo"
            >
              <Download className={`w-4 h-4 ${isExportingBackup ? 'animate-bounce' : ''}`} />
              <span>{isExportingBackup ? 'Consultando e Gerando JSON...' : 'Exportar Backup JSON (Global)'}</span>
            </button>
            <span className="text-[11px] text-slate-400 text-center lg:text-right">
              Acesso exclusivo para administradores
            </span>
          </div>
        </div>
      </div>

      {/* Users Table Section */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Usuários Cadastrados na Base
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualize a lista de contas, data de ingresso e gerencie permissões de administrador.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por e-mail ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  roleFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admins')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  roleFilter === 'admins'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Admins
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('readers')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  roleFilter === 'readers'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Leitores
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Data de Cadastro</th>
                <th className="py-3 px-4">Status de Acesso</th>
                <th className="py-3 px-4">Função / Permissão</th>
                <th className="py-3 px-4">Acervo de Livros</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentLoggedUser = u.email.toLowerCase() === user?.email?.toLowerCase();
                  const dateStr = new Date(u.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {u.name}
                              </span>
                              {isCurrentLoggedUser && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspenso
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {u.isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <ShieldCheck className="w-3 h-3 text-amber-500" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Leitor
                          </span>
                        )}
                      </td>

                      {/* Books count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                            {u.booksCount} livros
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({u.booksCompletedCount} lidos)
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                              u.isAdmin
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                            title={u.isAdmin ? 'Remover privilégio de administrador' : 'Promover para administrador'}
                          >
                            {u.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
                            title={u.status === 'active' ? 'Suspender usuário' : 'Ativar usuário'}
                          >
                            {u.status === 'active' ? (
                              <UserX className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supabase Security & RLS Tips Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-transparent border border-amber-500/20 dark:border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Como funciona a segurança de Administrador no Supabase
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              No banco Supabase, a tabela <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[11px]">public.profiles</code> armazena a flag <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[11px]">is_admin</code>. As políticas de Row Level Security (RLS) concedem permissões de leitura do painel de administração exclusivamente para os usuários autorizados.
            </p>
          </div>

          <button
            type="button"
            onClick={copySqlSnippet}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-xs"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Comando Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar SQL Promover Admin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
