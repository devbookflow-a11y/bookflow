import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Flame,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Edit3,
  BookmarkCheck,
  Check,
  HelpCircle,
  Sparkles,
  Info,
  Trash2,
  ArrowUpDown,
  Quote,
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { calculateReadingProjection } from '../utils/readingCalculations';
import { formatDateBr, formatDateLong, getTodayString } from '../utils/dateUtils';

export const ReadingMonitor: React.FC = () => {
  const {
    readingBooks,
    activeBook,
    setActiveBookId,
    logReadingSession,
    changeBookStatus,
    openEditBookModal,
    deleteBook,
    requestDeleteBook,
    openLogModal,
    openAddBookModal,
    openDetailModal,
    setCurrentTab,
    openEditSessionModal,
  } = useBooks();

  const [quickPageInput, setQuickPageInput] = useState<string>('');
  const [quickLogSuccess, setQuickLogSuccess] = useState<string | null>(null);



  // If no books currently being read
  if (readingBooks.length === 0 || !activeBook) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Nenhum livro em andamento
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Você não está lendo nenhum livro no momento. Inicie uma leitura da sua lista de desejos ou adicione uma nova obra para começar a monitorar o seu ritmo!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setCurrentTab('to_read')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Ver Lista de Desejos
          </button>
          <button
            onClick={() => openAddBookModal('reading')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-amber-600 dark:hover:bg-amber-500 text-sm font-semibold transition-colors shadow-sm"
          >
            Cadastrar Novo Livro
          </button>
        </div>
      </div>
    );
  }

  // Calculate dynamic metrics & projections
  const projection = calculateReadingProjection(activeBook);

  // Livros ativos em ordem alfabética (A-Z) para o Dropdown Seletor
  const sortedReadingBooks = [...readingBooks].sort((a, b) =>
    a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })
  );

  const handleQuickAdd = (pagesToAdd: number) => {
    const newPage = Math.min(activeBook.totalPages, activeBook.currentPage + pagesToAdd);
    logReadingSession(activeBook.id, pagesToAdd, newPage, `Leitura diária (+${pagesToAdd} págs)`);
    setQuickLogSuccess(`+${pagesToAdd} páginas registradas!`);
    setTimeout(() => setQuickLogSuccess(null), 2500);
  };

  const handleDirectPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(quickPageInput, 10);
    if (isNaN(targetPage) || targetPage < 0) return;
    const clampedPage = Math.min(activeBook.totalPages, targetPage);
    const delta = Math.max(0, clampedPage - activeBook.currentPage);
    logReadingSession(activeBook.id, delta, clampedPage, `Atualização para página ${clampedPage}`);
    setQuickPageInput('');
    setQuickLogSuccess(`Página atualizada para ${clampedPage}!`);
    setTimeout(() => setQuickLogSuccess(null), 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Card Seletor de Leitura Ativa com Dropdown (Elemento Selecionado) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden sm:inline">
              Lendo agora:
            </span>
          </div>

          {/* O Dropdown Seletor Rápido */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="active-book-select" className="sr-only">
              Selecionar livro em leitura
            </label>
            <select
              id="active-book-select"
              value={activeBook.id}
              onChange={(e) => setActiveBookId(e.target.value)}
              disabled={readingBooks.length <= 1}
              className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                readingBooks.length > 1
                  ? 'bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs'
                  : 'bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800 cursor-default'
              }`}
              aria-label="Selecionar livro em leitura ativo"
              title={
                readingBooks.length <= 1
                  ? 'Apenas 1 livro com leitura ativa no momento'
                  : 'Selecione para alternar entre as leituras ativas'
              }
            >
              {sortedReadingBooks.map((book) => {
                const bProj = calculateReadingProjection(book);
                return (
                  <option
                    key={book.id}
                    value={book.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1"
                  >
                    {book.title} ({bProj.percentage}%) {book.author ? `— ${book.author}` : ''}
                  </option>
                );
              })}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0 hidden md:inline">
            {readingBooks.length} {readingBooks.length === 1 ? 'leitura ativa' : 'leituras ativas'}
          </span>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentTab('to_read')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-1.5"
            title="Iniciar livro da lista de desejos"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Iniciar outro</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('library')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            title="Ver todos os livros na biblioteca"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Biblioteca</span>
          </button>
        </div>
      </div>

      {/* Flagship Active Book Card */}
      <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative z-10">
          {/* Visual Book Spine & Cover */}
          <div className="w-28 h-40 sm:w-36 sm:h-52 shrink-0 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400/90 font-medium tracking-wider uppercase">
                Livro Ativo
              </span>
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold line-clamp-3 leading-snug">
                {activeBook.title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {activeBook.author}
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
              <span className="tabular-nums font-mono">{activeBook.currentPage} / {activeBook.totalPages}</span>
              <span className="tabular-nums font-bold text-amber-400">{projection.percentage}%</span>
            </div>
          </div>

          {/* Book Information and Main Progress */}
          <div className="flex-1 min-w-0 w-full">
            {/* Header info with clean unboxed metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeBook.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>Iniciado em {formatDateBr(activeBook.startDate)}</span>
                {activeBook.targetDeadline && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Prazo: {formatDateBr(activeBook.targetDeadline)}
                    </span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openDetailModal(activeBook)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1"
                  title="Abrir Diário de Leitura e Notas"
                >
                  <Quote className="w-3.5 h-3.5 text-amber-500" />
                  <span>Diário ({activeBook.notes?.length || 0})</span>
                </button>
                <button
                  onClick={() => openEditBookModal(activeBook)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => requestDeleteBook(activeBook)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                  title="Excluir este livro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
                <button
                  onClick={() => changeBookStatus(activeBook.id, 'completed')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Concluir</span>
                </button>
              </div>
            </div>

            {/* Title & Author */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 text-wrap-balance">
              {activeBook.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
              por <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBook.author}</span>
            </p>

            {/* Free Tags as clean unboxed text list */}
            {activeBook.tags && activeBook.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Etiquetas:</span>
                {activeBook.tags.map((tag, idx) => (
                  <React.Fragment key={tag}>
                    {idx > 0 && <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>}
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      #{tag}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Visual Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Progresso da Leitura
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {activeBook.currentPage} de {activeBook.totalPages} páginas
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {projection.percentage}%
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${projection.percentage}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                <span>{projection.pagesRead} lidas</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {projection.pagesRemaining} páginas restantes
                </span>
              </div>
            </div>

            {/* Quick Log Reading Form & Shortcut Buttons */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Registro Rápido de Leitura Diária
                  </span>
                </div>
                <button
                  onClick={() => openLogModal(activeBook)}
                  className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  Registro detalhado com anotações <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
                  Somar hoje:
                </span>
                {[5, 10, 20, 30, 50].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleQuickAdd(num)}
                    disabled={activeBook.currentPage >= activeBook.totalPages}
                    className="min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    +{num} págs
                  </button>
                ))}

                {/* Direct Page Input */}
                <form onSubmit={handleDirectPageSubmit} className="flex items-center gap-1.5 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={activeBook.totalPages}
                      value={quickPageInput}
                      onChange={(e) => setQuickPageInput(e.target.value)}
                      placeholder={`Ir pág (${activeBook.currentPage})`}
                      className="w-32 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                  >
                    Salvar
                  </button>
                </form>
              </div>

              {quickLogSuccess && (
                <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  {quickLogSuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SMART DELAY ALERT (ALERTA INTELIGENTE DE ATRASO) & PROJEÇÃO DINÂMICA */}
      {projection.isDelayed ? (
        /* Delayed Warning Card */
        <div className="p-5 md:p-6 rounded-2xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                    Alerta Inteligente de Atraso
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-200/70 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 tabular-nums">
                    +{projection.delayDays} {projection.delayDays === 1 ? 'dia de atraso' : 'dias de atraso'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                  No ritmo atual de <strong className="font-semibold tabular-nums">{projection.currentPace} págs/dia</strong>, a conclusão estimada é para <strong className="font-semibold">{formatDateBr(projection.estimatedCompletionDate)}</strong>, ultrapassando seu prazo estipulado de <strong className="font-semibold">{formatDateBr(activeBook.targetDeadline)}</strong>.
                </p>
              </div>
            </div>

            {/* Recalculated Rhythm Box */}
            <div className="w-full sm:w-auto shrink-0 p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900 text-center sm:text-right">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block uppercase tracking-wider">
                Novo Ritmo Necessário
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                {projection.requiredPaceForDeadline}{' '}
                <span className="text-xs font-medium text-slate-500">págs/dia</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                para cumprir a meta até {formatDateBr(activeBook.targetDeadline)}
              </span>
            </div>
          </div>
        </div>
      ) : activeBook.targetDeadline ? (
        /* On Track Success Banner */
        <div className="p-5 md:p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    Leitura Rigorosamente no Prazo
                  </h3>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Ritmo Saudável
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                  No ritmo atual de <strong className="font-semibold tabular-nums">{projection.currentPace} págs/dia</strong>, você concluirá esta leitura em <strong className="font-semibold">{formatDateBr(projection.estimatedCompletionDate)}</strong> ({projection.daysNeededAtPace} dias), antes do prazo final ({formatDateBr(activeBook.targetDeadline)}).
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0 p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-900 text-center sm:text-right">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">
                Ritmo Mínimo Desejado
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {projection.requiredPaceForDeadline}{' '}
                <span className="text-xs font-medium text-slate-500">págs/dia</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                mantém a meta no prazo
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* No Deadline Info */
        <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-slate-400" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Nenhum prazo final estipulado para este livro. Estimativa de término:{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatDateBr(projection.estimatedCompletionDate)}</strong>{' '}
              ({projection.daysNeededAtPace} dias no ritmo de {projection.currentPace} págs/dia).
            </p>
          </div>
          <button
            onClick={() => openEditBookModal(activeBook)}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
          >
            Definir Prazo
          </button>
        </div>
      )}

      {/* 3 Metric Cards: Ritmo Atual, Projeção de Conclusão, Dias Ativos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Ritmo Atual */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Ritmo Médio Atual</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {projection.currentPace}
            </span>
            <span className="text-xs font-medium text-slate-500">páginas / dia</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Baseado nas sessões registradas
          </span>
        </div>

        {/* Card 2: Conclusão Estimada */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Data Estimada</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {formatDateBr(projection.estimatedCompletionDate)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Em aproximadamente {projection.daysNeededAtPace} dias
          </span>
        </div>

        {/* Card 3: Páginas Restantes & Dias Ativos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Faltam para Concluir</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {projection.pagesRemaining}
            </span>
            <span className="text-xs font-medium text-slate-500">páginas</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {projection.daysActive} dia{projection.daysActive > 1 ? 's' : ''} em leitura ativa
          </span>
        </div>
      </div>

      {/* Reading Sessions History for Active Book */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Histórico Completo de Sessões de Leitura
              </h3>
              {activeBook.sessions && activeBook.sessions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                  {activeBook.sessions.length} {activeBook.sessions.length === 1 ? 'registro' : 'registros'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeBook.sessions && activeBook.sessions.length > 0
                ? `Exibindo todos os registros de leitura salvos deste livro · Total acumulado de ${activeBook.sessions.reduce(
                    (acc, s) => acc + (s.pagesRead || 0),
                    0
                  )} páginas`
                : 'Nenhum registro de leitura gravado ainda'}
            </p>
          </div>
          <button
            onClick={() => openLogModal(activeBook)}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>Adicionar Sessão</span>
          </button>
        </div>

        {activeBook.sessions && activeBook.sessions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[500px] overflow-y-auto pr-1">
            {activeBook.sessions.map((session, index) => (
              <div
                key={session.id}
                className="py-3 flex items-start sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-1 rounded-lg transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-slate-400 dark:text-slate-500 font-mono tabular-nums shrink-0">
                    {formatDateBr(session.date)}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      +{session.pagesRead} páginas
                    </span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">·</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      até a página {session.endingPage}
                    </span>
                    {session.notes && (
                      <span className="text-slate-600 dark:text-slate-300 italic text-[11px] sm:ml-2 line-clamp-1">
                        "{session.notes}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditSessionModal(activeBook, session)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Editar ou corrigir sessão de leitura"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold hidden sm:inline">Editar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
            Nenhuma sessão detalhada registrada ainda. Utilize os botões de soma rápida acima para começar!
          </p>
        )}
      </div>
    </div>
  );
};
