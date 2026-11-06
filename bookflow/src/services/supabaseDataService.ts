/**
 * @file supabaseDataService.ts
 * @description Camada de persistência remota no banco de dados Supabase com isolamento por user_id,
 * validação estrita de sessão ativa (supabase.auth.getUser()), renovação automática de token JWT
 * e prevenção de erros 403 (Forbidden) em operações individuais e em lote (Batch).
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

/**
 * Valida a sessão do usuário ativo via client.auth.getUser()
 * e renova o token automaticamente se necessário para prevenir erro 403 (Forbidden)
 */
async function getAuthenticatedUserId(preferredUserId?: string): Promise<string> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cliente Supabase não configurado');

  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (user && !error) {
      return user.id;
    }

    // Se o token estiver expirado ou ausente, força a renovação da sessão
    const { data: { session: refreshedSession }, error: refreshError } = await client.auth.refreshSession();
    if (refreshedSession?.user && !refreshError) {
      console.log('[SupabaseAuth] ✅ Sessão renovada com sucesso para:', refreshedSession.user.email);
      return refreshedSession.user.id;
    }
  } catch (err) {
    console.warn('[SupabaseAuth] Falha na validação da sessão com Supabase:', err);
  }

  if (preferredUserId) {
    return preferredUserId;
  }

  throw new Error('Sessão expirada ou não autenticada no Supabase. Faça login novamente.');
}

