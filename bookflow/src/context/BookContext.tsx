import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Book, BookNote, BookStatus, ReadingGoal, ViewTab, ReadingReminderSettings, DEFAULT_REMINDER_SETTINGS, ReadingSession } from '../types/book';
import { getTodayString } from '../utils/dateUtils';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../services/supabaseClient';
import { supabaseDataService } from '../services/supabaseDataService';
import { supabaseAdminService } from '../services/supabaseAdminService';
import { databaseHealthService, DatabaseHealthStatus } from '../services/databaseHealthService';

export type ProfileAccentColor = 'amber' | 'indigo' | 'emerald' | 'rose' | 'purple' | 'sky';

export interface AppNotification {
  id: string;
  type: 'broadcast' | 'reminder' | 'system' | 'goal' | 'cloud';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: 'high' | 'normal';
}
import {
  getBooks as repoGetBooks,
  saveBooks as repoSaveBooks,
  deleteBook as repoDeleteBook,
  addBookNote as repoAddBookNote,
  deleteBookNote as repoDeleteBookNote,
  updateReadingSession as repoUpdateReadingSession,
  deleteReadingSession as repoDeleteReadingSession,
  getCategories as repoGetCategories,
  saveCategories as repoSaveCategories,
  getReadingGoal as repoGetReadingGoal,
  saveReadingGoal as repoSaveReadingGoal,
  getActiveBookId as repoGetActiveBookId,
  saveActiveBookId as repoSaveActiveBookId,
  getTheme as repoGetTheme,
  saveTheme as repoSaveTheme,
  getReminderSettings as repoGetReminderSettings,
  saveReminderSettings as repoSaveReminderSettings,
  exportData as repoExportData,
  importData as repoImportData,
  resetAll as repoResetAll,
  sortCategoriesAlphabetical,
  DEFAULT_APP_CATEGORIES,
} from '../services/bookRepository';

// Maintain backward compatibility for imports from BookContext
export const sortCategories = sortCategoriesAlphabetical;
export const DEFAULT_CATEGORIES = DEFAULT_APP_CATEGORIES;

interface BookContextType {
  books: Book[];
  activeBookId: string | null;
  setActiveBookId: (id: string | null) => void;
  activeBook: Book | undefined;
  readingBooks: Book[];
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  goal: ReadingGoal;
  updateGoal: (newGoal: Partial<ReadingGoal>) => void;

  // Book Actions
  addBook: (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>) => Book;
  addBooksBulk: (booksData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>[]) => Book[];
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  addBookNote: (bookId: string, noteData: Omit<BookNote, 'id' | 'createdAt'>) => void;
  deleteBookNote: (bookId: string, noteId: string) => void;
  logReadingSession: (bookId: string, pagesRead: number, endingPage?: number, notes?: string, date?: string) => void;
  updateReadingSession: (
    bookId: string,
    sessionId: string,
    updates: { pagesRead?: number; endingPage?: number; date?: string; notes?: string }
  ) => void;
  deleteReadingSession: (bookId: string, sessionId: string) => void;
  changeBookStatus: (id: string, newStatus: BookStatus) => void;
  changeBooksStatusBulk: (ids: string[], newStatus: BookStatus) => void;
  deleteBooksBulk: (ids: string[]) => void;
  resetToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => Promise<boolean>;

  // Session Edit Modal
  sessionToEdit: { book: Book; session: ReadingSession } | null;
  openEditSessionModal: (book: Book, session: ReadingSession) => void;
  closeEditSessionModal: () => void;

  // Book Deletion Confirmation Modal
  bookToDelete: Book | null;
  requestDeleteBook: (book: Book) => void;
  cancelDeleteBook: () => void;
  confirmDeleteBook: () => void;

  // Categories
  categories: string[];
  addCategory: (categoryName: string) => boolean;
  updateCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (categoryName: string) => boolean;
  isCategoryModalOpen: boolean;
  openCategoryModal: () => void;
  closeCategoryModal: () => void;

  // Modals management
  isAddModalOpen: boolean;
  editingBook: Book | null;
  presetStatusForNew: BookStatus | undefined;
  openAddBookModal: (presetStatus?: BookStatus) => void;
  openEditBookModal: (book: Book) => void;
  closeBookModal: () => void;

  isLogModalOpen: boolean;
  bookToLog: Book | null;
  openLogModal: (book: Book) => void;
  closeLogModal: () => void;

  isCsvModalOpen: boolean;
  openCsvModal: () => void;
  closeCsvModal: () => void;

  viewingBook: Book | null;
  openDetailModal: (book: Book) => void;
  closeDetailModal: () => void;

  // Reading Reminders
  reminderSettings: ReadingReminderSettings;
  updateReminderSettings: (newSettings: Partial<ReadingReminderSettings>) => void;
  browserNotificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<boolean>;
  triggerTestReminder: () => void;
  activeInAppReminder: { title: string; message: string; bookTitle?: string } | null;
  dismissInAppReminder: () => void;

