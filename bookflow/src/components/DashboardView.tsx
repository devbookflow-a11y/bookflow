import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Flame,
  TrendingUp,
  Target,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Layers,
  Edit2,
  Check,
  Quote,
  Sparkles,
  ChevronRight,
  BarChart3,
  BookMarked,
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { calculateDashboardStats, calculateAnnualPace } from '../utils/dashboardMetrics';

export const DashboardView: React.FC = () => {
  const {
    books,
    goal,
    updateGoal,
    openAddBookModal,
  } = useBooks();
  const stats = calculateDashboardStats(books);

  // Annual pace calculation
  const annualPace = calculateAnnualPace(goal, stats.booksReadThisYear, stats.totalPagesRead);

  // Goal editing state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalBooksInput, setGoalBooksInput] = useState(String(goal.targetBooks));
  const [goalPagesInput, setGoalPagesInput] = useState(String(goal.targetPages || 6000));
  const [goalMode, setGoalMode] = useState<'books' | 'pages'>('books');

  // Category distribution filter: 'completed' vs 'all'
  const [categoryViewMode, setCategoryViewMode] = useState<'completed' | 'all'>('completed');

  // Hovered bar in 14-day chart
  const [hoveredBar, setHoveredBar] = useState<{ date: string; pages: number; label: string } | null>(null);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBooks = parseInt(goalBooksInput, 10);
    const parsedPages = parseInt(goalPagesInput, 10);
    if (!isNaN(parsedBooks) && parsedBooks > 0) {
      updateGoal({
        targetBooks: parsedBooks,
        targetPages: !isNaN(parsedPages) && parsedPages > 0 ? parsedPages : goal.targetPages,
      });
      setIsEditingGoal(false);
    }
  };

  const booksGoalPct = Math.min(
    100,
    Math.round((stats.booksReadThisYear / Math.max(1, goal.targetBooks)) * 100)
  );

  const targetPages = goal.targetPages || 6000;
  const pagesGoalPct = Math.min(
    100,
    Math.round((stats.totalPagesRead / Math.max(1, targetPages)) * 100)
  );

  const activeCategoryDist =
    categoryViewMode === 'completed' && stats.completedCategoryDistribution.length > 0
      ? stats.completedCategoryDistribution
      : stats.categoryDistribution;

  const maxPagesDaily = Math.max(30, ...stats.dailyActivity.map((d) => d.pages));

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard & Estatísticas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Acompanhe a sua meta anual, ritmo médio, distribuição por gêneros e diário literário.
          </p>
        </div>

        <button
          onClick={() => openAddBookModal()}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-600 text-xs font-bold transition-colors shadow-2xs"
        >
          + Novo Livro
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. COMPONENTE DE META ANUAL / DESAFIO LITERÁRIO */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-7 rounded-2xl md:rounded-3xl bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-sm">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Desafio Literário {goal.year}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-mono">
                  Dia {annualPace.dayOfYear} de {annualPace.totalDaysInYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sua meta oficial de leitura para o ano corrente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Mode: Books or Pages */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setGoalMode('books')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  goalMode === 'books'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Meta em Livros
              </button>
              <button
                onClick={() => setGoalMode('pages')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  goalMode === 'pages'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Meta em Páginas
              </button>
            </div>

            <button
              onClick={() => {
                setGoalBooksInput(String(goal.targetBooks));
                setGoalPagesInput(String(goal.targetPages || 6000));
                setIsEditingGoal(!isEditingGoal);
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1.5"
              title="Configurar Meta Anual"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ajustar Meta</span>
            </button>
          </div>
        </div>

        {/* Goal Edit Form Inline */}
        {isEditingGoal && (
          <form
            onSubmit={handleSaveGoal}
            className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-2.5">
              Personalizar Desafio Literário de {goal.year}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Meta de Livros no Ano
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={goalBooksInput}
                  onChange={(e) => setGoalBooksInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Meta Total de Páginas no Ano
                </label>
                <input
                  type="number"
                  min="100"
                  max="100000"
                  step="100"
                  value={goalPagesInput}
                  onChange={(e) => setGoalPagesInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs"
              >
                Salvar Metas
              </button>
            </div>
          </form>
        )}

        {/* Progress Display */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {goalMode === 'books'
                  ? stats.booksReadThisYear
                  : stats.totalPagesRead.toLocaleString('pt-BR')}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {goalMode === 'books'
                  ? `de ${goal.targetBooks} livros concluídos`
                  : `de ${targetPages.toLocaleString('pt-BR')} páginas lidas`}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="text-amber-600 dark:text-amber-400 text-sm">
                {goalMode === 'books' ? booksGoalPct : pagesGoalPct}%
              </span>
              <span className="text-slate-400">
                {goalMode === 'books'
                  ? `${Math.max(0, goal.targetBooks - stats.booksReadThisYear)} livros restantes`
                  : `${Math.max(0, targetPages - stats.totalPagesRead).toLocaleString('pt-BR')} páginas restantes`}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500 shadow-2xs"
              style={{ width: `${goalMode === 'books' ? booksGoalPct : pagesGoalPct}%` }}
            />
          </div>
        </div>

        {/* Dynamic Pace Indicator (Indicador Dinâmico de Ritmo) */}
        <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-900/40">
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
              annualPace.status === 'ahead'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                : annualPace.status === 'behind'
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                : 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {annualPace.status === 'ahead' ? (
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : annualPace.status === 'behind' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              )}
            </div>
            <div className="space-y-0.5 text-xs">
              <strong className="block font-bold text-xs sm:text-sm">
                {annualPace.headline}
              </strong>
              <p className="opacity-90 leading-relaxed text-[11px] sm:text-xs">
                {annualPace.subMessage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MÉTRICAS CONSOLIDADAS (6 CARDS RESUMO) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Livros Lidos no Ano */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Lidos em {goal.year}</span>
            <Target className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.booksReadThisYear}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            de {goal.targetBooks} na meta
          </div>
        </div>

        {/* Card 2: Total de Páginas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Total de Páginas</span>
            <BookOpen className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.totalPagesRead.toLocaleString('pt-BR')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            lidas acumuladas
          </div>
        </div>

        {/* Card 3: Média Págs/Livro */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Média Págs/Livro</span>
            <Layers className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.averagePagesPerBook}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            páginas por obra
          </div>
        </div>

        {/* Card 4: Notas e Citações */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Notas & Citações</span>
            <Quote className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.totalNotesCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            no diário de leitura
          </div>
        </div>

        {/* Card 5: Ritmo Médio */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Ritmo Médio</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.overallAveragePace}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            páginas por dia ativo
          </div>
        </div>

        {/* Card 6: Sequência Ativa */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold">Sequência Ativa</span>
            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.currentStreakDays}d
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            recorde: {stats.longestStreakDays} dias
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DISTRIBUIÇÃO VISUAL POR CATEGORIA & ATIVIDADE RECENTE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel Estatístico Visual de Distribuição por Categoria */}
        <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  Distribuição por Categoria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preferências de leitura e diversidade literária
                </p>
              </div>

              {/* View Switcher: Completed vs All */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs self-start sm:self-auto">
                <button
                  onClick={() => setCategoryViewMode('completed')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    categoryViewMode === 'completed'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Livros Concluídos
                </button>
                <button
                  onClick={() => setCategoryViewMode('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    categoryViewMode === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Toda a Estante
                </button>
              </div>
            </div>

            {/* Visual Multi-Segment Bar */}
            {activeCategoryDist.length > 0 && (
              <div className="mb-5 space-y-1.5">
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                  {activeCategoryDist.map((cat) => (
                    <div
                      key={cat.category}
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`${cat.category}: ${cat.percentage}% (${cat.count} livros)`}
                      className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:opacity-85 cursor-pointer"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Gênero mais lido: <strong className="text-slate-700 dark:text-slate-300 font-bold">{stats.topCategory}</strong></span>
                  <span>{activeCategoryDist.length} categorias</span>
                </div>
              </div>
            )}

            {/* Detailed Category Rows with Bars */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activeCategoryDist.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400 font-mono text-[11px]">
                      <span>{item.pages.toLocaleString('pt-BR')} págs</span>
                      <span>·</span>
                      <span>{item.count} {item.count === 1 ? 'livro' : 'livros'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Total na biblioteca:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {books.length} livros cadastrados
            </span>
          </div>
        </div>

        {/* Atividade de Leitura dos Últimos 14 Dias */}
        <div className="p-4 sm:p-6 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4 min-w-0">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                  <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>Atividade Recente (14 Dias)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Páginas lidas e registradas por dia
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hoveredBar ? (
                  <div className="text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2.5 py-0.5 rounded-full tabular-nums font-mono animate-fade-in shadow-2xs">
                    {hoveredBar.label}: {hoveredBar.pages} {hoveredBar.pages === 1 ? 'pág' : 'págs'}
                  </div>
                ) : (
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full font-mono">
                    {stats.dailyActivity.reduce((acc, d) => acc + d.pages, 0)} págs totais
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Responsive Chart */}
            <div className="h-44 sm:h-52 w-full pt-2 sm:pt-4 min-w-0">
              <div className="h-32 sm:h-40 flex items-end justify-between gap-1 sm:gap-1.5 md:gap-2 px-0.5 sm:px-1 w-full min-w-0">
                {stats.dailyActivity.map((day) => {
                  const heightPct = Math.max(6, Math.round((day.pages / maxPagesDaily) * 100));
                  const isHovered = hoveredBar?.date === day.date;
                  const hasActivity = day.pages > 0;
                  const dayOfMonth = day.date.split('-')[2] || day.label.split('/')[0];

                  return (
                    <div
                      key={day.date}
                      className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBar(day)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={() => setHoveredBar(hoveredBar?.date === day.date ? null : day)}
                      title={`${day.label}: ${day.pages} páginas`}
                    >
                      {/* Tooltip on hover / tap */}
                      {isHovered && (
                        <div className="absolute -top-7 z-20 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none border border-slate-700/50">
                          {day.pages} págs
                        </div>
                      )}
                      {/* Bar */}
                      <div
                        className={`w-full max-w-[20px] sm:max-w-[26px] md:max-w-[28px] rounded-t-sm sm:rounded-t-md transition-all duration-300 ${
                          hasActivity
                            ? isHovered
                              ? 'bg-amber-600 dark:bg-amber-400 shadow-sm ring-2 ring-amber-400/50'
                              : 'bg-amber-500 dark:bg-amber-500/90 hover:bg-amber-600'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      {/* X-axis date label: day number only on mobile, day/month on tablet & desktop */}
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 sm:mt-2 font-mono tabular-nums leading-none text-center truncate w-full select-none">
                        <span className="sm:hidden">{dayOfMonth}</span>
                        <span className="hidden sm:inline">{day.label}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status de Prazos & Fila */}
          <div className="pt-3.5 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
              <span className="text-slate-500 text-[11px] sm:text-xs">Lendo agora:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs sm:text-sm">
                {stats.currentlyReadingCount} livros
              </span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
              <span className="text-slate-500 text-[11px] sm:text-xs">Na fila de espera:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs sm:text-sm">
                {stats.toReadCount} livros
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