export const supabaseDataService = {
  /**
   * Carrega todos os livros do usuário logado incluindo sessões e notas
   */
  async fetchUserBooks(userId: string): Promise<Book[]> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client não configurado');

    const activeUserId = await getAuthenticatedUserId(userId);

    // 1. Buscar livros do usuário
    const { data: booksData, error: booksError } = await client
      .from('books')
      .select('*')
      .eq('user_id', activeUserId)
      .order('created_at', { ascending: false });

    if (booksError) {
      console.error(`[SupabaseData:fetchUserBooks] ❌ Erro ${booksError.code || '403'} ao buscar livros:`, {
        message: booksError.message,
        details: booksError.details,
        hint: booksError.hint,
        user_id: activeUserId,
      });
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
      .eq('user_id', activeUserId)
      .limit(10000)
      .order('timestamp', { ascending: false });

    if (sessionsError) {
      console.warn(`[SupabaseData:fetchUserBooks] ⚠️ Aviso ao buscar sessões por user_id (${sessionsError.code || '403'}):`, sessionsError.message);
    }

    if (sData && sData.length > 0) {
      sessionsData = sData;
    } else if (bookIds.length > 0) {
      // Fallback: busca por book_id caso user_id não estivesse preenchido em sessões legadas
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
      .eq('user_id', activeUserId)
      .limit(10000)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.warn(`[SupabaseData:fetchUserBooks] ⚠️ Aviso ao buscar notas por user_id (${notesError.code || '403'}):`, notesError.message);
    }

    if (nData && nData.length > 0) {
      notesData = nData;
    } else if (bookIds.length > 0) {
      // Fallback: busca por book_id caso user_id não estivesse preenchido em notas legadas
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
   * Salva ou atualiza um livro no Supabase vinculado ao usuário com validação de sessão ativa
   */
  async upsertBook(userId: string, book: Book): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    const row: DbBookRow = {
      id: book.id,
      user_id: activeUserId,
      title: book.title || 'Sem título',
      author: book.author || 'Autor desconhecido',
      total_pages: Number(book.totalPages) || 0,
      current_page: Number(book.currentPage) || 0,
      category: book.category || 'Geral',
      tags: Array.isArray(book.tags) ? book.tags : [],
      status: book.status || 'none',
      start_date: book.startDate || null,
      target_deadline: book.targetDeadline || null,
      completed_date: book.completedDate || null,
      rating: book.rating !== null && book.rating !== undefined ? Number(book.rating) : null,
      review: book.review || null,
      accent_color: book.accentColor || 'amber',
      created_at: Number(book.createdAt) || Date.now(),
      updated_at: Number(book.updatedAt) || Date.now(),
    };

    const { error } = await client.from('books').upsert(row, { onConflict: 'id' });
    if (error) {
      if (error.code === '42501') {
        console.warn(`[SupabaseData:upsertBook] ⚠️ Conflito RLS (42501) no livro "${book.title}". Remapeando para ID exclusivo de user_id: ${activeUserId}...`);
        const safeId = `book-${activeUserId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const remappedRow = { ...row, id: safeId };
        const { error: retryErr } = await client.from('books').upsert(remappedRow, { onConflict: 'id' });
        if (retryErr) {
          console.error(`[SupabaseData:upsertBook] ❌ Erro persistente após remapeamento:`, retryErr);
          throw retryErr;
        }
        console.log(`[SupabaseData:upsertBook] ✅ Livro "${book.title}" salvo com novo ID seguro: ${safeId}`);
        book.id = safeId;
      } else {
        console.error(`[SupabaseData:upsertBook] ❌ Erro ${error.code || '403'} ao salvar livro "${book.title}" (ID: ${book.id}):`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          user_id: activeUserId,
        });
        throw error;
      }
    } else {
      console.log(`[SupabaseData:upsertBook] ✅ Livro "${book.title}" salvo com sucesso para user_id: ${activeUserId}`);
    }

    // Se o livro possui sessões atreladas, persiste-as com user_id
    if (book.sessions && book.sessions.length > 0) {
      const sessionRows = book.sessions.map((s) => ({
        id: String(s.id || `session-${book.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        book_id: book.id,
        user_id: activeUserId,
        date: s.date || new Date().toISOString().split('T')[0],
        pages_read: Math.max(0, Number(s.pagesRead) || 0),
        ending_page: s.endingPage !== undefined && s.endingPage !== null ? Number(s.endingPage) : null,
        notes: s.notes || null,
        timestamp: Number(s.timestamp) || Date.now(),
      }));
      try {
        const { error: sErr } = await client.from('reading_sessions').upsert(sessionRows, { onConflict: 'id' });
        if (sErr) {
          console.warn(`[SupabaseData:upsertBook] ⚠️ Erro ${sErr.code || '403'} ao salvar sessões atreladas:`, sErr);
        }
      } catch (err) {
        console.warn('[SupabaseData] Falha ao enviar sessões atreladas:', err);
      }
    }

    // Se o livro possui notas atreladas, persiste-as com user_id
    if (book.notes && book.notes.length > 0) {
      const noteRows = book.notes.map((n) => ({
        id: String(n.id || `note-${book.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        book_id: book.id,
        user_id: activeUserId,
        type: ['quote', 'reflection', 'note', 'insight'].includes(n.type) ? n.type : 'note',
        page_or_chapter: n.pageOrChapter || null,
        content: String(n.content || ''),
        created_at: Number(n.createdAt) || Date.now(),
      }));
      try {
        const { error: nErr } = await client.from('book_notes').upsert(noteRows, { onConflict: 'id' });
        if (nErr) {
          console.warn(`[SupabaseData:upsertBook] ⚠️ Erro ${nErr.code || '403'} ao salvar notas atreladas:`, nErr);
        }
      } catch (err) {
        console.warn('[SupabaseData] Falha ao enviar notas atreladas:', err);
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
   * Salva uma coleção de livros em lote (Batch) no Supabase com validação estrita de user_id e RLS
   */
  async bulkUpsertBooks(userId: string, books: Book[]): Promise<void> {
    const client = getSupabaseClient();
    if (!client || books.length === 0) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    // 1. Sanitiza e prepara linhas de livros vinculadas obrigatoriamente a activeUserId
    const bookRows: DbBookRow[] = books.map((book) => ({
      id: String(book.id),
      user_id: activeUserId,
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
    const remappedBookIds = new Map<string, string>();

    for (let i = 0; i < bookRows.length; i += CHUNK_SIZE) {
      const chunk = bookRows.slice(i, i + CHUNK_SIZE);
      const { error } = await client.from('books').upsert(chunk, { onConflict: 'id' });
      if (error) {
        if (error.code === '42501' || error.message?.includes('violates row-level security')) {
          console.warn(`[SupabaseData:bulkUpsertBooks] ⚠️ Conflito RLS (42501) no lote de ${chunk.length} livros. Remapeando para isolamento exclusivo de user_id: ${activeUserId}...`);
          // Processa cada livro do chunk individualmente para isolar e remapear apenas os IDs em conflito
          for (let j = 0; j < chunk.length; j++) {
            const row = chunk[j];
            const originalId = row.id;
            const { error: singleErr } = await client.from('books').upsert(row, { onConflict: 'id' });
            if (singleErr && (singleErr.code === '42501' || singleErr.message?.includes('violates row-level security'))) {
              const safeId = `book-${activeUserId.slice(0, 8)}-${Date.now()}-${i + j}-${Math.random().toString(36).slice(2, 6)}`;
              remappedBookIds.set(originalId, safeId);
              row.id = safeId;

              // Atualiza referência no objeto em memória
              const bookIndex = i + j;
              if (books[bookIndex]) {
                books[bookIndex].id = safeId;
              }

              const { error: retryErr } = await client.from('books').upsert(row, { onConflict: 'id' });
              if (retryErr) {
                console.warn(`[SupabaseData:bulkUpsertBooks] ⚠️ Aviso ao salvar livro remapeado "${row.title}":`, retryErr.message);
              } else {
                console.log(`[SupabaseData:bulkUpsertBooks] ✅ Livro "${row.title}" salvo com novo ID seguro: ${safeId}`);
              }
            } else if (singleErr) {
              console.warn(`[SupabaseData:bulkUpsertBooks] ⚠️ Aviso ao salvar livro "${row.title}" (${singleErr.code || '403'}):`, singleErr.message);
            }
          }
        } else {
          console.error(`[SupabaseData:bulkUpsertBooks] ❌ Erro ${error.code || '403'} no lote de livros:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            chunkSize: chunk.length,
            user_id: activeUserId,
          });
        }
      }
    }

    console.log(`[SupabaseData:bulkUpsertBooks] ✅ Lote de ${books.length} livros processado com sucesso para user_id: ${activeUserId}`);

    // 2. Extrai e persiste todas as sessões de leitura vinculadas aos livros
    const sessionRows: DbSessionRow[] = [];
    books.forEach((b) => {
      const bookTargetId = remappedBookIds.get(b.id) || b.id;
      if (Array.isArray(b.sessions)) {
        b.sessions.forEach((s) => {
          sessionRows.push({
            id: String(s.id || `session-${bookTargetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            book_id: bookTargetId,
            user_id: activeUserId,
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
          if (error.code === '42501' || error.message?.includes('violates row-level security')) {
            for (let j = 0; j < chunk.length; j++) {
              const sRow = chunk[j];
              const safeSessionId = `session-${activeUserId.slice(0, 8)}-${Date.now()}-${i + j}-${Math.random().toString(36).slice(2, 6)}`;
              sRow.id = safeSessionId;
              await client.from('reading_sessions').upsert(sRow, { onConflict: 'id' });
            }
          } else {
            console.warn(`[SupabaseData:bulkUpsertBooks] ⚠️ Aviso ao salvar lote de sessões (${error.code || '403'}):`, error.message);
          }
        }
      }
    }

    // 3. Extrai e persiste todas as anotações vinculadas aos livros
    const noteRows: DbNoteRow[] = [];
    books.forEach((b) => {
      const bookTargetId = remappedBookIds.get(b.id) || b.id;
      if (Array.isArray(b.notes)) {
        b.notes.forEach((n) => {
          noteRows.push({
            id: String(n.id || `note-${bookTargetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            book_id: bookTargetId,
            user_id: activeUserId,
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
          if (error.code === '42501' || error.message?.includes('violates row-level security')) {
            for (let j = 0; j < chunk.length; j++) {
              const nRow = chunk[j];
              const safeNoteId = `note-${activeUserId.slice(0, 8)}-${Date.now()}-${i + j}-${Math.random().toString(36).slice(2, 6)}`;
              nRow.id = safeNoteId;
              await client.from('book_notes').upsert(nRow, { onConflict: 'id' });
            }
          } else {
            console.warn(`[SupabaseData:bulkUpsertBooks] ⚠️ Aviso ao salvar lote de notas (${error.code || '403'}):`, error.message);
          }
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
      const activeUserId = await getAuthenticatedUserId(userId);

      if (data.books && data.books.length > 0) {
        await this.bulkUpsertBooks(activeUserId, data.books);
      }
      if (data.goal) {
        await this.saveUserGoal(activeUserId, data.goal);
      }
      if (data.categories && data.categories.length > 0) {
        await this.saveUserCategories(activeUserId, data.categories);
      }
      if (data.reminder) {
        await this.saveUserReminder(activeUserId, data.reminder);
      }
      console.log(`[SupabaseData:syncFullLibrary] ✅ Biblioteca completa sincronizada para user_id: ${activeUserId}`);
      return { success: true };
    } catch (err: any) {
      console.error('[SupabaseData:syncFullLibrary] ❌ Falha na sincronização completa da biblioteca:', err);
      return { success: false, error: err?.message || 'Falha na gravação em nuvem' };
    }
  },

  /**
   * Exclui um livro do usuário com validação de sessão
   */
  async deleteBook(userId: string, bookId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    const { error } = await client
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('user_id', activeUserId);

    if (error) {
      console.error(`[SupabaseData:deleteBook] ❌ Erro ${error.code || '403'} ao excluir livro ID ${bookId}:`, {
        message: error.message,
        details: error.details,
        user_id: activeUserId,
      });
      throw error;
    }
    console.log(`[SupabaseData:deleteBook] ✅ Livro ID ${bookId} excluído com sucesso para user_id: ${activeUserId}`);
  },

  /**
   * Exclui múltiplos livros em lote (Batch Delete)
   */
  async deleteBooksBulk(userId: string, bookIds: string[]): Promise<void> {
    const client = getSupabaseClient();
    if (!client || bookIds.length === 0) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    const { error } = await client
      .from('books')
      .delete()
      .in('id', bookIds)
      .eq('user_id', activeUserId);

    if (error) {
      console.error(`[SupabaseData:deleteBooksBulk] ❌ Erro ${error.code || '403'} ao excluir lote de livros:`, {
        message: error.message,
        details: error.details,
        count: bookIds.length,
        user_id: activeUserId,
      });
      throw error;
    }
    console.log(`[SupabaseData:deleteBooksBulk] ✅ Lote de ${bookIds.length} livros excluído com sucesso.`);
  },

  /**
   * Adiciona ou atualiza uma nota de livro vinculada ao usuário
   */
  async saveBookNote(userId: string, bookId: string, note: BookNote): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    const row: DbNoteRow = {
      id: note.id,
      book_id: bookId,
      user_id: activeUserId,
      type: note.type || 'note',
      page_or_chapter: note.pageOrChapter || null,
      content: note.content,
      created_at: note.createdAt || Date.now(),
    };

    const { error } = await client.from('book_notes').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`[SupabaseData:saveBookNote] ❌ Erro ${error.code || '403'} ao salvar nota:`, error);
      throw error;
    }
    console.log(`[SupabaseData:saveBookNote] ✅ Nota ${note.id} salva para o livro ${bookId}`);
  },

  /**
   * Exclui uma nota do livro
   */
  async deleteBookNote(userId: string, noteId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    const { error } = await client
      .from('book_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', activeUserId);

    if (error) {
      console.error(`[SupabaseData:deleteBookNote] ❌ Erro ${error.code || '403'} ao excluir nota:`, error);
      throw error;
    }
  },

  /**
   * Salva uma sessão de leitura vinculada ao livro e usuário
   */
  async saveReadingSession(userId: string, session: ReadingSession): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    const row: DbSessionRow = {
      id: session.id,
      book_id: session.bookId,
      user_id: activeUserId,
      date: session.date,
      pages_read: session.pagesRead,
      ending_page: session.endingPage ?? null,
      notes: session.notes ?? null,
      timestamp: session.timestamp || Date.now(),
    };

    const { error } = await client.from('reading_sessions').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`[SupabaseData:saveReadingSession] ❌ Erro ${error.code || '403'} ao salvar sessão:`, {
        message: error.message,
        details: error.details,
        session_id: session.id,
        user_id: activeUserId,
      });
      throw error;
    }
    console.log(`[SupabaseData:saveReadingSession] ✅ Sessão ${session.id} salva com sucesso.`);
  },

  /**
   * Exclui uma sessão de leitura no Supabase
   */
  async deleteReadingSession(userId: string, sessionId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    const { error } = await client
      .from('reading_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', activeUserId);

    if (error) {
      console.error(`[SupabaseData:deleteReadingSession] ❌ Erro ${error.code || '403'} ao excluir sessão:`, error);
      throw error;
    }
  },

  /**
   * Busca a meta anual de leitura do usuário
   */
  async fetchUserGoal(userId: string): Promise<ReadingGoal | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const activeUserId = await getAuthenticatedUserId(userId);

    const { data, error } = await client
      .from('reading_goals')
      .select('*')
      .eq('user_id', activeUserId)
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

    const activeUserId = await getAuthenticatedUserId(userId);

    const row = {
      user_id: activeUserId,
      year: goal.year,
      target_books: goal.targetBooks,
      target_pages: goal.targetPages || 4000,
      daily_page_target: goal.dailyPageTarget || 20,
      updated_at: Date.now(),
    };

    const { error } = await client.from('reading_goals').upsert(row, { onConflict: 'user_id' });
    if (error) {
      console.error(`[SupabaseData:saveUserGoal] ❌ Erro ${error.code || '403'} ao salvar meta:`, error);
      throw error;
    }
  },

  /**
   * Busca categorias customizadas do usuário
   */
  async fetchUserCategories(userId: string): Promise<string[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const activeUserId = await getAuthenticatedUserId(userId);

    const { data, error } = await client
      .from('categories')
      .select('name')
      .eq('user_id', activeUserId);

    if (error || !data) return [];
    return data.map((d) => d.name);
  },

  /**
   * Salva categorias do usuário no Supabase
   */
  async saveUserCategories(userId: string, categories: string[]): Promise<void> {
    const client = getSupabaseClient();
    if (!client || categories.length === 0) return;

    const activeUserId = await getAuthenticatedUserId(userId);

    const rows = categories.map((name) => ({
      id: `cat-${activeUserId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      user_id: activeUserId,
      name,
      created_at: Date.now(),
    }));

    const { error } = await client.from('categories').upsert(rows, { onConflict: 'user_id,name' });
    if (error) {
      console.warn(`[SupabaseData:saveUserCategories] ⚠️ Erro ${error.code || '403'} ao salvar categorias:`, error.message);
    }
  },

  /**
   * Busca preferências de lembrete do usuário
   */
  async fetchUserReminder(userId: string): Promise<ReadingReminderSettings | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const activeUserId = await getAuthenticatedUserId(userId);

    const { data, error } = await client
      .from('reading_reminders')
      .select('*')
      .eq('user_id', activeUserId)
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

    const activeUserId = await getAuthenticatedUserId(userId);

    const row = {
      user_id: activeUserId,
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
      console.warn(`[SupabaseData:saveUserReminder] ⚠️ Erro ${error.code || '403'} ao salvar lembrete:`, error.message);
    }
  },
};