  // Supabase Cloud Sync
  isSyncing: boolean;
  cloudConnected: boolean;
  syncWithSupabase: () => Promise<void>;

  // Onboarding Guided Tour
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;

  // Database Health Check
  databaseHealth: DatabaseHealthStatus | null;
  checkDatabaseHealth: () => Promise<void>;

  // Responsive Tablet/Desktop Collapsible Sidebar
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Global Profile Accent Color
  accentColor: ProfileAccentColor;
  setAccentColor: (color: ProfileAccentColor) => void;

  // In-App Notification System
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markAllNotificationsAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const cloudConnected = Boolean(user && !user.isDemo);

  // Onboarding modal state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Database Health status
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealthStatus | null>(null);

  // Sidebar collapsible state for tablets/desktops
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bookflow_sidebar_collapsed_v1') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bookflow_sidebar_collapsed_v1', String(next));
      } catch {}
      return next;
    });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    try {
      localStorage.setItem('bookflow_sidebar_collapsed_v1', String(collapsed));
    } catch {}
  }, []);

  const openOnboarding = useCallback(() => setIsOnboardingOpen(true), []);
  const closeOnboarding = useCallback(() => setIsOnboardingOpen(false), []);

  const checkDatabaseHealth = useCallback(async () => {
    const res = await databaseHealthService.checkHealth();
    setDatabaseHealth(res);
  }, []);

  // Automatic onboarding check on login/mount
  useEffect(() => {
    if (user) {
      try {
        const storageKey = `bookflow_onboarding_completed_${user.id}`;
        const hasCompleted = localStorage.getItem(storageKey);
        if (!hasCompleted && !user.isDemo) {
          const timer = setTimeout(() => {
            setIsOnboardingOpen(true);
          }, 900);
          return () => clearTimeout(timer);
        }
      } catch {}
    }
  }, [user]);

  // Initial database health check
  useEffect(() => {
    checkDatabaseHealth();
    const interval = setInterval(checkDatabaseHealth, 120000);
    return () => clearInterval(interval);
  }, [checkDatabaseHealth]);

  // Theme state isolated via repository
  const [theme, setTheme] = useState<'light' | 'dark'>(() => repoGetTheme());

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<ViewTab>('reading');

  // Books state isolated via repository
  const [books, setBooks] = useState<Book[]>(() => repoGetBooks());

  // Reading Goal isolated via repository
  const [goal, setGoal] = useState<ReadingGoal>(() => repoGetReadingGoal());

  // Active book ID for the reading monitor isolated via repository
  const [activeBookId, setActiveBookIdState] = useState<string | null>(() => repoGetActiveBookId());

  // Categories state isolated via repository
  const [categories, setCategories] = useState<string[]>(() => repoGetCategories());

  // Deletion Confirmation Modal State
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [presetStatusForNew, setPresetStatusForNew] = useState<BookStatus | undefined>(undefined);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [bookToLog, setBookToLog] = useState<Book | null>(null);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<{ book: Book; session: ReadingSession } | null>(null);

  // Reading Reminders state
  const [reminderSettings, setReminderSettings] = useState<ReadingReminderSettings>(() => repoGetReminderSettings());
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [activeInAppReminder, setActiveInAppReminder] = useState<{ title: string; message: string; bookTitle?: string } | null>(null);

  // Global Profile Accent Color
  const [accentColor, setAccentColorState] = useState<ProfileAccentColor>(() => {
    try {
      const saved = localStorage.getItem('bookflow_accent_color') || localStorage.getItem('bookflow_avatar_color');
      if (saved && ['amber', 'indigo', 'emerald', 'rose', 'purple', 'sky'].includes(saved)) {
        return saved as ProfileAccentColor;
      }
    } catch {}
    return 'amber';
  });

  const setAccentColor = useCallback((color: ProfileAccentColor) => {
    setAccentColorState(color);
    try {
      localStorage.setItem('bookflow_accent_color', color);
      localStorage.setItem('bookflow_avatar_color', color);
      document.documentElement.setAttribute('data-accent', color);
      document.body.setAttribute('data-accent', color);
      window.dispatchEvent(new CustomEvent('bookflow_accent_color_changed', { detail: { accentColor: color } }));
    } catch {}
  }, []);

  // Sync accent color with DOM
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-accent', accentColor);
      document.body.setAttribute('data-accent', accentColor);
    } catch {}
  }, [accentColor]);

  // Notifications State Management
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bookflow_read_notifications_v1') || '[]');
    } catch {
      return [];
    }
  });

  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bookflow_dismissed_notifications_v1') || '[]');
    } catch {
      return [];
    }
  });

  // Calculate dynamic notifications list
  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    const broadcastConfig = supabaseAdminService.getGlobalBroadcast();
    const broadcastMsg = broadcastConfig && broadcastConfig.enabled && broadcastConfig.message ? broadcastConfig.message : null;

    // 1. Broadcast global ativo
    if (broadcastMsg && !dismissedNotificationIds.includes('broadcast-active')) {
      list.push({
        id: 'broadcast-active',
        type: 'broadcast',
        title: 'Comunicado Global da Equipe',
        message: broadcastMsg,
        timestamp: 'Agora',
        read: readNotificationIds.includes('broadcast-active'),
        priority: 'high',
      });
    }

    // 2. Lembrete Diário de Leitura
    if (!dismissedNotificationIds.includes('daily-reminder')) {
      list.push({
        id: 'daily-reminder',
        type: 'reminder',
        title: 'Meta Diária de Páginas',
        message: `Sua meta diária está em ${goal.dailyPageTarget} páginas. Registre sua sessão de hoje para manter o ritmo!`,
        timestamp: 'Hoje',
        read: readNotificationIds.includes('daily-reminder'),
      });
    }

    // 3. Status da Conexão em Nuvem
    if (!dismissedNotificationIds.includes('cloud-health')) {
      list.push({
        id: 'cloud-health',
        type: 'cloud',
        title: 'Sincronização em Nuvem',
        message: databaseHealth?.message || 'Banco Supabase ativo e operacional.',
        timestamp: 'Recente',
        read: readNotificationIds.includes('cloud-health'),
      });
    }

    // 4. Atualização da Plataforma v2.4.0
    if (!dismissedNotificationIds.includes('system-v240')) {
      list.push({
        id: 'system-v240',
        type: 'system',
        title: 'BookFlow v2.4.0 Atualizado',
        message: 'Novo rodapé premium, confirmação segura de logout, temas globais de cor e central de notificações.',
        timestamp: 'Versão 2.4.0',
        read: readNotificationIds.includes('system-v240'),
      });
    }

    // 5. Desafio Literário Anual
    if (!dismissedNotificationIds.includes('goal-status')) {
      list.push({
        id: 'goal-status',
        type: 'goal',
        title: `Desafio Literário ${goal.year}`,
        message: `Seu objetivo para este ano é de ${goal.targetBooks} livros. Acompanhe seu ritmo na aba de Metas!`,
        timestamp: `${goal.year}`,
        read: readNotificationIds.includes('goal-status'),
      });
    }

    return list;
  }, [goal, databaseHealth, readNotificationIds, dismissedNotificationIds]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAllNotificationsAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds((prev) => {
      const merged = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('bookflow_read_notifications_v1', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, [notifications]);

  const dismissNotification = useCallback((id: string) => {
    setDismissedNotificationIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('bookflow_dismissed_notifications_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setDismissedNotificationIds(allIds);
    try {
      localStorage.setItem('bookflow_dismissed_notifications_v1', JSON.stringify(allIds));
    } catch {}
  }, [notifications]);

  // Sync activeBookId with repository helper
  const setActiveBookId = useCallback((id: string | null) => {
    setActiveBookIdState(id);
    repoSaveActiveBookId(id);
  }, []);

  // Constante com IDs de livros de demonstração padrão (nunca devem poluir contas autenticadas)
  const DEMO_BOOK_IDS = useMemo(
    () => new Set(['book-1', 'book-2', 'book-3', 'book-4', 'book-5', 'book-6', 'book-7', 'book-8', 'book-9']),
    []
  );

  // Sync data with Supabase cloud when authenticated
  const syncWithSupabase = useCallback(async () => {
    if (!user || user.isDemo) return;
    setIsSyncing(true);
    try {
      const [remoteBooks, remoteGoal, remoteCats, remoteRem] = await Promise.all([
        supabaseDataService.fetchUserBooks(user.id),
        supabaseDataService.fetchUserGoal(user.id),
        supabaseDataService.fetchUserCategories(user.id),
        supabaseDataService.fetchUserReminder(user.id),
      ]);

      const userStorageKey = `bookflow_user_books_${user.id}`;
      let finalBooks: Book[] = [];

      if (remoteBooks && remoteBooks.length > 0) {
        // A biblioteca remota do Supabase é a autoridade máxima e sincronizada entre todos os dispositivos
        finalBooks = remoteBooks;
        setBooks(finalBooks);
        repoSaveBooks(finalBooks);
        try {
          localStorage.setItem(userStorageKey, JSON.stringify(finalBooks));
        } catch {}
      } else {
        // Usuário novo ou com biblioteca remota vazia: inicializa estante limpa e isolada
        finalBooks = [];
        setBooks([]);
        repoSaveBooks([]);
        try {
          localStorage.removeItem(userStorageKey);
        } catch {}
      }

      if (remoteGoal) {
        setGoal(remoteGoal);
        repoSaveReadingGoal(remoteGoal);
      } else if (goal) {
        await supabaseDataService.saveUserGoal(user.id, goal);
      }

      if (remoteCats && remoteCats.length > 0) {
        const sortedCats = sortCategoriesAlphabetical(remoteCats);
        setCategories(sortedCats);
        repoSaveCategories(sortedCats);
      } else if (categories.length > 0) {
        await supabaseDataService.saveUserCategories(user.id, categories);
      }

      if (remoteRem) {
        setReminderSettings(remoteRem);
        repoSaveReminderSettings(remoteRem);
      } else if (reminderSettings) {
        await supabaseDataService.saveUserReminder(user.id, reminderSettings);
      }
    } catch (err) {
      console.warn('[BookContext] Erro ao sincronizar com Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user, goal, categories, reminderSettings, DEMO_BOOK_IDS]);

  // Synchronize with Supabase when authenticated user changes
  useEffect(() => {
    if (user && !user.isDemo) {
      syncWithSupabase();
    }
  }, [user?.id]);

  // Realtime Supabase Channel & Multi-Device Sync (Auto-Sync ao vivo e ao reabrir/focar no mobile)
  useEffect(() => {
    if (!user || user.isDemo) return;

    const client = getSupabaseClient();
    if (!client) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const triggerDebouncedSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        syncWithSupabase();
      }, 400);
    };

    // Subscrição em tempo real aos canais das tabelas do usuário
    const channelName = `realtime_user_${user.id}_${Date.now()}`;
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          triggerDebouncedSync();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          triggerDebouncedSync();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_goals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          triggerDebouncedSync();
        }
      )
      .subscribe();

    // Sincronização instantânea ao alternar abas ou desbloquear smartphone/tablet
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        triggerDebouncedSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      try {
        client.removeChannel(channel);
      } catch {}
    };
  }, [user?.id, syncWithSupabase]);

  // Sync theme with HTML document and repository
  useEffect(() => {
    repoSaveTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync books with repository
  useEffect(() => {
    repoSaveBooks(books);
  }, [books]);

  // Sync goal with repository
  useEffect(() => {
    repoSaveReadingGoal(goal);
  }, [goal]);

  // Sync categories with repository
  useEffect(() => {
    repoSaveCategories(categories);
  }, [categories]);

  // Auto-merge categories if books contain new custom categories (keep sorted)
  useEffect(() => {
    const bookCats = books.map((b) => b.category).filter(Boolean);
    const newCats = bookCats.filter(
      (c) => !categories.some((existing) => existing.toLowerCase() === c.toLowerCase())
    );
    if (newCats.length > 0) {
      setCategories((prev) => sortCategoriesAlphabetical(Array.from(new Set([...prev, ...newCats]))));
    }
  }, [books]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const readingBooks = useMemo(() => books.filter((b) => b.status === 'reading'), [books]);

  // Determine active book safely
  const activeBook = useMemo(() => {
    if (activeBookId) {
      const found = books.find((b) => b.id === activeBookId && b.status === 'reading');
      if (found) return found;
    }
    return readingBooks[0] || undefined;
  }, [books, activeBookId, readingBooks]);

  const addBook = (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>): Book => {
    const newBook: Book = {
      ...bookData,
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setBooks((prev) => [newBook, ...prev]);

    if (newBook.status === 'reading') {
      setActiveBookId(newBook.id);
    }

    if (user && !user.isDemo) {
      supabaseDataService.saveBook(user.id, newBook).catch(console.error);
    }

    return newBook;
  };

  const addBooksBulk = (booksData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'sessions'>[]): Book[] => {
    const timestamp = Date.now();
    const newBooks: Book[] = booksData.map((data, index) => ({
      ...data,
      id: `book-${timestamp}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      sessions: [],
      createdAt: timestamp + index,
      updatedAt: timestamp + index,
    }));

    setBooks((prev) => [...newBooks, ...prev]);

    if (user && !user.isDemo) {
      supabaseDataService.bulkUpsertBooks(user.id, newBooks).catch(console.error);
    }

    return newBooks;
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks((prev) => {
      const updatedList = prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b));
      if (user && !user.isDemo) {
        const target = updatedList.find((b) => b.id === id);
        if (target) {
          supabaseDataService.saveBook(user.id, target).catch(console.error);
        }
      }
      return updatedList;
    });
  };

  /**
   * Delete book permanently:
   * - Immediately removes from state and updates repository/localStorage
   * - Deletes from Supabase if authenticated
   * - Safely resets or reassigns activeBookId if deleted book was active
   * - Closes viewing modal if the deleted book was opened
   */
  const deleteBook = useCallback((id: string) => {
    // Immediate storage sync through repository
    repoDeleteBook(id);

    if (user && !user.isDemo) {
      supabaseDataService.deleteBook(user.id, id).catch((err) => {
        console.warn('[BookContext] Erro ao deletar livro no Supabase:', err);
      });
    }

    // Immediate state sync
    setBooks((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      return remaining;
    });

    // If active book was deleted, find another reading book or clear
    if (activeBookId === id) {
      const otherReading = books.find((b) => b.id !== id && b.status === 'reading');
      const newActiveId = otherReading ? otherReading.id : null;
      setActiveBookId(newActiveId);
    }

    // Close detail modal if the deleted book was currently viewed
    if (viewingBook?.id === id) {
      setViewingBook(null);
    }

    // Clear confirmation state
    setBookToDelete(null);
  }, [activeBookId, books, viewingBook, setActiveBookId, user]);

  // Request deletion opens the confirmation modal
  const requestDeleteBook = (book: Book) => {
    setBookToDelete(book);
  };

  const cancelDeleteBook = () => {
    setBookToDelete(null);
  };

  const confirmDeleteBook = () => {
    if (bookToDelete) {
      deleteBook(bookToDelete.id);
    }
  };

  // Add a note or quote to a book
  const addBookNote = useCallback(
    (bookId: string, noteData: Omit<BookNote, 'id' | 'createdAt'>) => {
      const updated = repoAddBookNote(bookId, noteData);
      setBooks(updated);
      setViewingBook((curr) => {
        if (!curr || curr.id !== bookId) return curr;
        return updated.find((b) => b.id === bookId) || null;
      });

      if (user && !user.isDemo) {
        const book = updated.find((b) => b.id === bookId);
        const newestNote = book?.notes?.[0];
        if (newestNote) {
          supabaseDataService.saveBookNote(user.id, bookId, newestNote).catch(console.error);
        }
      }
    },
    [user]
  );

  // Delete a note or quote from a book
  const deleteBookNote = useCallback(
    (bookId: string, noteId: string) => {
      const updated = repoDeleteBookNote(bookId, noteId);
      setBooks(updated);
      setViewingBook((curr) => {
        if (!curr || curr.id !== bookId) return curr;
        return updated.find((b) => b.id === bookId) || null;
      });

      if (user && !user.isDemo) {
        supabaseDataService.deleteBookNote(user.id, noteId).catch(console.error);
      }
    },
    [user]
  );

  // Keep viewingBook synchronized if books update from external actions
  useEffect(() => {
    if (viewingBook) {
      const current = books.find((b) => b.id === viewingBook.id);
      if (current && current !== viewingBook) {
        setViewingBook(current);
      }
    }
  }, [books, viewingBook]);

  const changeBookStatus = (id: string, newStatus: BookStatus) => {
    const today = getTodayString();
    setBooks((prev) => {
      const updatedList = prev.map((b) => {
        if (b.id !== id) return b;
        const updates: Partial<Book> = { status: newStatus, updatedAt: Date.now() };

        if (newStatus === 'reading') {
          if (!b.startDate) updates.startDate = today;
          updates.completedDate = undefined;
          if (b.currentPage >= b.totalPages) {
            updates.currentPage = 0;
          }
        }

        if (newStatus === 'to_read') {
          updates.completedDate = undefined;
          updates.currentPage = 0;
        }

        if (newStatus === 'completed') {
          updates.completedDate = b.completedDate || today;
          updates.currentPage = b.totalPages;
        }

        return { ...b, ...updates };
      });

      if (user && !user.isDemo) {
        const target = updatedList.find((b) => b.id === id);
        if (target) {
          supabaseDataService.saveBook(user.id, target).catch(console.error);
        }
      }

      return updatedList;
    });

    if (newStatus === 'reading') {
      setActiveBookId(id);
    } else if (activeBookId === id) {
      const nextReading = books.find((b) => b.id !== id && b.status === 'reading');
      setActiveBookId(nextReading ? nextReading.id : null);
    }
  };

  /**
   * Altera o status de múltiplos livros simultaneamente (Movimentação em Lote)
   * e sincroniza instantaneamente com o banco Supabase e o armazenamento local.
   */
  const changeBooksStatusBulk = useCallback(
    (ids: string[], newStatus: BookStatus) => {
      if (!ids || ids.length === 0) return;
      const idsSet = new Set(ids);
      const today = getTodayString();

      setBooks((prev) => {
        const updatedTargets: Book[] = [];
        const updatedList = prev.map((b) => {
          if (!idsSet.has(b.id)) return b;
          const updates: Partial<Book> = { status: newStatus, updatedAt: Date.now() };

          if (newStatus === 'reading') {
            if (!b.startDate) updates.startDate = today;
            updates.completedDate = undefined;
            if (b.currentPage >= b.totalPages) {
              updates.currentPage = 0;
            }
          }

          if (newStatus === 'to_read') {
            updates.completedDate = undefined;
            updates.currentPage = 0;
          }

          if (newStatus === 'completed') {
            updates.completedDate = b.completedDate || today;
            updates.currentPage = b.totalPages;
          }

          if (newStatus === 'none') {
            updates.completedDate = undefined;
          }

          const updatedBook = { ...b, ...updates };
          updatedTargets.push(updatedBook);
          return updatedBook;
        });

        if (user && !user.isDemo && updatedTargets.length > 0) {
          supabaseDataService.bulkUpsertBooks(user.id, updatedTargets).catch((err) => {
            console.error('[BookContext:bulkUpdateStatus] ❌ Erro ao atualizar lote de livros no Supabase:', err);
          });
        }

        return updatedList;
      });

      if (newStatus === 'reading' && ids.length > 0) {
        setActiveBookId(ids[0]);
      } else if (activeBookId && idsSet.has(activeBookId)) {
        const remainingReading = books.filter((b) => !idsSet.has(b.id) && b.status === 'reading');
        setActiveBookId(remainingReading[0]?.id || null);
      }
    },
    [user, activeBookId, books, setActiveBookId]
  );

  /**
   * Exclui múltiplos livros em lote (Batch Delete)
   */
  const deleteBooksBulk = useCallback(
    (ids: string[]) => {
      if (!ids || ids.length === 0) return;
      const idsSet = new Set(ids);

      ids.forEach((id) => repoDeleteBook(id));

      if (user && !user.isDemo) {
        supabaseDataService.deleteBooksBulk(user.id, ids).catch((err) => {
          console.error('[BookContext:deleteBooksBulk] ❌ Erro ao excluir lote de livros no Supabase:', err);
        });
      }

      setBooks((prev) => prev.filter((b) => !idsSet.has(b.id)));

      if (activeBookId && idsSet.has(activeBookId)) {
        const remainingReading = books.filter((b) => !idsSet.has(b.id) && b.status === 'reading');
        setActiveBookId(remainingReading[0]?.id || null);
      }
    },
    [user, activeBookId, books, setActiveBookId]
  );

  const logReadingSession = (
    bookId: string,
    pagesRead: number,
    endingPage?: number,
    notes?: string,
    date?: string
  ) => {
    const sessionDate = date || getTodayString();
    setBooks((prev) => {
      let createdSession: ReadingSession | null = null;

      const updatedList = prev.map((b) => {
        if (b.id !== bookId) return b;

        const newCurrentPage =
          typeof endingPage === 'number'
            ? Math.min(b.totalPages, Math.max(0, endingPage))
            : Math.min(b.totalPages, b.currentPage + pagesRead);

        const calculatedPagesRead =
          typeof endingPage === 'number'
            ? Math.max(1, endingPage - b.currentPage)
            : pagesRead;

        const session = {
          id: `session-${Date.now()}`,
          bookId,
          date: sessionDate,
          pagesRead: calculatedPagesRead,
          endingPage: newCurrentPage,
          notes: notes || undefined,
          timestamp: Date.now(),
        };
        createdSession = session;

        const isNowCompleted = newCurrentPage >= b.totalPages;

        return {
          ...b,
          currentPage: newCurrentPage,
          status: isNowCompleted ? 'completed' : b.status,
          completedDate: isNowCompleted ? sessionDate : b.completedDate,
          sessions: [session, ...(b.sessions || [])],
          updatedAt: Date.now(),
        };
      });

      if (user && !user.isDemo) {
        const target = updatedList.find((b) => b.id === bookId);
        if (target) {
          supabaseDataService.saveBook(user.id, target)
            .then(() => {
              if (createdSession) {
                return supabaseDataService.saveReadingSession(user.id, createdSession);
              }
            })
            .catch((err) => console.error('[BookContext] Erro ao sincronizar sessão com Supabase:', err));
        }
      }

      return updatedList;
    });
  };

  const updateReadingSession = useCallback(
    (
      bookId: string,
      sessionId: string,
      updates: { pagesRead?: number; endingPage?: number; date?: string; notes?: string }
    ) => {
      const updated = repoUpdateReadingSession(bookId, sessionId, updates);
      setBooks(updated);
      setViewingBook((curr) => {
        if (!curr || curr.id !== bookId) return curr;
        return updated.find((b) => b.id === bookId) || null;
      });

      if (user && !user.isDemo) {
        const book = updated.find((b) => b.id === bookId);
        const session = book?.sessions?.find((s) => s.id === sessionId);
        if (book && session) {
          supabaseDataService.saveBook(user.id, book)
            .then(() => supabaseDataService.saveReadingSession(user.id, session))
            .catch((err) => console.error('[BookContext] Erro ao atualizar sessão:', err));
        }
      }
    },
    [user]
  );

  const deleteReadingSession = useCallback(
    (bookId: string, sessionId: string) => {
      const updated = repoDeleteReadingSession(bookId, sessionId);
      setBooks(updated);
      setViewingBook((curr) => {
        if (!curr || curr.id !== bookId) return curr;
        return updated.find((b) => b.id === bookId) || null;
      });

      if (user && !user.isDemo) {
        const book = updated.find((b) => b.id === bookId);
        supabaseDataService.deleteReadingSession(user.id, sessionId)
          .then(() => {
            if (book) {
              return supabaseDataService.saveBook(user.id, book);
            }
          })
          .catch((err) => console.error('[BookContext] Erro ao excluir sessão:', err));
      }
    },
    [user]
  );

  const openEditSessionModal = (book: Book, session: ReadingSession) => {
    setSessionToEdit({ book, session });
  };

  const closeEditSessionModal = () => {
    setSessionToEdit(null);
  };

  const updateGoal = (newGoal: Partial<ReadingGoal>) => {
    setGoal((prev) => {
      const updated = { ...prev, ...newGoal };
      repoSaveReadingGoal(updated);
      if (user && !user.isDemo) {
        supabaseDataService.saveUserGoal(user.id, updated).catch(console.error);
      }
      return updated;
    });
  };

  const resetToDefaults = () => {
    const resetData = repoResetAll();
    setBooks(resetData.books);
    setGoal(resetData.goal);
    setCategories(resetData.categories);
    setActiveBookId(resetData.activeBookId);
    setReminderSettings(DEFAULT_REMINDER_SETTINGS);
  };

  const exportDataJson = (): string => {
    return repoExportData();
  };

  const importDataJson = async (jsonStr: string): Promise<boolean> => {
    try {
      const result = repoImportData(jsonStr);
      if (!result) return false;

      if (result.books && result.books.length > 0) {
        setBooks(result.books);
        repoSaveBooks(result.books);
      }
      if (result.goal) {
        setGoal(result.goal);
        repoSaveReadingGoal(result.goal);
      }
      if (result.categories && result.categories.length > 0) {
        const sorted = sortCategoriesAlphabetical(result.categories);
        setCategories(sorted);
        repoSaveCategories(sorted);
      }
      if (result.reminders) {
        setReminderSettings(result.reminders);
        repoSaveReminderSettings(result.reminders);
      }

      // Se o usuário estiver autenticado no Supabase, sincroniza IMEDIATAMENTE com a nuvem
      if (user && !user.isDemo) {
        await supabaseDataService.syncFullLibrary(user.id, {
          books: result.books || [],
          goal: result.goal,
          categories: result.categories,
          reminder: result.reminders,
        });
        if (result.books && result.books.length > 0) {
          setBooks([...result.books]);
          repoSaveBooks(result.books);
        }
      }

      return true;
    } catch (err) {
      console.error('[BookContext] Erro ao importar e persistir dados:', err);
      return false;
    }
  };

  const openAddBookModal = (presetStatus?: BookStatus) => {
    setPresetStatusForNew(presetStatus);
    setEditingBook(null);
    setIsAddModalOpen(true);
  };

  const openEditBookModal = (book: Book) => {
    setEditingBook(book);
    setPresetStatusForNew(undefined);
    setIsAddModalOpen(true);
  };

  const closeBookModal = () => {
    setIsAddModalOpen(false);
    setEditingBook(null);
    setPresetStatusForNew(undefined);
  };

  const openLogModal = (book: Book) => {
    setBookToLog(book);
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setBookToLog(null);
  };

  const openCsvModal = () => {
    setIsCsvModalOpen(true);
  };

  const closeCsvModal = () => {
    setIsCsvModalOpen(false);
  };

  const addCategory = (categoryName: string): boolean => {
    const clean = categoryName.trim();
    if (!clean) return false;
    const exists = categories.some((c) => c.toLowerCase() === clean.toLowerCase());
    if (exists) return false;
    const updated = sortCategoriesAlphabetical([...categories, clean]);
    setCategories(updated);
    repoSaveCategories(updated);
    if (user && !user.isDemo) {
      supabaseDataService.saveUserCategories(user.id, updated).catch(console.error);
    }
    return true;
  };

  const updateCategory = (oldName: string, newName: string): boolean => {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanNew) return false;

    const isSame = cleanOld.toLowerCase() === cleanNew.toLowerCase();
    if (!isSame) {
      const alreadyExists = categories.some(
        (c) => c.toLowerCase() === cleanNew.toLowerCase()
      );
      if (alreadyExists) return false;
    }

    const updated = sortCategoriesAlphabetical(
      categories.map((c) => (c.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : c))
    );
    setCategories(updated);
    repoSaveCategories(updated);
    if (user && !user.isDemo) {
      supabaseDataService.saveUserCategories(user.id, updated).catch(console.error);
    }

    // Cascade rename to all books
    setBooks((prev) =>
      prev.map((b) =>
        b.category.toLowerCase() === cleanOld.toLowerCase()
          ? { ...b, category: cleanNew, updatedAt: Date.now() }
          : b
      )
    );

    return true;
  };

  const deleteCategory = (categoryName: string): boolean => {
    const updated = categories.filter((c) => c !== categoryName);
    setCategories(updated);
    repoSaveCategories(updated);
    if (user && !user.isDemo) {
      supabaseDataService.saveUserCategories(user.id, updated).catch(console.error);
    }
    return true;
  };

  const openCategoryModal = () => {
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
  };

  const openDetailModal = (book: Book) => {
    setViewingBook(book);
  };

  const closeDetailModal = () => {
    setViewingBook(null);
  };

  // Web Audio chime synthesis for notifications (pure Web Audio API, no external files)
  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25); // C6

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.65);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.65);
    } catch {
      // Audio playback restrictions fallback
    }
  }, []);

  const updateReminderSettings = useCallback((newSettings: Partial<ReadingReminderSettings>) => {
    setReminderSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      repoSaveReminderSettings(updated);
      if (user && !user.isDemo) {
        supabaseDataService.saveUserReminder(user.id, updated).catch(console.error);
      }
      return updated;
    });
  }, [user]);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setBrowserNotificationPermission(res);
        if (res === 'granted') {
          updateReminderSettings({ browserPush: true });
          return true;
        }
      } catch (err) {
        console.warn('Erro ao solicitar permissão de notificação:', err);
      }
    }
    return false;
  }, [updateReminderSettings]);

  const triggerTestReminder = useCallback(() => {
    const bookTitle = activeBook?.title || 'seu livro ativo';
    const title = 'BookFlow · Lembrete de Leitura 📖';
    const message = reminderSettings.customMessage || `Hora da sua leitura diária! Que tal avançar em "${bookTitle}" agora?`;

    if (reminderSettings.soundEnabled) {
      playNotificationChime();
    }

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      reminderSettings.browserPush
    ) {
      try {
        new Notification(title, {
          body: message,
          tag: 'bookflow-test-reminder',
        });
      } catch (err) {
        console.warn('Erro ao disparar notificação do navegador:', err);
      }
    }

    setActiveInAppReminder({
      title,
      message,
      bookTitle: activeBook?.title,
    });
  }, [activeBook, reminderSettings, playNotificationChime]);

  const dismissInAppReminder = useCallback(() => {
    setActiveInAppReminder(null);
  }, []);

  // Interval timer for daily reading reminders
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkReminderTime = () => {
      const now = new Date();
      const today = getTodayString();
      const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday

      // Frequency filtering
      if (reminderSettings.frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return;
      }
      if (reminderSettings.frequency === 'weekends' && dayOfWeek >= 1 && dayOfWeek <= 5) {
        return;
      }

      // Check time match "HH:mm"
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      if (currentTimeStr === reminderSettings.time && reminderSettings.lastNotifiedDate !== today) {
        const bookTitle = activeBook?.title || 'seu livro ativo';
        const title = 'BookFlow · Lembrete de Leitura Diária 📖';
        const message =
          reminderSettings.customMessage ||
          `Chegou seu horário preferido de leitura! Dedique 15 a 20 minutos para "${bookTitle}".`;

        if (reminderSettings.soundEnabled) {
          playNotificationChime();
        }

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted' &&
          reminderSettings.browserPush
        ) {
          try {
            new Notification(title, {
              body: message,
              tag: 'bookflow-daily-reading-reminder',
            });
          } catch {
            // Ignored
          }
        }

        setActiveInAppReminder({
          title,
          message,
          bookTitle: activeBook?.title,
        });

        // Update last notified date to today
        updateReminderSettings({ lastNotifiedDate: today });
      }
    };

    // Initial check
    checkReminderTime();

    // Check every 25 seconds
    const interval = setInterval(checkReminderTime, 25000);
    return () => clearInterval(interval);
  }, [reminderSettings, activeBook, playNotificationChime, updateReminderSettings]);

  return (
    <BookContext.Provider
      value={{
        books,
        activeBookId,
        setActiveBookId,
        activeBook,
        readingBooks,
        currentTab,
        setCurrentTab,
        theme,
        toggleTheme,
        goal,
        updateGoal,
        addBook,
        addBooksBulk,
        updateBook,
        deleteBook,
        addBookNote,
        deleteBookNote,
        logReadingSession,
        updateReadingSession,
        deleteReadingSession,
        changeBookStatus,
        changeBooksStatusBulk,
        deleteBooksBulk,
        resetToDefaults,
        exportDataJson,
        importDataJson,
        sessionToEdit,
        openEditSessionModal,
        closeEditSessionModal,
        bookToDelete,
        requestDeleteBook,
        cancelDeleteBook,
        confirmDeleteBook,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        isCategoryModalOpen,
        openCategoryModal,
        closeCategoryModal,
        isAddModalOpen,
        editingBook,
        presetStatusForNew,
        openAddBookModal,
        openEditBookModal,
        closeBookModal,
        isLogModalOpen,
        bookToLog,
        openLogModal,
        closeLogModal,
        isCsvModalOpen,
        openCsvModal,
        closeCsvModal,
        viewingBook,
        openDetailModal,
        closeDetailModal,
        reminderSettings,
        updateReminderSettings,
        browserNotificationPermission,
        requestNotificationPermission,
        triggerTestReminder,
        activeInAppReminder,
        dismissInAppReminder,
        isSyncing,
        cloudConnected,
        syncWithSupabase,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
        databaseHealth,
        checkDatabaseHealth,
        isSidebarCollapsed,
        toggleSidebarCollapsed,
        setSidebarCollapsed,
        accentColor,
        setAccentColor,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsAsRead,
        dismissNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = (): BookContextType => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};
