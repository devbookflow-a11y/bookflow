import React, { useRef } from 'react';
import {
  BookOpen,
  Library,
  Bookmark,
  CheckCircle2,
  BarChart3,
  Flame,
  Target,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';
import { calculateDashboardStats } from '../utils/dashboardMetrics';

export const Sidebar: React.FC = () => {
  const {
    books,
    currentTab,
    setCurrentTab,
    goal,
    exportDataJson,
    importDataJson,
    resetToDefaults,
    openCsvModal,
    categories,
    openCategoryModal,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    openOnboarding,
    databaseHealth,
    checkDatabaseHealth,
  } = useBooks();

  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = calculateDashboardStats(books);

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const ok = await importDataJson(content);
          if (ok) {
            alert('Biblioteca importada com sucesso e sincronizada com a nuvem!');
          } else {
            alert('Erro ao importar arquivo. Verifique o formato JSON.');
          }
        } catch {
          alert('Erro ao importar arquivo. Verifique o formato JSON.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Deseja restaurar os livros de exemplo originais? Suas edições atuais serão substituídas.'
      )
    ) {
      resetToDefaults();
    }
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard & Metas',
      icon: BarChart3,
    },
    {
      id: 'library' as const,
      label: 'Biblioteca Completa',
      icon: Library,
      count: books.length,
    },
    {
      id: 'reading' as const,
      label: 'Lendo Atualmente',
      icon: BookOpen,
      count: stats.currentlyReadingCount,
      alert: stats.delayedBooksCount > 0,
    },
    {
      id: 'to_read' as const,
      label: 'Pretendo Ler',
      icon: Bookmark,
      count: stats.toReadCount,
    },
    {
      id: 'completed' as const,
      label: 'Já Lidos',
      icon: CheckCircle2,
      count: stats.totalBooksRead,
    },
    ...(isAdmin
      ? [
          {
            id: 'admin' as const,
            label: 'Painel Admin',
            icon: ShieldCheck,
            isAdminTab: true,
          },
        ]
      : []),
  ];

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 z-20 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md h-[calc(100vh-65px)] sticky top-[65px] select-none justify-between overflow-y-auto transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'w-16 lg:w-20 p-2.5 lg:p-3' : 'w-64 lg:w-72 p-4 lg:p-5'
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Toggle Collapsible Button for Tablet and Desktop */}
        <div
          className={`flex items-center ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between'
          } pb-2 border-b border-slate-100 dark:border-slate-800/80`}
        >
          {!isSidebarCollapsed && (
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Navegação
            </span>
          )}

          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title={
              isSidebarCollapsed
                ? 'Expandir menu lateral'
                : 'Recolher menu lateral (otimizar espaço no tablet)'
            }
            aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-amber-500" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5" aria-label="Navegação Principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`relative flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'
                } rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-amber-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`flex items-center ${
                    isSidebarCollapsed ? 'justify-center' : 'gap-3'
                  } truncate`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-amber-400 dark:text-amber-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* Badges when expanded */}
                {!isSidebarCollapsed && item.count !== undefined && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.alert && (
                      <span className="text-[10px] text-amber-500 font-bold px-1.5 py-0.5 rounded bg-amber-500/10">
                        Atenção
                      </span>
                    )}
                    <span
                      className={`text-xs tabular-nums px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-slate-800 text-slate-300 dark:bg-slate-700 dark:text-slate-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                )}

                {/* Badge dot when collapsed */}
                {isSidebarCollapsed && item.count !== undefined && item.count > 0 && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                      item.alert
                        ? 'bg-rose-500 animate-pulse'
                        : isActive
                        ? 'bg-amber-400'
                        : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  />
                )}

                {!isSidebarCollapsed && item.isAdminTab && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Reading Streak Widget (Expanded only) */}
        {!isSidebarCollapsed && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Sequência
                </span>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {stats.currentStreakDays} dia{stats.currentStreakDays !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {stats.currentStreakDays > 0
                ? `Você manteve o hábito por ${stats.currentStreakDays} dias consecutivos.`
                : 'Registre sua leitura hoje para iniciar a sequência!'}
            </p>
          </div>
        )}

        {/* Goal Quick Progress (Expanded only) */}
        {!isSidebarCollapsed && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Meta {goal.year}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                {stats.booksReadThisYear} / {goal.targetBooks}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (stats.booksReadThisYear / Math.max(1, goal.targetBooks)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Area: User, Database Health, Onboarding & Actions */}
      {/* Footer Area: User & Actions (Cleaned for regular readers) */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        {/* Database Health Status Widget - Apenas para Administradores */}
        {isAdmin && (
          <div
            onClick={() => checkDatabaseHealth()}
            title="Status do banco Supabase. Clique para verificar novamente."
            className={`cursor-pointer rounded-2xl border transition-all ${
              isSidebarCollapsed
                ? 'p-2 flex items-center justify-center'
                : 'p-2.5 flex items-center justify-between'
            } ${
              databaseHealth?.status === 'healthy'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : databaseHealth?.status === 'degraded'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  databaseHealth?.status === 'healthy'
                    ? 'bg-emerald-500'
                    : databaseHealth?.status === 'degraded'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold truncate">
                    {databaseHealth?.status === 'healthy'
                      ? 'Banco Supabase Ativo'
                      : databaseHealth?.status === 'degraded'
                      ? 'Latência Elevada'
                      : 'Modo Local Ativo'}
                  </span>
                  <span className="text-[10px] opacity-75 truncate">
                    {databaseHealth?.latencyMs ? `${databaseHealth.latencyMs}ms` : 'Sincronização local'}
                  </span>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <RefreshCw className="w-3 h-3 opacity-60 hover:opacity-100 shrink-0" />
            )}
          </div>
        )}


        {/* Opções avançadas de dados - Exclusivas do Administrador */}
        {isAdmin && !isSidebarCollapsed && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Gestão de Dados
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={openCategoryModal}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate"
              >
                <Layers className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">Categorias</span>
              </button>

              <button
                type="button"
                onClick={openCsvModal}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate"
              >
                <FileSpreadsheet className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">CSV</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <button
                onClick={handleExport}
                title="Exportar backup JSON"
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Exportar</span>
              </button>
              <label
                title="Importar backup JSON"
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Importar</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleReset}
                title="Restaurar dados de exemplo originais"
                className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
