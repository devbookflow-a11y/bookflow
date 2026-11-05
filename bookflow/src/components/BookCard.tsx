import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Bookmark,
  Play,
  Edit,
  Trash2,
  Plus,
  Star,
  Quote,
  Check,
} from 'lucide-react';
import { Book, BookStatus } from '../types/book';
import { useBooks } from '../context/BookContext';
import { formatDateBr } from '../utils/dateUtils';
import { calculateReadingProjection } from '../utils/readingCalculations';

interface BookCardProps {
  book: Book;
  onOpenDetail?: (book: Book) => void;
  isSelected?: boolean;
  onToggleSelect?: (bookId: string) => void;
}

const STATUS_STYLES: Record<
  BookStatus,
  {
    label: string;
    cardBorder: string;
    cardBg: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    leftStripe: string;
  }
> = {
  reading: {
    label: 'Lendo Atualmente',
    cardBorder: 'border-emerald-300/80 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-700',
    cardBg: 'bg-gradient-to-br from-emerald-500/[0.05] via-white to-white dark:from-emerald-950/25 dark:via-slate-900 dark:to-slate-900',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/70',
    leftStripe: 'border-l-4 border-l-emerald-500',
  },
  to_read: {
    label: 'Pretendo Ler',
    cardBorder: 'border-sky-300/80 dark:border-sky-800/70 hover:border-sky-400 dark:hover:border-sky-700',
    cardBg: 'bg-gradient-to-br from-sky-500/[0.05] via-white to-white dark:from-sky-950/25 dark:via-slate-900 dark:to-slate-900',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/70',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-800/70',
    leftStripe: 'border-l-4 border-l-sky-500',
  },
  completed: {
    label: 'Já Lido',
    cardBorder: 'border-purple-300/80 dark:border-purple-800/70 hover:border-purple-400 dark:hover:border-purple-700',
    cardBg: 'bg-gradient-to-br from-purple-500/[0.04] via-white to-white dark:from-purple-950/25 dark:via-slate-900 dark:to-slate-900',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/70',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800/70',
    leftStripe: 'border-l-4 border-l-purple-500',
  },
  none: {
    label: 'Catálogo Geral',
    cardBorder: 'border-slate-300/80 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600',
    cardBg: 'bg-white dark:bg-slate-900',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    leftStripe: 'border-l-4 border-l-slate-400 dark:border-l-slate-600',
  },
};

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onOpenDetail,
  isSelected = false,
  onToggleSelect,
}) => {
  const {
    changeBookStatus,
    openEditBookModal,
    deleteBook,
    requestDeleteBook,
    openLogModal,
    setActiveBookId,
    setCurrentTab,
  } = useBooks();

  const [menuOpen, setMenuOpen] = useState(false);

  const projection = calculateReadingProjection(book);
  const statusStyle = STATUS_STYLES[book.status] || STATUS_STYLES.to_read;

  const handleStartReading = () => {
    changeBookStatus(book.id, 'reading');
    setActiveBookId(book.id);
    setCurrentTab('reading');
    setMenuOpen(false);
  };

  const handleComplete = () => {
    changeBookStatus(book.id, 'completed');
    setMenuOpen(false);
  };

  const handleMoveToWishlist = () => {
    changeBookStatus(book.id, 'to_read');
    setMenuOpen(false);
  };

  const handleMoveToCatalog = () => {
    changeBookStatus(book.id, 'none');
    setMenuOpen(false);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    requestDeleteBook(book);
    setMenuOpen(false);
  };

  const handleEdit = () => {
    openEditBookModal(book);
    setMenuOpen(false);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all shadow-xs hover:shadow-sm ${statusStyle.cardBorder} ${statusStyle.cardBg} ${statusStyle.leftStripe} ${
        isSelected
          ? 'ring-2 ring-amber-500/80 border-amber-500 dark:border-amber-400 shadow-md scale-[1.01]'
          : ''
      }`}
    >
      {/* Top row: Checkbox, Status Badge, Category, Deadline, and Menu */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Checkbox Discreta de Seleção para Ações em Lote */}
            {onToggleSelect && (
              <label
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center p-0.5 -ml-1 cursor-pointer shrink-0 group/chk"
                title={isSelected ? 'Desmarcar livro' : 'Selecionar livro para ação em lote'}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(book.id)}
                  className="sr-only"
                  aria-label={`Selecionar ${book.title}`}
                />
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                      : 'border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 group-hover/chk:border-amber-500 opacity-60 group-hover:opacity-100'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </label>
            )}

            {/* Tag visual de Status com diferenciação de cores */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${statusStyle.badgeBg} ${statusStyle.badgeText} ${statusStyle.badgeBorder}`}
              title={`Status atual: ${statusStyle.label}`}
            >
              {book.status === 'reading' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
              {book.status === 'to_read' && (
                <Bookmark className="w-2.5 h-2.5 text-sky-500" />
              )}
              {book.status === 'completed' && (
                <CheckCircle2 className="w-2.5 h-2.5 text-purple-500" />
              )}
              {(!book.status || book.status === 'none') && (
                <BookOpen className="w-2.5 h-2.5 text-slate-400" />
              )}
              <span>{statusStyle.label}</span>
            </span>

            {/* Categoria */}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              {book.category}
            </span>

            {book.targetDeadline && (
              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 truncate">
                <span>·</span>
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatDateBr(book.targetDeadline)}
              </span>
            )}
          </div>

          {/* Action buttons: Direct Delete + Context Menu */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={handleDelete}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Excluir Livro"
              aria-label="Excluir Livro"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Mais opções do livro"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-7 z-30 w-48 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
                  {/* Status Switcher Section */}
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Alterar Status
                  </div>
                  {book.status !== 'reading' && (
                    <button
                      onClick={handleStartReading}
                      className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Lendo Atualmente</span>
                    </button>
                  )}
                  {book.status === 'reading' && (
                    <>
                      <button
                        onClick={() => {
                          setActiveBookId(book.id);
                          setCurrentTab('reading');
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Ver no Monitor</span>
                      </button>
                      <button
                        onClick={() => {
                          openLogModal(book);
                          setMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Registrar Páginas</span>
                      </button>
                    </>
                  )}
                  {book.status !== 'to_read' && (
                    <button
                      onClick={handleMoveToWishlist}
                      className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-sky-500" />
                      <span>Mover p/ Pretendo Ler</span>
                    </button>
                  )}
                  {book.status !== 'completed' && (
                    <button
                      onClick={handleComplete}
                      className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                      <span>Marcar como Já Lido</span>
                    </button>
                  )}
                  {book.status && book.status !== 'none' && (
                    <button
                      onClick={handleMoveToCatalog}
                      className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mover para Catálogo Geral</span>
                    </button>
                  )}
                  
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                  <button
                    onClick={handleEdit}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                    <span>Editar Livro</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-1.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Livro</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

        {/* Title and Author */}
        <h3
          onClick={() => onOpenDetail && onOpenDetail(book)}
          className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors tracking-tight"
        >
          {book.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          por {book.author}
        </p>

        {/* Unboxed Tags & Notes Badge */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-2.5">
          {book.tags && book.tags.length > 0 && (
            <>
              {book.tags.slice(0, 3).map((tag, idx) => (
                <React.Fragment key={tag}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    #{tag}
                  </span>
                </React.Fragment>
              ))}
              {book.tags.length > 3 && (
                <span className="text-slate-400">+{book.tags.length - 3}</span>
              )}
            </>
          )}

          {book.notes && book.notes.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail && onOpenDetail(book);
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold cursor-pointer hover:bg-amber-100 transition-colors ml-auto"
              title={`${book.notes.length} anotações no diário`}
            >
              <Quote className="w-2.5 h-2.5 text-amber-500" />
              <span>{book.notes.length}</span>
            </span>
          )}
        </div>

        {/* Rating for completed books */}
        {book.status === 'completed' && book.rating && (
          <div className="flex items-center gap-1 mt-2.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= book.rating!
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Progress & Action Section */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        {book.status === 'reading' ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                {book.currentPage} / {book.totalPages} págs
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {projection.percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${projection.percentage}%` }}
              />
            </div>
            {projection.isDelayed && (
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>Atraso: +{projection.delayDays}d</span>
                <span>Meta: {projection.requiredPaceForDeadline} p/d</span>
              </div>
            )}
          </div>
        ) : book.status === 'to_read' ? (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums font-mono">{book.totalPages} páginas</span>
            <button
              onClick={handleStartReading}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 p-1"
            >
              <Play className="w-3 h-3 fill-amber-500" />
              <span>Iniciar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums font-mono">{book.totalPages} páginas</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Lido em {formatDateBr(book.completedDate)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
