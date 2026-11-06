/**
 * @file bookRepository.ts
 * @description Camada de repositório e persistência de dados para o BookFlow.
 * 
 * ARQUITETURA LIMPA (Preparada para Futuro Banco de Dados / Supabase / API):
 * Todas as operações de leitura, escrita e exclusão de dados são isoladas neste módulo.
 * Caso seja necessário migrar o armazenamento local (localStorage) para um backend remoto
 * (ex: Supabase, PostgreSQL, Firebase ou API REST), basta alterar as implementações
 * destas funções ou injetar uma nova implementação da interface IBookRepository,
 * sem necessidade de modificar os componentes visuais da aplicação.
 */

import { Book, BookNote, ReadingSession, ReadingGoal, ReadingReminderSettings, DEFAULT_REMINDER_SETTINGS } from '../types/book';
import { getInitialBooks, INITIAL_READING_GOAL } from '../data/initialBooks';

export const STORAGE_KEYS = {
  BOOKS: 'bookflow_books_v1',
  GOAL: 'bookflow_goal_v1',
  THEME: 'bookflow_theme_v1',
  ACTIVE_BOOK: 'bookflow_active_book_v1',
  CATEGORIES: 'bookflow_categories_v1',
  REMINDER: 'bookflow_reminder_v1',
} as const;

/**
 * Função utilitária para manter categorias em ordem alfabética estrita (pt-BR)
 */
export const sortCategoriesAlphabetical = (cats: string[]): string[] => {
  return [...cats].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );
};

export const DEFAULT_APP_CATEGORIES: string[] = sortCategoriesAlphabetical([
  'Desenvolvimento Pessoal',
  'Educação & Pedagogia',
  'Ficção',
  'Filosofia & Sociologia',
  'História & Biografia',
  'Literatura Clássica',
  'Matemática / Exatas',
  'Negócios & Carreira',
  'Não-Ficção',
  'Outros',
  'Tecnologia & Ciência',
]);

/**
 * Contrato de repositório para o BookFlow
 */
export interface IBookRepository {
  getBooks(): Book[];
  saveBooks(books: Book[]): void;
  getBookById(id: string): Book | undefined;
  saveBook(book: Book): Book[];
  deleteBook(id: string): Book[];
  addBookNote(bookId: string, note: Omit<BookNote, 'id' | 'createdAt'>): Book[];
  deleteBookNote(bookId: string, noteId: string): Book[];

  getCategories(): string[];
  saveCategories(categories: string[]): void;

  getReadingGoal(): ReadingGoal;
  saveReadingGoal(goal: ReadingGoal): void;

  getActiveBookId(): string | null;
  saveActiveBookId(id: string | null): void;

  getTheme(): 'light' | 'dark';
  saveTheme(theme: 'light' | 'dark'): void;

  getReminderSettings(): ReadingReminderSettings;
  saveReminderSettings(settings: ReadingReminderSettings): void;

  exportData(): string;
  importData(jsonStr: string): NormalizedImportResult | null;
  resetAll(): { books: Book[]; goal: ReadingGoal; categories: string[]; activeBookId: string };
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS DE ACESSO A DADOS (DATA ACCESS LAYER)
// ============================================================================

/**
 * Carrega a lista completa de livros persistidos.
 * Se nenhum livro existir no armazenamento, inicializa com o conjunto inicial de demonstração.
 */
export function getBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('[BookRepository] Erro ao carregar livros do armazenamento:', error);
  }
  return getInitialBooks();
}

/**
 * Salva a lista de livros no armazenamento persistente.
 */
export function saveBooks(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  } catch (error) {
    console.error('[BookRepository] Erro ao salvar livros no armazenamento:', error);
  }
}

/**
 * Busca um livro específico pelo seu ID.
 */
export function getBookById(id: string): Book | undefined {
  const books = getBooks();
  return books.find((b) => b.id === id);
}

/**
 * Adiciona ou atualiza um livro individual e persiste a coleção atualizada.
 */
