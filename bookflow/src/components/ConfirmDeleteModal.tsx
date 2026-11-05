import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, BookOpen, Clock } from 'lucide-react';
import { useBooks } from '../context/BookContext';

export const ConfirmDeleteModal: React.FC = () => {
  const { bookToDelete, cancelDeleteBook, confirmDeleteBook } = useBooks();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bookToDelete) {
        cancelDeleteBook();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bookToDelete, cancelDeleteBook]);

  if (!bookToDelete) return null;

  const sessionCount = bookToDelete.sessions?.length || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={cancelDeleteBook}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 id="confirm-delete-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Excluir Livro
            </h2>
          </div>
          <button
            onClick={cancelDeleteBook}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cancelar e fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Tem certeza de que deseja excluir este livro da sua estante?
          </p>

          {/* Book Information Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {bookToDelete.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  por <span className="font-semibold text-slate-700 dark:text-slate-300">{bookToDelete.author}</span>
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                {bookToDelete.status === 'reading'
                  ? 'Lendo'
                  : bookToDelete.status === 'to_read'
                  ? 'Pretendo Ler'
                  : 'Já Lido'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                {bookToDelete.currentPage} / {bookToDelete.totalPages} págs
              </span>
              <span>·</span>
              <span className="truncate">{bookToDelete.category}</span>
              {sessionCount > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {sessionCount} {sessionCount === 1 ? 'sessão' : 'sessões'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Danger Warning Box */}
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Esta ação é permanente e irreversível. O livro e todo o histórico de leituras registrado serão removidos definitivamente.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={cancelDeleteBook}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDeleteBook}
            className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sim, Excluir Livro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
