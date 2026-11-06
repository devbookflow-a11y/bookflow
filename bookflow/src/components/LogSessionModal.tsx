import React, { useState, useEffect } from 'react';
import { X, Flame, BookOpen, Calendar, Check } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { getTodayString } from '../utils/dateUtils';

export const LogSessionModal: React.FC = () => {
  const { isLogModalOpen, closeLogModal, bookToLog, logReadingSession } = useBooks();

  const [date, setDate] = useState(getTodayString());
  const [pagesRead, setPagesRead] = useState<number | ''>(15);
  const [endingPage, setEndingPage] = useState<number | ''>('');
  const [mode, setMode] = useState<'delta' | 'target'>('delta');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (bookToLog) {
      setDate(getTodayString());
      setPagesRead(15);
      setEndingPage(Math.min(bookToLog.totalPages, bookToLog.currentPage + 15));
      setNotes('');
    }
  }, [bookToLog, isLogModalOpen]);

  if (!isLogModalOpen || !bookToLog) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'delta') {
      const delta = Number(pagesRead);
      if (!delta || delta <= 0) {
        alert('Informe a quantidade de páginas lidas.');
        return;
      }
      logReadingSession(bookToLog.id, delta, undefined, notes.trim() || undefined, date);
    } else {
      const target = Number(endingPage);
      if (isNaN(target) || target < bookToLog.currentPage) {
        alert('A página final deve ser maior ou igual à página atual.');
        return;
      }
      const delta = target - bookToLog.currentPage;
      logReadingSession(bookToLog.id, delta, target, notes.trim() || undefined, date);
    }

    closeLogModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Leitura
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {bookToLog.title}
              </p>
            </div>
          </div>
          <button
            onClick={closeLogModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Book Page Context */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Página atual:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
              {bookToLog.currentPage} de {bookToLog.totalPages} págs
            </span>
          </div>

          {/* Mode switch */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setMode('delta')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'delta'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Quantas páginas li hoje
            </button>
            <button
              type="button"
              onClick={() => setMode('target')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'target'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Página onde parei
            </button>
          </div>

          {/* Input based on mode */}
          {mode === 'delta' ? (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Páginas Lidas Nesta Sessão
              </label>
              <input
                type="number"
                min="1"
                max={bookToLog.totalPages - bookToLog.currentPage}
                required
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Você avançará para a página {Math.min(bookToLog.totalPages, bookToLog.currentPage + (Number(pagesRead) || 0))}
              </span>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nova Página Atual
              </label>
              <input
                type="number"
                min={bookToLog.currentPage}
                max={bookToLog.totalPages}
                required
                value={endingPage}
                onChange={(e) => setEndingPage(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Serão registradas {Math.max(0, (Number(endingPage) || 0) - bookToLog.currentPage)} páginas lidas
              </span>
            </div>
          )}

          {/* Session Date */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Data da Leitura
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Personal notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Anotações / Reflexões da Sessão (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Conclusão do capítulo 4, insights sobre o teorema..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeLogModal}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-amber-600 dark:hover:bg-amber-500 text-xs font-bold transition-all shadow-sm"
            >
              Salvar Leitura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
