import React, { useEffect } from 'react';
import { Bell, BookOpen, X, ArrowRight, Volume2 } from 'lucide-react';
import { useBooks } from '../context/BookContext';

export const ReadingReminderToast: React.FC = () => {
  const {
    activeInAppReminder,
    dismissInAppReminder,
    activeBook,
    setCurrentTab,
    openLogModal,
  } = useBooks();

  useEffect(() => {
    if (!activeInAppReminder) return;

    // Auto-dismiss after 15 seconds if not manually interacted with
    const timer = setTimeout(() => {
      dismissInAppReminder();
    }, 15000);

    return () => clearTimeout(timer);
  }, [activeInAppReminder, dismissInAppReminder]);

  if (!activeInAppReminder) return null;

  const handleStartReading = () => {
    dismissInAppReminder();
    setCurrentTab('reading');
    if (activeBook) {
      openLogModal(activeBook);
    }
  };

  return (
    <div className="fixed top-5 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600/50 shadow-2xl shadow-amber-500/10 flex flex-col gap-3 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 relative mt-0.5">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeInAppReminder.title}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeInAppReminder.message}
              </p>
            </div>
          </div>

          <button
            onClick={dismissInAppReminder}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Fechar lembrete"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={dismissInAppReminder}
            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Mais tarde
          </button>

          <button
            onClick={handleStartReading}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Registrar Leitura</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