export function saveBook(book: Book): Book[] {
  const books = getBooks();
  const index = books.findIndex((b) => b.id === book.id);
  let updated: Book[];
  if (index >= 0) {
    updated = [...books];
    updated[index] = { ...book, updatedAt: Date.now() };
  } else {
    updated = [book, ...books];
  }
  saveBooks(updated);
  return updated;
}

/**
 * Exclui permanentemente um livro pelo seu ID e atualiza o armazenamento.
 * Retorna a nova lista de livros sem o item excluído.
 */
export function deleteBook(id: string): Book[] {
  const books = getBooks();
  const updated = books.filter((b) => b.id !== id);
  saveBooks(updated);
  return updated;
}

/**
 * Adiciona uma nota ou citação a um livro específico e persiste.
 */
export function addBookNote(
  bookId: string,
  noteData: Omit<BookNote, 'id' | 'createdAt'>
): Book[] {
  const books = getBooks();
  const index = books.findIndex((b) => b.id === bookId);
  if (index < 0) return books;

  const targetBook = books[index];
  const newNote: BookNote = {
    ...noteData,
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };

  const updatedNotes = [newNote, ...(targetBook.notes || [])];
  const updatedBook: Book = {
    ...targetBook,
    notes: updatedNotes,
    updatedAt: Date.now(),
  };

  const updatedBooks = [...books];
  updatedBooks[index] = updatedBook;
  saveBooks(updatedBooks);
  return updatedBooks;
}

/**
 * Exclui uma nota ou citação de um livro específico e persiste.
 */
export function deleteBookNote(bookId: string, noteId: string): Book[] {
  const books = getBooks();
  const index = books.findIndex((b) => b.id === bookId);
  if (index < 0) return books;

  const targetBook = books[index];
  const updatedNotes = (targetBook.notes || []).filter((n) => n.id !== noteId);
  const updatedBook: Book = {
    ...targetBook,
    notes: updatedNotes,
    updatedAt: Date.now(),
  };

  const updatedBooks = [...books];
  updatedBooks[index] = updatedBook;
  saveBooks(updatedBooks);
  return updatedBooks;
}

/**
 * Atualiza uma sessão de leitura existente de um livro específico e recalcula progresso.
 */
export function updateReadingSession(
  bookId: string,
  sessionId: string,
  updates: {
    pagesRead?: number;
    endingPage?: number;
    date?: string;
    notes?: string;
  }
): Book[] {
  const books = getBooks();
  const index = books.findIndex((b) => b.id === bookId);
  if (index < 0) return books;

  const targetBook = books[index];
  const sessions = targetBook.sessions || [];
  const sIndex = sessions.findIndex((s) => s.id === sessionId);
  if (sIndex < 0) return books;

  const currentSession = sessions[sIndex];
  const updatedSession = {
    ...currentSession,
    pagesRead: typeof updates.pagesRead === 'number' ? Math.max(1, updates.pagesRead) : currentSession.pagesRead,
    endingPage: typeof updates.endingPage === 'number' ? Math.max(0, updates.endingPage) : currentSession.endingPage,
    date: updates.date || currentSession.date,
    notes: updates.notes !== undefined ? (updates.notes.trim() || undefined) : currentSession.notes,
  };

  const updatedSessions = [...sessions];
  updatedSessions[sIndex] = updatedSession;

  // Determina a página atual baseado na sessão mais recente
  const sortedSessions = [...updatedSessions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const latestEndingPage = sortedSessions.length > 0 ? (sortedSessions[0].endingPage || 0) : targetBook.currentPage;
  const newCurrentPage = Math.min(targetBook.totalPages, Math.max(0, latestEndingPage));
  const isCompleted = newCurrentPage >= targetBook.totalPages;

  const updatedBook: Book = {
    ...targetBook,
    currentPage: newCurrentPage,
    status: isCompleted ? 'completed' : targetBook.status === 'completed' ? 'reading' : targetBook.status,
    completedDate: isCompleted ? (targetBook.completedDate || updatedSession.date) : (targetBook.status === 'completed' && !isCompleted ? undefined : targetBook.completedDate),
    sessions: updatedSessions,
    updatedAt: Date.now(),
  };

  const updatedBooks = [...books];
  updatedBooks[index] = updatedBook;
  saveBooks(updatedBooks);
  return updatedBooks;
}

/**
 * Remove uma sessão de leitura existente e recalcula o progresso do livro.
 */
export function deleteReadingSession(bookId: string, sessionId: string): Book[] {
  const books = getBooks();
  const index = books.findIndex((b) => b.id === bookId);
  if (index < 0) return books;

  const targetBook = books[index];
  const updatedSessions = (targetBook.sessions || []).filter((s) => s.id !== sessionId);

  // Determina a nova página atual baseado nas sessões restantes
  const sortedSessions = [...updatedSessions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const latestEndingPage = sortedSessions.length > 0 ? (sortedSessions[0].endingPage || 0) : 0;
  const newCurrentPage = Math.min(targetBook.totalPages, Math.max(0, latestEndingPage));
  const isCompleted = newCurrentPage >= targetBook.totalPages;

  const updatedBook: Book = {
    ...targetBook,
    currentPage: newCurrentPage,
    status: isCompleted ? 'completed' : targetBook.status === 'completed' ? 'reading' : targetBook.status,
    completedDate: isCompleted ? targetBook.completedDate : undefined,
    sessions: updatedSessions,
    updatedAt: Date.now(),
  };

  const updatedBooks = [...books];
  updatedBooks[index] = updatedBook;
  saveBooks(updatedBooks);
  return updatedBooks;
}

/**
 * Carrega a lista de categorias ordenada alfabeticamente.
 */
export function getCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortCategoriesAlphabetical(
          Array.from(new Set([...DEFAULT_APP_CATEGORIES, ...parsed]))
        );
      }
    }
  } catch (error) {
    console.error('[BookRepository] Erro ao carregar categorias:', error);
  }
  return sortCategoriesAlphabetical(DEFAULT_APP_CATEGORIES);
}

