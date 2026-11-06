/**
 * @file supabaseDataService.ts
 * @description Camada de persistência remota no banco de dados Supabase com isolamento por user_id.
 */

import { Book, BookNote, ReadingGoal, ReadingReminderSettings, ReadingSession } from '../types/book';
import { getSupabaseClient } from './supabaseClient';

export interface DbBookRow {
  id: string;
  user_id: string;
  title: string;
  author: string;
  total_pages: number;
  current_page: number;
  category: string;
  tags: string[];
  status: string;
  start_date: string | null;
  target_deadline: string | null;
  completed_date: string | null;
  rating: number | null;
  review: string | null;
  accent_color: string | null;
  created_at: number;
  updated_at: number;
}

export interface DbSessionRow {
  id: string;
  book_id: string;
  user_id: string;
  date: string;
  pages_read: number;
  ending_page: number | null;
  notes: string | null;
  timestamp: number;
}

export interface DbNoteRow {
  id: string;
  book_id: string;
  user_id: string;
  type: string;
  page_or_chapter: string | null;
  content: string;
  created_at: number;
}

export const supabaseDataService = {
  /**
   * Carrega todos os livros do usuário logado incluindo sessões e notas
   */
  async fetchUserBooks(userId: string): Promise<Book[]> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client não configurado');

    // 1. Buscar livros do usuário
    const { data: booksData, error: booksError } = await client
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (booksError) {
      console.error('[SupabaseData] Erro ao buscar livros:', booksError);
      throw booksError;
    }

    if (!booksData || booksData.length === 0) {
      return [];
    }

    const bookIds = booksData.map((b) => b.id);

    // 2. Buscar todas as sessões de leitura do usuário diretamente por user_id
    let sessionsData: any[] = [];
    const { data: sData, error: sessionsError } = await client
      .from('reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .limit(10000)
      .order('timestamp', { ascending: false });

    if (sessionsError) {
      console.warn('[SupabaseData] Aviso ao buscar sessões por user_id:', sessionsError);
    }

    if (sData && sData.length > 0) {
      sessionsData = sData;
    } else if (bookIds.length > 0) {
      // Fallback: se user_id não estava preenchido nas sessões legadas, busca pelos book_ids do usuário
      const { data: fallbackSessions } = await client
        .from('reading_sessions')
        .select('*')
        .in('book_id', bookIds)
        .limit(10000)
        .order('timestamp', { ascending: false });
      if (fallbackSessions && fallbackSessions.length > 0) {
        sessionsData = fallbackSessions;
      }
    }

    // 3. Buscar todas as notas associadas ao usuário diretamente por user_id
    let notesData: any[] = [];
    const { data: nData, error: notesError } = await client
      .from('book_notes')
      .select('*')
      .eq('user_id', userId)
      .limit(10000)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.warn('[SupabaseData] Aviso ao buscar notas por user_id:', notesError);
    }

    if (nData && nData.length > 0) {
      notesData = nData;
    } else if (bookIds.length > 0) {
      // Fallback: se user_id não estava preenchido nas notas legadas, busca pelos book_ids do usuário
      const { data: fallbackNotes } = await client
        .from('book_notes')
        .select('*')
        .in('book_id', bookIds)
        .limit(10000)
        .order('created_at', { ascending: false });
      if (fallbackNotes && fallbackNotes.length > 0) {
        notesData = fallbackNotes;
      }
    }

    // Mapear sessões e notas para os respectivos livros
    const sessionsByBook: Record<string, ReadingSession[]> = {};
    (sessionsData || []).forEach((row: DbSessionRow) => {
      if (!sessionsByBook[row.book_id]) sessionsByBook[row.book_id] = [];
      sessionsByBook[row.book_id].push({
        id: row.id,
        bookId: row.book_id,
        date: row.date,
        pagesRead: Number(row.pages_read) || 0,
        endingPage: row.ending_page !== null && row.ending_page !== undefined ? Number(row.ending_page) : 0,
        notes: row.notes ?? undefined,
        timestamp: Number(row.timestamp) || Date.now(),
      });
    });

    const notesByBook: Record<string, BookNote[]> = {};
    (notesData || []).forEach((row: DbNoteRow) => {
      if (!notesByBook[row.book_id]) notesByBook[row.book_id] = [];
      notesByBook[row.book_id].push({
        id: row.id,
        bookId: row.book_id,
        type: (row.type as BookNote['type']) || 'note',
        pageOrChapter: row.page_or_chapter ?? undefined,
        content: row.content,
        createdAt: Number(row.created_at) || Date.now(),
      });
    });

    return booksData.map((b: DbBookRow): Book => ({
      id: b.id,
      title: b.title,
      author: b.author,
      totalPages: Number(b.total_pages) || 0,
      currentPage: Number(b.current_page) || 0,
      category: b.category as Book['category'],
      tags: b.tags || [],
      status: b.status as Book['status'],
      startDate: b.start_date ?? undefined,
      targetDeadline: b.target_deadline ?? undefined,
      completedDate: b.completed_date ?? undefined,
      rating: b.rating !== null && b.rating !== undefined ? Number(b.rating) : undefined,
      review: b.review ?? undefined,
      accentColor: b.accent_color ?? undefined,
      sessions: sessionsByBook[b.id] || [],
      notes: notesByBook[b.id] || [],
      createdAt: Number(b.created_at) || Date.now(),
      updatedAt: Number(b.updated_at) || Date.now(),
    }));
  },

  /**
   * Salva ou atualiza um livro no Supabase vinculado ao usuário, incluindo sessões e notas
   */
  async upsertBook(userId: string, book: Book): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const row: DbBookRow = {
      id: book.id,
      user_id: userId,
      title: book.title || 'Sem título',
      author: book.author || 'Autor desconhecido',
      total_pages: Number(book.totalPages) || 0,
      current_page: Number(book.currentPage) || 0,
      category: book.category || 'Geral',
      tags: book.tags || [],
      status: book.status || 'none',
      start_date: book.startDate || null,
      target_deadline: book.targetDeadline || null,
      completed_date: book.completedDate || null,
      rating: book.rating !== null && book.rating !== undefined ? Number(book.rating) : null,
      review: book.review || null,
      accent_color: book.accentColor || null,
      created_at: Number(book.createdAt) || Date.now(),
      updated_at: Number(book.updatedAt) || Date.now(),
    };

    const { error } = await client.from('books').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[SupabaseData] Erro ao salvar livro:', error);
      throw error;
    }

    // Se o livro possui sessões atreladas, persiste-as com user_id
    if (book.sessions && book.sessions.length > 0) {
      const sessionRows = book.sessions.map((s) => ({
        id: String(s.id || `session-${book.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        book_id: book.id,
        user_id: userId,
        date: s.date || new Date().toISOString().split('T')[0],
        pages_read: Math.max(0, Number(s.pagesRead) || 0),
        ending_page: s.endingPage !== undefined && s.endingPage !== null ? Number(s.endingPage) : null,
        notes: s.notes || null,
        timestamp: Number(s.timestamp) || Date.now(),
      }));
      try {
        await client.from('reading_sessions').upsert(sessionRows, { onConflict: 'id' });
      } catch (err: any) {
        console.warn('[SupabaseData] Aviso ao salvar sessões atreladas ao livro:', err);
      }
    }

    // Se o livro possui notas atreladas, persiste-as com user_id
    if (book.notes && book.notes.length > 0) {
      const noteRows = book.notes.map((n) => ({
        id: String(n.id || `note-${book.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        book_id: book.id,
        user_id: userId,
        type: ['quote', 'reflection', 'note', 'insight'].includes(n.type) ? n.type : 'note',
        page_or_chapter: n.pageOrChapter || null,
        content: String(n.content || ''),
        created_at: Number(n.createdAt) || Date.now(),
      }));
      try {
        await client.from('book_notes').upsert(noteRows, { onConflict: 'id' });
      } catch (err: any) {
        console.warn('[SupabaseData] Aviso ao salvar notas atreladas ao livro:', err);
      }
    }
  },

  /**
   * Alias para salvar um livro
   */
  async saveBook(userId: string, book: Book): Promise<void> {
    return this.upsertBook(userId, book);
  },

  /**
   * Salva uma coleção de livros em lote no Supabase, incluindo todas as suas sessões e anotações
   */
  async bulkUpsertBooks(userId: string, books: Book[]): Promise<void> {
    const client = getSupabaseClient();
    if (!client || books.length === 0) return;

    // 1. Sanitiza e prepara linhas de livros
    const bookRows: DbBookRow[] = books.map((book) => ({
      id: String(book.id),
      user_id: userId,
      title: String(book.title || 'Sem título'),
      author: String(book.author || 'Autor desconhecido'),
      total_pages: Math.max(0, Number(book.totalPages) || 0),
      current_page: Math.max(0, Number(book.currentPage) || 0),
      category: String(book.category || 'Geral'),
      tags: Array.isArray(book.tags) ? book.tags : [],
      status: (['reading', 'to_read', 'completed', 'none'].includes(book.status) ? book.status : 'none'),
      start_date: book.startDate || null,
      target_deadline: book.targetDeadline || null,
      completed_date: book.completedDate || null,
      rating: book.rating !== undefined && book.rating !== null ? Number(book.rating) : null,
      review: book.review || null,
      accent_color: book.accentColor || 'amber',
      created_at: Number(book.createdAt) || Date.now(),
      updated_at: Number(book.updatedAt) || Date.now(),
    }));

    const CHUNK_SIZE = 50;
    for (let i = 0; i < bookRows.length; i += CHUNK_SIZE) {
      const chunk = bookRows.slice(i, i + CHUNK_SIZE);
      const { error } = await client.from('books').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error('[SupabaseData] Erro ao salvar livros em lote:', error);
        throw error;
      }
    }

    // 2. Extrai e persiste todas as sessões de leitura vinculadas aos livros
    const sessionRows: DbSessionRow[] = [];
    books.forEach((b) => {
      if (Array.isArray(b.sessions)) {
        b.sessions.forEach((s) => {
          sessionRows.push({
            id: String(s.id || `session-${b.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            book_id: b.id,
            user_id: userId,
            date: s.date || new Date().toISOString().split('T')[0],
            pages_read: Math.max(0, Number(s.pagesRead) || 0),
            ending_page: s.endingPage !== undefined && s.endingPage !== null ? Number(s.endingPage) : null,
            notes: s.notes || null,
            timestamp: Number(s.timestamp) || Date.now(),
          });
        });
      }
    });

    if (sessionRows.length > 0) {
      for (let i = 0; i < sessionRows.length; i += CHUNK_SIZE) {
        const chunk = sessionRows.slice(i, i + CHUNK_SIZE);
        const { error } = await client.from('reading_sessions').upsert(chunk, { onConflict: 'id' });
        if (error) {
          console.warn('[SupabaseData] Aviso ao salvar lote de sessões:', error);
        }
      }
    }

    // 3. Extrai e persiste todas as anotações vinculadas aos livros
    const noteRows: DbNoteRow[] = [];
    books.forEach((b) => {
      if (Array.isArray(b.notes)) {
        b.notes.forEach((n) => {
          noteRows.push({
            id: String(n.id || `note-${b.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            book_id: b.id,
            user_id: userId,
            type: ['quote', 'reflection', 'note', 'insight'].includes(n.type) ? n.type : 'note',
            page_or_chapter: n.pageOrChapter || null,
            content: String(n.content || ''),
            created_at: Number(n.createdAt) || Date.now(),
          });
        });
      }
    });

    if (noteRows.length > 0) {
      for (let i = 0; i < noteRows.length; i += CHUNK_SIZE) {
        const chunk = noteRows.slice(i, i + CHUNK_SIZE);
        const { error } = await client.from('book_notes').upsert(chunk, { onConflict: 'id' });
        if (error) {
          console.warn('[SupabaseData] Aviso ao salvar lote de notas:', error);
        }
      }
    }
  },

  /**
   * Sincroniza um dataset completo (livros, metas, categorias, lembretes) no Supabase
   */
  async syncFullLibrary(
    userId: string,
    data: {
      books: Book[];
      goal?: ReadingGoal;
      categories?: string[];
      reminder?: ReadingReminderSettings;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Cliente Supabase não configurado' };

    try {
      if (data.books && data.books.length > 0) {
        await this.bulkUpsertBooks(userId, data.books);
      }
      if (data.goal) {
        await this.saveUserGoal(userId, data.goal);
      }
      if (data.categories && data.categories.length > 0) {
        await this.saveUserCategories(userId, data.categories);
      }
      if (data.reminder) {
        await this.saveUserReminder(userId, data.reminder);
      }
      return { success: true };
    } catch (err: any) {
      console.error('[SupabaseData] Falha na sincronização completa da biblioteca:', err);
      return { success: false, error: err?.message || 'Falha na gravação em nuvem' };
    }
  },

  /**
   * Exclui um livro do usuário (as tabelas filhas usam ON DELETE CASCADE)
   */
  async deleteBook(userId: string, bookId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('user_id', userId);

    if (error) {
      console.error('[SupabaseData] Erro ao excluir livro:', error);
      throw error;
    }
  },

  /**
   * Adiciona ou atualiza uma nota de livro vinculada ao usuário
   */
  async saveBookNote(userId: string, bookId: string, note: BookNote): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const row: DbNoteRow = {
      id: note.id,
      book_id: bookId,
      user_id: userId,
      type: note.type || 'note',
      page_or_chapter: note.pageOrChapter || null,
      content: note.content,
      created_at: note.createdAt || Date.now(),
    };

    const { error } = await client.from('book_notes').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[SupabaseData] Erro ao salvar nota:', error);
      throw error;
    }
  },

  /**
   * Exclui uma nota do livro
   */
  async deleteBookNote(userId: string, noteId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('book_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) {
      console.error('[SupabaseData] Erro ao excluir nota:', error);
      throw error;
    }
  },

  /**
   * Salva uma sessão de leitura vinculada ao livro e usuário
   */
  async saveReadingSession(userId: string, session: ReadingSession): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const row: DbSessionRow = {
      id: session.id,
      book_id: session.bookId,
      user_id: userId,
      date: session.date,
      pages_read: session.pagesRead,
      ending_page: session.endingPage ?? null,
      notes: session.notes ?? null,
      timestamp: session.timestamp || Date.now(),
    };

    const { error } = await client.from('reading_sessions').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[SupabaseData] Erro ao salvar sessão:', error);
      throw error;
    }
  },

  /**
   * Exclui uma sessão de leitura no Supabase
   */
  async deleteReadingSession(userId: string, sessionId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('reading_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('[SupabaseData] Erro ao excluir sessão:', error);
      throw error;
    }
  },

  /**
   * Busca a meta anual de leitura do usuário
   */
  async fetchUserGoal(userId: string): Promise<ReadingGoal | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      year: data.year,
      targetBooks: data.target_books,
      targetPages: data.target_pages ?? undefined,
      dailyPageTarget: data.daily_page_target ?? 20,
    };
  },

  /**
   * Salva a meta anual do usuário
   */
  async saveUserGoal(userId: string, goal: ReadingGoal): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const row = {
      user_id: userId,
      year: goal.year,
      target_books: goal.targetBooks,
      target_pages: goal.targetPages || 4000,
      daily_page_target: goal.dailyPageTarget || 20,
      updated_at: Date.now(),
    };

    const { error } = await client.from('reading_goals').upsert(row, { onConflict: 'user_id' });
    if (error) {
      console.error('[SupabaseData] Erro ao salvar meta:', error);
      throw error;
    }
  },

  /**
   * Busca categorias customizadas do usuário
   */
  async fetchUserCategories(userId: string): Promise<string[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from('categories')
      .select('name')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((d) => d.name);
  },

  /**
   * Salva categorias do usuário no Supabase
   */
  async saveUserCategories(userId: string, categories: string[]): Promise<void> {
    const client = getSupabaseClient();
    if (!client || categories.length === 0) return;

    const rows = categories.map((name) => ({
      id: `cat-${userId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      user_id: userId,
      name,
      created_at: Date.now(),
    }));

    const { error } = await client.from('categories').upsert(rows, { onConflict: 'user_id,name' });
    if (error) {
      console.warn('[SupabaseData] Aviso ao salvar categorias:', error);
    }
  },

  /**
   * Busca preferências de lembrete do usuário
   */
  async fetchUserReminder(userId: string): Promise<ReadingReminderSettings | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('reading_reminders')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      enabled: data.enabled,
      time: data.time,
      frequency: data.frequency as ReadingReminderSettings['frequency'],
      browserPush: data.browser_push,
      soundEnabled: data.sound_enabled,
      customMessage: data.custom_message ?? undefined,
      lastNotifiedDate: data.last_notified_date ?? undefined,
    };
  },

  /**
   * Salva preferências de lembrete do usuário
   */
  async saveUserReminder(userId: string, reminder: ReadingReminderSettings): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const row = {
      user_id: userId,
      enabled: reminder.enabled,
      time: reminder.time,
      frequency: reminder.frequency,
      browser_push: reminder.browserPush,
      sound_enabled: reminder.soundEnabled,
      custom_message: reminder.customMessage || null,
      last_notified_date: reminder.lastNotifiedDate || null,
      updated_at: Date.now(),
    };

    const { error } = await client.from('reading_reminders').upsert(row, { onConflict: 'user_id' });
    if (error) {
      console.warn('[SupabaseData] Aviso ao salvar lembretes:', error);
    }
  },
};
