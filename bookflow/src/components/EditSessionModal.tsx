/**
 * @file EditSessionModal.tsx
 * @description Modal elegante para edição e exclusão de sessões passadas de leitura com recalculo em tempo real.
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Trash2, Check, AlertCircle, FileText } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { formatDateBr } from '../utils/dateUtils';

export const EditSessionModal: React.FC = () => {
  const { sessionToEdit, closeEditSessionModal, updateReadingSession, deleteReadingSession } = useBooks();

  const [date, setDate] = useState('');
  const [pagesRead, setPagesRead] = useState<number>(1);
  const [endingPage, setEndingPage] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sessionToEdit) {
      setDate(sessionToEdit.session.date || '');
      setPagesRead(sessionToEdit.session.pagesRead || 1);
      setEndingPage(sessionToEdit.session.endingPage || 1);
      setNotes(sessionToEdit.session.notes || '');
      setShowDeleteConfirm(false);
      setErrorMsg(null);
    }
  }, [sessionToEdit]);

  if (!sessionToEdit) return null;

  const { book, session } = sessionToEdit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!date.trim()) {
      setErrorMsg('Por favor, informe a data da sessão.');
      return;
    }

    if (pagesRead < 1) {
      setErrorMsg('A quantidade de páginas lidas deve ser no mínimo 1.');
      return;
    }

    if (endingPage < 0 || endingPage > book.totalPages) {
      setErrorMsg(`A página final deve estar entre 0 e ${book.totalPages}.`);
      return;
    }

    updateReadingSession(book.id, session.id, {
      date: date.trim(),
      pagesRead,
      endingPage,
      notes: notes.trim(),
    });

    closeEditSessionModal();
  };

  const handleDelete = () => {
    deleteReadingSession(book.id, session.id);
    closeEditSessionModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={closeEditSessionModal}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Editar Registro de Leitura
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
              {book.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeEditSessionModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Data da sessão */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Data da Sessão
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Páginas lidas nesta sessão */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Páginas Lidas
              </label>
              <input
                type="number"
                min="1"
                max={book.totalPages}
                required
                value={pagesRead}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setPagesRead(val);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Página final atingida */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Página Final (Marcador)
              </label>
              <input
                type="number"
                min="0"
                max={book.totalPages}
                required
                value={endingPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setEndingPage(val);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <span className="text-[11px] text-slate-400 block -mt-1">
            Total do livro: <strong className="text-slate-600 dark:text-slate-300">{book.totalPages} páginas</strong>.
          </span>

          {/* Anotação / Observação da sessão */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Observação da Sessão (opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Capítulo 4 concluído, ritmo excelente"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Ações principais */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                >
                  Confirmar Exclusão
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Sessão</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={closeEditSessionModal}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
