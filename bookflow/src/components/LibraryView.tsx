import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  Bookmark,
  Play,
  X,
  ArrowUpDown,
  Tag,
  FileSpreadsheet,
  Download,
  Upload,
  Layers,
  Trash2,
  Quote,
  Check,
  CheckSquare,
} from 'lucide-react';
import { Book, BookCategory, BookStatus } from '../types/book';
import { useBooks } from '../context/BookContext';
import { BookCard } from './BookCard';
import { formatDateBr } from '../utils/dateUtils';
import { calculateReadingProjection } from '../utils/readingCalculations';
import { downloadCsvTemplate } from '../utils/csvImport';

export type SortOption =
  | 'recent'
  | 'title_asc'
  | 'title_desc'
  | 'pages_asc'
  | 'pages_desc'
  | 'progress'
  | 'deadline';

export const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Ordem de cadastro (Padrão)',
  title_asc: 'Alfabética (Título: A - Z)',
  title_desc: 'Alfabética (Título: Z - A)',
  pages_asc: 'Número de Páginas (Menor para Maior)',
  pages_desc: 'Número de Páginas (Maior para Menor)',
  progress: 'Progresso de Leitura (%)',
  deadline: 'Prazo de Meta mais Próximo',
};

interface LibraryViewProps {
  initialStatusFilter?: BookStatus | 'all';
}

