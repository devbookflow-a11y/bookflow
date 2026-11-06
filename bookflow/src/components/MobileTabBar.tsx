import React from 'react';
import { BookOpen, Library, Bookmark, CheckCircle2, BarChart3, ShieldCheck } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';
import { ViewTab } from '../types/book';

export const MobileTabBar: React.FC = () => {
  const { currentTab, setCurrentTab, readingBooks } = useBooks();
  const { isAdmin } = useAuth();

  const tabs: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Metas', icon: BarChart3 },
    { id: 'library', label: 'Biblioteca', icon: Library },
    { id: 'reading', label: 'Lendo', icon: BookOpen },
    { id: 'to_read', label: 'Desejos', icon: Bookmark },
    { id: 'completed', label: 'Lidos', icon: CheckCircle2 },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 pb-safe"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Navegação Inferior"
    >
      <div
        className="grid items-center h-16 max-w-md mx-auto"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className="flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative"
              aria-label={tab.label}
            >
              <div
                className={`flex items-center justify-center w-9 h-7 rounded-lg transition-all ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
                  isActive
                    ? 'font-bold text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                {tab.label}
              </span>
              {tab.id === 'reading' && readingBooks.length > 0 && (
                <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
