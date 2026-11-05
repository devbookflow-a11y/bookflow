import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  Plus,
  Play,
  Star,
  Quote,
  Sparkles,
  FileText,
  Lightbulb,
  Bookmark,
  Edit3,
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { formatDateBr } from '../utils/dateUtils';
import { calculateReadingProjection } from '../utils/readingCalculations';
import { NoteType } from '../types/book';

export const BookDetailModal: React.FC = () => {
  const {
    viewingBook,
    closeDetailModal,
    openEditBookModal,
    openLogModal,
    changeBookStatus,
    requestDeleteBook,
    setActiveBookId,
    setCurrentTab,
    addBookNote,
    deleteBookNote,
    openEditSessionModal,
  } = useBooks();

  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'notes'>('overview');
  const [noteContent, setNoteContent] = useState('');
  const [pageOrChapter, setPageOrChapter] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('quote');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  if (!viewingBook) return null;

  const projection = calculateReadingProjection(viewingBook);
  const notesList = viewingBook.notes || [];

  const handleStart = () => {
    changeBookStatus(viewingBook.id, 'reading');
    setActiveBookId(viewingBook.id);
    setCurrentTab('reading');
    closeDetailModal();
  };

  const handleComplete = () => {
    changeBookStatus(viewingBook.id, 'completed');
    closeDetailModal();
  };

  const handleDelete = () => {
    requestDeleteBook(viewingBook);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    addBookNote(viewingBook.id, {
      bookId: viewingBook.id,
      content: noteContent.trim(),
      pageOrChapter: pageOrChapter.trim() || undefined,
      type: noteType,
    });

    setNoteContent('');
    setPageOrChapter('');
    setIsSubmittingNote(false);
  };

  const getTypeLabel = (type: NoteType) => {
    switch (type) {
      case 'quote':
        return 'Citação';
      case 'reflection':
        return 'Reflexão';
      case 'insight':
        return 'Insight';
      case 'note':
      default:
        return 'Anotação';
    }
  };

  const getTypeIcon = (type: NoteType) => {
    switch (type) {
      case 'quote':
        return <Quote className="w-3.5 h-3.5 text-amber-500" />;
      case 'reflection':
        return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
      case 'insight':
        return <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />;
      case 'note':
      default:
        return <FileText className="w-3.5 h-3.5 text-sky-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {viewingBook.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">
              {viewingBook.status === 'reading'
                ? 'Lendo Atualmente'
                : viewingBook.status === 'to_read'
                ? 'Pretendo Ler'
                : 'Já Lido'}
            </span>
          </div>
          <button
            onClick={closeDetailModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Book Title Summary */}
        <div className="px-6 pt-5 pb-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {viewingBook.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            por <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingBook.author}</span>
          </p>

          {/* Tags */}
          {viewingBook.tags && viewingBook.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2.5">
              <span className="text-slate-400">Tags:</span>
              {viewingBook.tags.map((tag, idx) => (
                <React.Fragment key={tag}>
                  {idx > 0 && <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>}
                  <span className="font-medium text-slate-700 dark:text-slate-300">#{tag}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Modal Navigation Tabs (Zero-pill, crisp layout) */}
          <div className="flex items-center gap-2 mt-5 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveModalTab('overview')}
              className={`pb-2.5 px-1 text-xs sm:text-sm font-semibold transition-colors relative ${
                activeModalTab === 'overview'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Visão Geral & Progresso
              {activeModalTab === 'overview' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => setActiveModalTab('notes')}
              className={`pb-2.5 px-1 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 relative ${
                activeModalTab === 'notes'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <span>Notas & Citações</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                {notesList.length}
              </span>
              {activeModalTab === 'notes' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Overview & Progress */}
        {activeModalTab === 'overview' && (
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Progress Block */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Progresso
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500">{viewingBook.currentPage} / {viewingBook.totalPages} págs</span>
                  <span>·</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{projection.percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${projection.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{projection.pagesRemaining} páginas restantes</span>
                {viewingBook.targetDeadline && (
                  <span>Prazo: {formatDateBr(viewingBook.targetDeadline)}</span>
                )}
              </div>
            </div>

            {/* Smart Alert or Status */}
            {projection.isDelayed && viewingBook.status === 'reading' && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Atraso Estimado de {projection.delayDays} dias</strong>
                  <span>
                    Ritmo necessário de {projection.requiredPaceForDeadline} págs/dia para concluir até {formatDateBr(viewingBook.targetDeadline)}.
                  </span>
                </div>
              </div>
            )}

            {/* Rating & Review */}
            {viewingBook.rating && (
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Avaliação do Leitor
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= viewingBook.rating!
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {viewingBook.review && (
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Resenha & Notas Pessoais
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 leading-relaxed italic">
                  "{viewingBook.review}"
                </p>
              </div>
            )}

            {/* Session history */}
            {viewingBook.sessions && viewingBook.sessions.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Histórico de Leituras ({viewingBook.sessions.length} sessões)
                </span>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  {viewingBook.sessions.map((s) => (
                    <div key={s.id} className="p-2.5 px-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-slate-400 tabular-nums">
                          {formatDateBr(s.date)}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                          +{s.pagesRead} págs (até {s.endingPage})
                        </span>
                        {s.notes && (
                          <span className="text-slate-500 italic max-w-[140px] truncate hidden sm:inline">
                            "{s.notes}"
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditSessionModal(viewingBook, s)}
                        className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                        title="Editar sessão"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium hidden sm:inline">Editar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Notes & Quotes System (Diário de Leitura) */}
        {activeModalTab === 'notes' && (
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Quick Add Form */}
            <form
              onSubmit={handleAddNote}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  Nova Citação ou Anotação
                </span>
                <span className="text-[11px] text-slate-400">Diário do Livro</span>
              </div>

              {/* Type Selector Buttons & Page Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Tipo de Registro
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800">
                    {(['quote', 'reflection', 'insight', 'note'] as NoteType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNoteType(type)}
                        className={`py-1 text-[11px] font-semibold rounded-lg transition-colors capitalize ${
                          noteType === type
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {getTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Página ou Capítulo (opcional)
                  </label>
                  <input
                    type="text"
                    value={pageOrChapter}
                    onChange={(e) => setPageOrChapter(e.target.value)}
                    placeholder="Ex: Pág. 42 ou Cap. 3"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Texto, Citação ou Reflexão
                </label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder={
                    noteType === 'quote'
                      ? 'Escreva a citação ou trecho memorável do livro...'
                      : noteType === 'reflection'
                      ? 'Qual reflexão pessoal esta parte do livro despertou em você?'
                      : 'Registre seu insight ou resumo desta passagem...'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteContent.trim() || isSubmittingNote}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Salvar no Diário</span>
                </button>
              </div>
            </form>

            {/* List of Saved Notes Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Anotações Salvas ({notesList.length})
                </span>
                <span className="text-[11px]">Ordenadas por mais recentes</span>
              </div>

              {notesList.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Quote className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nenhuma citação ou anotação registrada ainda.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Use o campo acima para guardar frases marcantes, conceitos aprendidos e reflexões enquanto realiza a leitura.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {notesList.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between group hover:border-amber-400/50 dark:hover:border-amber-500/40 transition-colors"
                    >
                      <div>
                        {/* Top Meta info */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            {getTypeIcon(note.type)}
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                              {getTypeLabel(note.type)}
                            </span>
                            {note.pageOrChapter && (
                              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 font-mono px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40">
                                {note.pageOrChapter}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            <button
                              onClick={() => deleteBookNote(viewingBook.id, note.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              title="Excluir nota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Note Body Text */}
                        <div
                          className={`text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed ${
                            note.type === 'quote'
                              ? 'italic border-l-2 border-amber-500 pl-3 py-0.5'
                              : ''
                          }`}
                        >
                          {note.type === 'quote' ? `"${note.content}"` : note.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeDetailModal();
                openEditBookModal(viewingBook);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Livro</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {viewingBook.status === 'to_read' && (
              <button
                onClick={handleStart}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Iniciar Leitura</span>
              </button>
            )}
            {viewingBook.status === 'reading' && (
              <>
                <button
                  onClick={() => {
                    closeDetailModal();
                    openLogModal(viewingBook);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Páginas</span>
                </button>
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar como Lido</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