export const LibraryView: React.FC<LibraryViewProps> = ({ initialStatusFilter = 'all' }) => {
  const {
    books,
    openAddBookModal,
    openDetailModal,
    openCsvModal,
    categories,
    openCategoryModal,
    changeBookStatus,
    changeBooksStatusBulk,
    openEditBookModal,
    deleteBook,
    deleteBooksBulk,
    requestDeleteBook,
    setActiveBookId,
    setCurrentTab,
  } = useBooks();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookStatus | 'all'>(initialStatusFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [batchToast, setBatchToast] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(initialStatusFilter);
  }, [initialStatusFilter]);

  const handleToggleSelectBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  // Collect all unique tags across books
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    books.forEach((b) => {
      if (b.tags) {
        b.tags.forEach((t) => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet).sort();
  }, [books]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Status filter
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'none') {
            if (book.status && book.status !== 'none') return false;
          } else if (book.status !== selectedStatus) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && book.category !== selectedCategory) {
          return false;
        }

        // Tag filter
        if (selectedTag !== 'all' && (!book.tags || !book.tags.includes(selectedTag))) {
          return false;
        }

        // Search query (title or author)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = book.title.toLowerCase().includes(q);
          const matchAuthor = book.author.toLowerCase().includes(q);
          const matchTags = book.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchAuthor && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title_asc') {
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        }
        if (sortBy === 'title_desc') {
          return b.title.localeCompare(a.title, 'pt-BR', { sensitivity: 'base' });
        }
        if (sortBy === 'pages_asc') {
          return a.totalPages - b.totalPages;
        }
        if (sortBy === 'pages_desc') {
          return b.totalPages - a.totalPages;
        }
        if (sortBy === 'progress') {
          const progA = a.currentPage / Math.max(1, a.totalPages);
          const progB = b.currentPage / Math.max(1, b.totalPages);
          return progB - progA;
        }
        if (sortBy === 'deadline') {
          if (!a.targetDeadline && !b.targetDeadline) return 0;
          if (!a.targetDeadline) return 1;
          if (!b.targetDeadline) return -1;
          return a.targetDeadline.localeCompare(b.targetDeadline);
        }
        // default 'recent': Ordem de cadastro (Padrão) - mais recentes primeiro
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [books, selectedStatus, selectedCategory, selectedTag, searchQuery, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedTag('all');
    setSortBy('recent');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCategory !== 'all' ||
    selectedTag !== 'all' ||
    sortBy !== 'recent';

  // Bulk actions handlers
  const isAllVisibleSelected =
    filteredBooks.length > 0 && filteredBooks.every((b) => selectedBookIds.includes(b.id));

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      const visibleSet = new Set(filteredBooks.map((b) => b.id));
      setSelectedBookIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const newIds = new Set([...selectedBookIds, ...filteredBooks.map((b) => b.id)]);
      setSelectedBookIds(Array.from(newIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedBookIds([]);
  };

  const handleBatchMove = (targetStatus: BookStatus) => {
    if (selectedBookIds.length === 0) return;
    changeBooksStatusBulk(selectedBookIds, targetStatus);
    const statusLabels: Record<BookStatus, string> = {
      none: 'Catálogo Geral',
      to_read: 'Pretendo Ler',
      reading: 'Lendo Atualmente',
      completed: 'Já Lidos',
    };
    const count = selectedBookIds.length;
    setBatchToast(
      `${count} livro${count > 1 ? 's' : ''} movido${count > 1 ? 's' : ''} para "${statusLabels[targetStatus]}"!`
    );
    setSelectedBookIds([]);
    setTimeout(() => setBatchToast(null), 3500);
  };

  const handleBatchDelete = () => {
    const count = selectedBookIds.length;
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${count} livro${count > 1 ? 's' : ''} permanentemente?`
      )
    ) {
      deleteBooksBulk(selectedBookIds);
      setBatchToast(`${count} livro${count > 1 ? 's' : ''} excluído${count > 1 ? 's' : ''}!`);
      setSelectedBookIds([]);
      setTimeout(() => setBatchToast(null), 3500);
    }
  };

  // Stats for catalog status breakdown
  const stats = useMemo(() => {
    let reading = 0;
    let toRead = 0;
    let completed = 0;
    let generalCatalog = 0;
    books.forEach((b) => {
      if (b.status === 'reading') reading++;
      else if (b.status === 'to_read') toRead++;
      else if (b.status === 'completed') completed++;
      else generalCatalog++;
    });
    return {
      total: books.length,
      reading,
      toRead,
      completed,
      generalCatalog,
    };
  }, [books]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner & Catalog Central Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {initialStatusFilter === 'all'
                ? 'Biblioteca Completa'
                : initialStatusFilter === 'to_read'
                ? 'Pretendo Ler'
                : 'Já Lidos'}
            </h1>
            {initialStatusFilter === 'all' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                Catálogo Central ({stats.total} obras)
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {initialStatusFilter === 'all'
              ? 'Catálogo central unificado contendo todos os seus livros. O status de cada obra governa sua exibição dinâmica no monitor de leitura e estantes específicas.'
              : initialStatusFilter === 'to_read'
              ? 'Sua lista de desejos e próximas leituras planejadas. Ao iniciar uma leitura, ela migra automaticamente para o monitor ativo.'
              : 'Obras concluídas com sucesso. Acompanhe avaliações, resenhas e datas de finalização.'}
          </p>

          {/* Color Legend (Biblioteca Completa) */}
          {initialStatusFilter === 'all' && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Legenda de Cores:
              </span>
              <button
                type="button"
                onClick={() => setSelectedStatus(selectedStatus === 'reading' ? 'all' : 'reading')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatus === 'reading'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100/70'
                }`}
                title="Filtrar por Lendo Atualmente (Destaque Verde)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Lendo Atualmente: Verde</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 font-mono font-bold">
                  {stats.reading}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus(selectedStatus === 'to_read' ? 'all' : 'to_read')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatus === 'to_read'
                    ? 'bg-sky-100 text-sky-900 border-sky-400 font-bold dark:bg-sky-950 dark:text-sky-200'
                    : 'bg-sky-50/80 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 hover:bg-sky-100/70'
                }`}
                title="Filtrar por Pretendo Ler (Destaque Azul)"
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="font-semibold">Pretendo Ler: Azul</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-200/60 dark:bg-sky-900/60 font-mono font-bold">
                  {stats.toRead}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus(selectedStatus === 'completed' ? 'all' : 'completed')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedStatus === 'completed'
                    ? 'bg-purple-100 text-purple-900 border-purple-400 font-bold dark:bg-purple-950 dark:text-purple-200'
                    : 'bg-purple-50/80 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 hover:bg-purple-100/70'
                }`}
                title="Filtrar por Já Lidos (Destaque Roxo)"
              >
                <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold">Já Lidos: Roxo</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200/60 dark:bg-purple-900/60 font-mono font-bold">
                  {stats.completed}
                </span>
              </button>

              {stats.generalCatalog > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStatus(selectedStatus === 'none' ? 'all' : 'none')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedStatus === 'none'
                      ? 'bg-slate-200 text-slate-900 border-slate-400 font-bold dark:bg-slate-700 dark:text-white'
                      : 'bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200/70'
                  }`}
                  title="Filtrar por Obras do Catálogo Geral (Sem Estante Definida)"
                >
                  <Bookmark className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold">Catálogo Geral</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-mono font-bold">
                    {stats.generalCatalog}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => openAddBookModal()}
          className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs md:text-sm shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Livro</span>
        </button>
      </div>

      {/* Top Search, Status Tabs and View Mode Controls */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Search Bar + Sort + View Mode */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, autor ou etiqueta..."
              className="w-full pl-10 pr-9 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end shrink-0">
            {/* Sort Dropdown Selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex-1 sm:flex-initial">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <label htmlFor="sort-books-select" className="text-slate-400 dark:text-slate-500 font-medium shrink-0 hidden md:inline text-[11px]">
                Ordenar:
              </label>
              <select
                id="sort-books-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Opções de ordenação de livros"
                className="bg-transparent focus:outline-none cursor-pointer pr-1 font-semibold text-slate-800 dark:text-slate-200 text-xs w-full sm:w-auto"
              >
                <option value="recent" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Ordem de cadastro (Padrão)
                </option>
                <option value="title_asc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Alfabética (Título: A - Z)
                </option>
                <option value="title_desc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Alfabética (Título: Z - A)
                </option>
                <option value="pages_asc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Número de Páginas (Menor para Maior)
                </option>
                <option value="pages_desc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Número de Páginas (Maior para Menor)
                </option>
                <option value="progress" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Progresso de Leitura (%)
                </option>
                <option value="deadline" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Prazo de Meta mais Próximo
                </option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Visualização em Tabela"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'Todos os Livros' },
            { id: 'reading', label: 'Lendo Atualmente' },
            { id: 'to_read', label: 'Pretendo Ler' },
            { id: 'completed', label: 'Já Lidos' },
            ...(stats.generalCatalog > 0
              ? [{ id: 'none', label: `Catálogo Geral (${stats.generalCatalog})` }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedStatus === tab.id
                  ? 'bg-slate-900 text-white dark:bg-amber-600 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Combined Category & Tags Dropdowns / Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar por:</span>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer text-xs"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openCategoryModal}
              title="Gerenciar / Criar Categorias"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:border-amber-500/50 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">Todas as Etiquetas</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold flex items-center gap-1 ml-auto"
            >
              <X className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Bulk CSV Import Banner for 'Pretendo Ler' tab */}
      {selectedStatus === 'to_read' && (
        <div className="p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Importação em Massa via Planilha (CSV)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Pretendo Ler
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed max-w-xl">
                Tem uma lista de leituras pendentes no Excel ou Google Planilhas? Baixe o nosso modelo padronizado e importe todos os livros de uma vez com verificação inteligente de duplicatas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Baixar Modelo de Planilha</span>
            </button>
            <button
              type="button"
              onClick={openCsvModal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Planilha (CSV/Excel)</span>
            </button>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Mostrando <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{filteredBooks.length}</strong> de{' '}
            <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{books.length}</strong> livro{books.length !== 1 ? 's' : ''}
          </span>
          {sortBy !== 'recent' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium text-[11px]">
              <ArrowUpDown className="w-3 h-3 text-amber-500" />
              <span>{SORT_LABELS[sortBy]}</span>
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className="hover:text-amber-900 dark:hover:text-white ml-0.5 p-0.5 rounded-full hover:bg-amber-500/20"
                title="Redefinir para Ordem de cadastro (Padrão)"
                aria-label="Redefinir para Ordem de cadastro"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {filteredBooks.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAllVisible}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                isAllVisibleSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs font-bold'
                  : selectedBookIds.length > 0
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
              title={isAllVisibleSelected ? 'Desmarcar todos os visíveis' : 'Selecionar todos os visíveis'}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>
                {isAllVisibleSelected
                  ? `Desmarcar todos (${filteredBooks.length})`
                  : selectedBookIds.length > 0
                  ? `Selecionar todos (${selectedBookIds.length} selecionado${selectedBookIds.length > 1 ? 's' : ''})`
                  : 'Selecionar em lote'}
              </span>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedStatus !== 'to_read' && (
            <button
              type="button"
              onClick={openCsvModal}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Importar CSV</span>
            </button>
          )}

          <button
            onClick={() => openAddBookModal(selectedStatus !== 'all' ? selectedStatus : undefined)}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar à lista</span>
          </button>
        </div>
      </div>

      {/* Books Content: Grid vs Table */}
      {filteredBooks.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onOpenDetail={openDetailModal}
                isSelected={selectedBookIds.includes(book.id)}
                onToggleSelect={handleToggleSelectBook}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold select-none">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4"
                        title={isAllVisibleSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                        aria-label="Selecionar todos os livros visíveis"
                      />
                    </th>
                    <th
                      onClick={() => setSortBy(sortBy === 'title_asc' ? 'title_desc' : 'title_asc')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
                      title="Clique para ordenar por Título (A-Z / Z-A)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Título & Autor</span>
                        {sortBy === 'title_asc' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">▲</span>
                        ) : sortBy === 'title_desc' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">▼</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Status</th>
                    <th
                      onClick={() => setSortBy(sortBy === 'pages_asc' ? 'pages_desc' : 'pages_asc')}
                      className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
                      title="Clique para ordenar por Páginas (Menor / Maior)"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Progresso / Páginas</span>
                        {sortBy === 'pages_asc' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">▲</span>
                        ) : sortBy === 'pages_desc' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">▼</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => setSortBy('deadline')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
                      title="Clique para ordenar por Prazo"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Prazo</span>
                        {sortBy === 'deadline' && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredBooks.map((book) => {
                    const proj = calculateReadingProjection(book);
                    const isSelected = selectedBookIds.includes(book.id);
                    return (
                      <tr
                        key={book.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-amber-500/10 dark:bg-amber-500/15' : ''
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectBook(book.id)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4"
                            aria-label={`Selecionar livro ${book.title}`}
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              onClick={() => openDetailModal(book)}
                              className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 line-clamp-1"
                            >
                              {book.title}
                            </div>
                            {book.notes && book.notes.length > 0 && (
                              <span
                                onClick={() => openDetailModal(book)}
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 text-[9px] rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono font-bold cursor-pointer"
                                title={`${book.notes.length} anotações`}
                              >
                                <Quote className="w-2.5 h-2.5 text-amber-500" />
                                {book.notes.length}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] truncate">{book.author}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {book.category}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {book.status === 'reading' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Lendo Atualmente
                            </span>
                          ) : book.status === 'to_read' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                              Pretendo Ler
                            </span>
                          ) : book.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              Já Lido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <Bookmark className="w-2.5 h-2.5 text-slate-400" />
                              Catálogo Geral
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="tabular-nums font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {book.currentPage} / {book.totalPages}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-1.5 tabular-nums">
                            ({proj.percentage}%)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {formatDateBr(book.targetDeadline)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {(book.status === 'to_read' || !book.status || book.status === 'none') && (
                              <button
                                onClick={() => {
                                  changeBookStatus(book.id, 'reading');
                                  setActiveBookId(book.id);
                                  setCurrentTab('reading');
                                }}
                                className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-semibold text-[11px]"
                              >
                                Iniciar
                              </button>
                            )}
                            {book.status === 'reading' && (
                              <button
                                onClick={() => {
                                  setActiveBookId(book.id);
                                  setCurrentTab('reading');
                                }}
                                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-[11px]"
                              >
                                Monitor
                              </button>
                            )}
                            {book.status !== 'completed' && (
                              <button
                                onClick={() => changeBookStatus(book.id, 'completed')}
                                className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-[11px]"
                              >
                                Concluir
                              </button>
                            )}
                            <button
                              onClick={() => openEditBookModal(book)}
                              className="px-2 py-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => requestDeleteBook(book)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] transition-colors"
                              title={`Excluir "${book.title}"`}
                              aria-label={`Excluir livro ${book.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            Nenhum livro encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Não encontramos livros correspondentes aos filtros selecionados. Tente ajustar os termos de busca ou cadastrar um novo exemplar.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Limpar Filtros
              </button>
            )}
            <button
              onClick={() => openAddBookModal(selectedStatus !== 'all' ? selectedStatus : undefined)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-amber-600 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-500"
            >
              Adicionar Livro
            </button>
            {selectedStatus === 'to_read' && (
              <button
                onClick={openCsvModal}
                className="px-3.5 py-2 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar Planilha (CSV)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Batch Action Bar */}
      {selectedBookIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 mx-auto max-w-3xl z-40 px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs">
                  {selectedBookIds.length}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  {selectedBookIds.length === 1 ? 'livro selecionado' : 'livros selecionados'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Desmarcar todos os livros selecionados"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
              <span className="text-[11px] text-slate-400 mr-1 hidden lg:inline">Mover para:</span>
              <button
                type="button"
                onClick={() => handleBatchMove('none')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
                title="Mover para Catálogo Geral (sem estante específica)"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                <span>Geral</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchMove('to_read')}
                className="px-2.5 py-1.5 rounded-xl bg-sky-950/70 hover:bg-sky-900/80 text-sky-200 text-xs font-semibold flex items-center gap-1.5 border border-sky-700/60 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
                title="Mover para Pretendo Ler"
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Pretendo Ler</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchMove('reading')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 border border-emerald-700/60 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
                title="Mover para Lendo Atualmente"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Lendo</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchMove('completed')}
                className="px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 text-xs font-semibold flex items-center gap-1.5 border border-purple-700/60 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
                title="Mover para Já Lidos"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Já Lidos</span>
              </button>
              <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />
              <button
                type="button"
                onClick={handleBatchDelete}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-800/60 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
                title="Excluir selecionados permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Toast Feedback */}
      {batchToast && (
        <div className="fixed top-20 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500/50">
            <Check className="w-4 h-4 text-emerald-100" />
            <span>{batchToast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