/**
 * Salva a lista de categorias no armazenamento persistente.
 */
export function saveCategories(categories: string[]): void {
  try {
    const sorted = sortCategoriesAlphabetical(categories);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(sorted));
  } catch (error) {
    console.error('[BookRepository] Erro ao salvar categorias:', error);
  }
}

/**
 * Carrega as metas de leitura configuradas.
 */
export function getReadingGoal(): ReadingGoal {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.targetBooks === 'number') {
        return parsed;
      }
    }
  } catch (error) {
    console.error('[BookRepository] Erro ao carregar meta:', error);
  }
  return INITIAL_READING_GOAL;
}

/**
 * Salva a meta de leitura no armazenamento.
 */
export function saveReadingGoal(goal: ReadingGoal): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(goal));
  } catch (error) {
    console.error('[BookRepository] Erro ao salvar meta:', error);
  }
}

/**
 * Obtém o ID do livro atualmente monitorado.
 */
export function getActiveBookId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_BOOK);
    if (raw) return raw;
  } catch (error) {
    console.error('[BookRepository] Erro ao obter activeBookId:', error);
  }
  return 'book-1';
}

/**
 * Salva o ID do livro ativo no armazenamento.
 */
export function saveActiveBookId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BOOK, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_BOOK);
    }
  } catch (error) {
    console.error('[BookRepository] Erro ao salvar activeBookId:', error);
  }
}

/**
 * Obtém o tema preferido do usuário (light ou dark).
 */
export function getTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback
  }
  return 'light';
}

/**
 * Salva o tema do usuário no armazenamento.
 */
export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('[BookRepository] Erro ao salvar tema:', error);
  }
}

/**
 * Carrega as preferências de lembrete diário de leitura.
 */
export function getReminderSettings(): ReadingReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.enabled === 'boolean') {
        return { ...DEFAULT_REMINDER_SETTINGS, ...parsed };
      }
    }
  } catch (error) {
    console.error('[BookRepository] Erro ao carregar configurações de lembrete:', error);
  }
  return DEFAULT_REMINDER_SETTINGS;
}

/**
 * Salva as preferências de lembrete diário no armazenamento persistente.
 */
export function saveReminderSettings(settings: ReadingReminderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDER, JSON.stringify(settings));
  } catch (error) {
    console.error('[BookRepository] Erro ao salvar configurações de lembrete:', error);
  }
}

/**
 * Exporta todos os dados do BookFlow como string JSON formatada.
 */
export function exportData(): string {
  const payload = {
    books: getBooks(),
    goal: getReadingGoal(),
    categories: getCategories(),
    activeBookId: getActiveBookId(),
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

export interface NormalizedImportResult {
  books?: Book[];
  goal?: ReadingGoal;
  categories?: string[];
  reminders?: ReadingReminderSettings;
}

/**
 * Processa, normaliza e higieniza qualquer formato de JSON (Backup Global, Exportação padrão ou Array simples de livros).
 * Converte propriedades snake_case para camelCase e valida tipos essenciais.
 */
export function parseAndNormalizeImport(jsonStr: string): NormalizedImportResult | null {
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== 'object') return null;

    if (parsed.data && typeof parsed.data === 'object') {
      parsed = parsed.data;
    }

    let rawBooks: any[] = [];
    let rawSessions: any[] = [];
    let rawNotes: any[] = [];
    let rawGoals: any = null;
    let rawCategories: any[] = [];
    let rawReminders: any = null;

    // Caso 1: Backup global consolidado do banco (tables.books, tables.reading_sessions, etc.)
    if (parsed.tables && typeof parsed.tables === 'object') {
      if (Array.isArray(parsed.tables.books)) rawBooks = parsed.tables.books;
      if (Array.isArray(parsed.tables.reading_sessions)) rawSessions = parsed.tables.reading_sessions;
      if (Array.isArray(parsed.tables.book_notes)) rawNotes = parsed.tables.book_notes;
      if (Array.isArray(parsed.tables.reading_goals) && parsed.tables.reading_goals.length > 0) {
        rawGoals = parsed.tables.reading_goals[0];
      }
      if (Array.isArray(parsed.tables.categories)) rawCategories = parsed.tables.categories;
      if (Array.isArray(parsed.tables.reading_reminders) && parsed.tables.reading_reminders.length > 0) {
        rawReminders = parsed.tables.reading_reminders[0];
      }
    }
    // Caso 2: Exportação padrão do BookFlow ({ books: [...], goal: {...}, categories: [...] })
    else if (Array.isArray(parsed.books)) {
      rawBooks = parsed.books;
      rawGoals = parsed.goal || parsed.goals;
      if (Array.isArray(parsed.categories)) rawCategories = parsed.categories;
      if (parsed.reminders || parsed.reminder) rawReminders = parsed.reminders || parsed.reminder;
    }
    // Caso 3: Array direto de livros ([ { ... }, { ... } ])
    else if (Array.isArray(parsed)) {
      rawBooks = parsed;
    }

    if (rawBooks.length === 0 && !rawGoals && rawCategories.length === 0) {
      return null;
    }

    // Organiza sessões externas por book_id
    const sessionsByBook: Record<string, ReadingSession[]> = {};
    rawSessions.forEach((s: any) => {
      const bId = s.book_id || s.bookId;
      if (!bId) return;
      if (!sessionsByBook[bId]) sessionsByBook[bId] = [];
      sessionsByBook[bId].push({
        id: String(s.id || `session-${bId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        bookId: String(bId),
        date: s.date || new Date().toISOString().split('T')[0],
        pagesRead: Math.max(0, Number(s.pages_read ?? s.pagesRead) || 0),
        endingPage: Number(s.ending_page ?? s.endingPage) || 0,
        notes: s.notes || undefined,
        timestamp: Number(s.timestamp) || Date.now(),
      });
    });

    // Organiza notas externas por book_id
    const notesByBook: Record<string, BookNote[]> = {};
    rawNotes.forEach((n: any) => {
      const bId = n.book_id || n.bookId;
      if (!bId) return;
      if (!notesByBook[bId]) notesByBook[bId] = [];
      notesByBook[bId].push({
        id: String(n.id || `note-${bId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        bookId: String(bId),
        type: ['quote', 'reflection', 'note', 'insight'].includes(n.type) ? n.type : 'note',
        pageOrChapter: n.page_or_chapter || n.pageOrChapter || undefined,
        content: String(n.content || ''),
        createdAt: Number(n.created_at ?? n.createdAt) || Date.now(),
      });
    });

    // Normaliza todos os livros
    const normalizedBooks: Book[] = rawBooks.map((b: any, index: number): Book => {
      const rawId = String(b.id || '');
      // Se o livro importado possui um ID que coincide com os IDs de demo padrão, remapeia para ID único persistente
      const isDemoId = ['book-1', 'book-2', 'book-3', 'book-4', 'book-5', 'book-6', 'book-7', 'book-8', 'book-9'].includes(rawId);
      const id = isDemoId || !rawId
        ? `book-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`
        : rawId;

      // Coleta sessões embutidas no livro
      const embeddedSessions: ReadingSession[] = Array.isArray(b.sessions || b.readingSessions)
        ? (b.sessions || b.readingSessions).map((s: any) => ({
            id: String(s.id || `session-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            bookId: id,
            date: s.date || new Date().toISOString().split('T')[0],
            pagesRead: Math.max(0, Number(s.pagesRead ?? s.pages_read) || 0),
            endingPage: Number(s.endingPage ?? s.ending_page) || 0,
            notes: s.notes || undefined,
            timestamp: Number(s.timestamp) || Date.now(),
          }))
        : [];

      const externalSessions = (sessionsByBook[rawId] || sessionsByBook[id] || []).map((s) => ({
        ...s,
        bookId: id,
      }));
      const allSessions = [...embeddedSessions, ...externalSessions];

      // Coleta notas embutidas no livro
      const embeddedNotes: BookNote[] = Array.isArray(b.notes || b.bookNotes)
        ? (b.notes || b.bookNotes).map((n: any) => ({
            id: String(n.id || `note-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            bookId: id,
            type: ['quote', 'reflection', 'note', 'insight'].includes(n.type) ? n.type : 'note',
            pageOrChapter: n.pageOrChapter || n.page_or_chapter || undefined,
            content: String(n.content || ''),
            createdAt: Number(n.createdAt ?? n.created_at) || Date.now(),
          }))
        : [];
      const externalNotes = (notesByBook[rawId] || notesByBook[id] || []).map((n) => ({
        ...n,
        bookId: id,
      }));
      const allNotes = [...embeddedNotes, ...externalNotes];

      // Validação estrita de status
      let status: Book['status'] = 'none';
      const rawStatus = String(b.status || '').toLowerCase();
      if (['reading', 'to_read', 'completed', 'none'].includes(rawStatus)) {
        status = rawStatus as Book['status'];
      }

      // Normalização de tags
      let tags: string[] = [];
      if (Array.isArray(b.tags)) {
        tags = b.tags.map(String).filter(Boolean);
      } else if (typeof b.tags === 'string' && b.tags.trim()) {
        tags = b.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }

      const totalPages = Math.max(0, Number(b.totalPages ?? b.total_pages) || 0);
      const currentPage = Math.max(0, Number(b.currentPage ?? b.current_page) || 0);

      const createdAt = typeof b.createdAt === 'number'
        ? b.createdAt
        : typeof b.created_at === 'number'
        ? b.created_at
        : b.createdAt ? new Date(b.createdAt).getTime() : Date.now();

      const updatedAt = typeof b.updatedAt === 'number'
        ? b.updatedAt
        : typeof b.updated_at === 'number'
        ? b.updated_at
        : b.updatedAt ? new Date(b.updatedAt).getTime() : Date.now();

      return {
        id,
        title: String(b.title || 'Sem título'),
        author: String(b.author || 'Autor desconhecido'),
        totalPages,
        currentPage,
        category: String(b.category || 'Geral'),
        tags,
        status,
        startDate: b.startDate || b.start_date || undefined,
        targetDeadline: b.targetDeadline || b.target_deadline || undefined,
        completedDate: b.completedDate || b.completed_date || undefined,
        rating: b.rating !== undefined && b.rating !== null ? Number(b.rating) : undefined,
        review: b.review || undefined,
        accentColor: b.accentColor || b.accent_color || 'amber',
        sessions: allSessions,
        notes: allNotes,
        createdAt: isNaN(createdAt) ? Date.now() : createdAt,
        updatedAt: isNaN(updatedAt) ? Date.now() : updatedAt,
      };
    });

    // Normaliza metas
    let normalizedGoal: ReadingGoal | undefined = undefined;
    if (rawGoals && typeof rawGoals === 'object') {
      normalizedGoal = {
        year: Number(rawGoals.year) || new Date().getFullYear(),
        targetBooks: Math.max(1, Number(rawGoals.targetBooks ?? rawGoals.target_books) || 12),
        targetPages: Number(rawGoals.targetPages ?? rawGoals.target_pages) || 4000,
        dailyPageTarget: Number(rawGoals.dailyPageTarget ?? rawGoals.daily_page_target) || 20,
      };
    }

    // Normaliza categorias
    let normalizedCats: string[] | undefined = undefined;
    if (Array.isArray(rawCategories) && rawCategories.length > 0) {
      const catNames = rawCategories.map((c: any) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
      if (catNames.length > 0) {
        normalizedCats = sortCategoriesAlphabetical(Array.from(new Set(catNames)));
      }
    }

    // Normaliza lembretes
    let normalizedReminders: ReadingReminderSettings | undefined = undefined;
    if (rawReminders && typeof rawReminders === 'object') {
      normalizedReminders = {
        enabled: rawReminders.enabled !== false,
        time: rawReminders.time || '20:00',
        frequency: rawReminders.frequency || 'daily',
        browserPush: rawReminders.browserPush ?? rawReminders.browser_push ?? true,
        soundEnabled: rawReminders.soundEnabled ?? rawReminders.sound_enabled ?? true,
        customMessage: rawReminders.customMessage || rawReminders.custom_message || undefined,
        lastNotifiedDate: rawReminders.lastNotifiedDate || rawReminders.last_notified_date || undefined,
      };
    }

    return {
      books: normalizedBooks.length > 0 ? normalizedBooks : undefined,
      goal: normalizedGoal,
      categories: normalizedCats,
      reminders: normalizedReminders,
    };
  } catch (error) {
    console.error('[BookRepository] Falha ao normalizar importação:', error);
    return null;
  }
}

/**
 * Importa dados a partir de uma string JSON, persistindo localmente de forma segura.
 */
export function importData(jsonStr: string): NormalizedImportResult | null {
  const result = parseAndNormalizeImport(jsonStr);
  if (!result) return null;

  if (result.books && result.books.length > 0) {
    saveBooks(result.books);
  }
  if (result.goal) {
    saveReadingGoal(result.goal);
  }
  if (result.categories && result.categories.length > 0) {
    saveCategories(result.categories);
  }
  if (result.reminders) {
    saveReminderSettings(result.reminders);
  }

  return result;
}

/**
 * Restaura todos os dados para os valores padrão de demonstração.
 */
export function resetAll(): { books: Book[]; goal: ReadingGoal; categories: string[]; activeBookId: string } {
  const initial = getInitialBooks();
  saveBooks(initial);
  saveReadingGoal(INITIAL_READING_GOAL);
  saveCategories(DEFAULT_APP_CATEGORIES);
  saveActiveBookId('book-1');
  saveReminderSettings(DEFAULT_REMINDER_SETTINGS);
  return {
    books: initial,
    goal: INITIAL_READING_GOAL,
    categories: DEFAULT_APP_CATEGORIES,
    activeBookId: 'book-1',
  };
}

/**
 * Objeto repositório instanciado para consumo unificado
 */
export const bookRepository: IBookRepository = {
  getBooks,
  saveBooks,
  getBookById,
  saveBook,
  deleteBook,
  addBookNote,
  deleteBookNote,
  getCategories,
  saveCategories,
  getReadingGoal,
  saveReadingGoal,
  getActiveBookId,
  saveActiveBookId,
  getTheme,
  saveTheme,
  getReminderSettings,
  saveReminderSettings,
  exportData,
  importData,
  resetAll,
};
