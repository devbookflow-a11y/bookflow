import React, { useState, useEffect } from 'react';
import { X, Plus, Star, BookOpen, Calendar, Tag, Layers, Check, Bookmark } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { Book, BookCategory, BookStatus } from '../types/book';
import { getTodayString, addDaysToDate } from '../utils/dateUtils';

const SUGGESTED_TAGS = ['Clássico', 'Meta 2026', 'Estudos', 'Faculdade', 'Favorito', 'Releitura', 'Ficção Científica', 'Produtividade'];

export const BookFormModal: React.FC = () => {
  const {
    isAddModalOpen,
    closeBookModal,
    editingBook,
    presetStatusForNew,
    addBook,
    updateBook,
    categories,
    addCategory,
    openCategoryModal,
  } = useBooks();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState<number | ''>(0);
  const [status, setStatus] = useState<BookStatus>('reading');
  const [category, setCategory] = useState<BookCategory>('Ficção');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState('');

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setTotalPages(editingBook.totalPages);
      setCurrentPage(editingBook.currentPage);
      setStatus(editingBook.status);
      setCategory(editingBook.category);
      setTags(editingBook.tags || []);
      setStartDate(editingBook.startDate || '');
      setTargetDeadline(editingBook.targetDeadline || '');
      setCompletedDate(editingBook.completedDate || '');
      setRating(editingBook.rating || 5);
      setReview(editingBook.review || '');
    } else {
      // New book defaults - Se presetStatusForNew não for passado (ex: na Biblioteca Completa), status inicia como 'none' (opcional)
      const initialStatus: BookStatus = presetStatusForNew || 'none';
      setTitle('');
      setAuthor('');
      setTotalPages('');
      setCurrentPage(0);
      setStatus(initialStatus);
      setCategory('Ficção');
      setTags([]);
      setTagInput('');
      setStartDate(initialStatus === 'reading' ? getTodayString() : '');
      setTargetDeadline(initialStatus === 'reading' ? addDaysToDate(getTodayString(), 30) : '');
      setCompletedDate('');
      setRating(5);
      setReview('');
    }
  }, [editingBook, presetStatusForNew, isAddModalOpen]);

  if (!isAddModalOpen) return null;

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !totalPages || Number(totalPages) <= 0) {
      alert('Por favor, preencha o título, autor e um número válido de páginas.');
      return;
    }

    const total = Number(totalPages);
    let current = Number(currentPage) || 0;
    if (status === 'completed') {
      current = total;
    } else if (status === 'to_read') {
      current = 0;
    }

    const bookPayload = {
      title: title.trim(),
      author: author.trim(),
      totalPages: total,
      currentPage: Math.min(total, Math.max(0, current)),
      status,
      category,
      tags,
      startDate: startDate || undefined,
      targetDeadline: targetDeadline || undefined,
      completedDate: status === 'completed' ? (completedDate || getTodayString()) : undefined,
      rating: status === 'completed' ? rating : undefined,
      review: status === 'completed' && review.trim() ? review.trim() : undefined,
    };

    if (editingBook) {
      updateBook(editingBook.id, bookPayload);
    } else {
      addBook(bookPayload);
    }

    closeBookModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 overflow-y-auto">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {editingBook ? 'Editar Livro' : 'Adicionar Novo Livro'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editingBook ? 'Atualize as informações e metas da obra' : 'Cadastre uma nova obra para gerenciar suas metas'}
            </p>
          </div>
          <button
            onClick={closeBookModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status selector (Flexível e Opcional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Estante ou Status (Opcional)
              </label>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Catálogo Central
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('none')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                  status === 'none'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-500 dark:text-white shadow-2xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
                title="Cadastrar livremente no catálogo geral sem definir uma estante agora"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Apenas Catálogo</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus(status === 'reading' ? 'none' : 'reading')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                  status === 'reading'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-600 shadow-2xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-800'
                }`}
                title="Cadastrar no monitor de leitura ativo"
              >
                <span className={`w-2 h-2 rounded-full ${status === 'reading' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>Lendo Agora</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus(status === 'to_read' ? 'none' : 'to_read')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                  status === 'to_read'
                    ? 'bg-sky-50 text-sky-800 border-sky-500 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-600 shadow-2xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-300 dark:hover:border-sky-800'
                }`}
                title="Cadastrar na lista de desejos"
              >
                <span className={`w-2 h-2 rounded-full ${status === 'to_read' ? 'bg-sky-500' : 'bg-slate-400'}`} />
                <span>Pretendo Ler</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus(status === 'completed' ? 'none' : 'completed')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                  status === 'completed'
                    ? 'bg-purple-50 text-purple-800 border-purple-500 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-600 shadow-2xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-800'
                }`}
                title="Cadastrar como leitura concluída"
              >
                <span className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-purple-500' : 'bg-slate-400'}`} />
                <span>Já Lido</span>
              </button>
            </div>

            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {status === 'none'
                ? 'A obra será cadastrada livremente na Biblioteca Completa. Você poderá movê-la para uma estante específica quando desejar.'
                : 'A obra será catalogada na Biblioteca Completa e sincronizada automaticamente com a estante de status selecionada.'}
            </p>
          </div>

          {/* Title and Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Título do Livro *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: O Homem que Calculava"
                className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Autor(a) *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Malba Tahan"
                className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Total pages & Current page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Total de Páginas *
              </label>
              <input
                type="number"
                required
                min="1"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="Ex: 312"
                className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
              />
            </div>

            {status === 'reading' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Página Atual
                </label>
                <input
                  type="number"
                  min="0"
                  max={typeof totalPages === 'number' ? totalPages : undefined}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="Ex: 50"
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoria Principal (Gênero)
              </label>
              <div className="flex items-center gap-2">
                {!isAddingCategory ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Nova Categoria</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCatInput('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {isAddingCategory && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 mb-2 animate-fade-in">
                <input
                  type="text"
                  autoFocus
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="Nome da nova categoria (ex: Quadrinhos, Poesia)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newCatInput.trim()) {
                        addCategory(newCatInput.trim());
                        setCategory(newCatInput.trim());
                        setNewCatInput('');
                        setIsAddingCategory(false);
                      }
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCatInput.trim()) {
                      addCategory(newCatInput.trim());
                      setCategory(newCatInput.trim());
                      setNewCatInput('');
                      setIsAddingCategory(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 flex items-center gap-1 shrink-0"
                >
                  <Check className="w-3 h-3" />
                  <span>Salvar</span>
                </button>
              </div>
            )}

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Etiquetas / Tags Livres
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[42px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder={tags.length === 0 ? "Digite a tag e pressione Enter..." : "Adicionar tag..."}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none px-1"
              />
            </div>
            {/* Suggested quick tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Sugestões:</span>
              {SUGGESTED_TAGS.map((stag) => (
                <button
                  key={stag}
                  type="button"
                  onClick={() => handleAddTag(stag)}
                  className="text-[11px] text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 font-medium cursor-pointer"
                >
                  +{stag}
                </button>
              ))}
            </div>
          </div>

          {/* Dates: Start Date & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Data de Início (Prevista ou Real)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Data de Término Desejada (Deadline)
              </label>
              <input
                type="date"
                value={targetDeadline}
                onChange={(e) => setTargetDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Completed Details (if completed) */}
          {status === 'completed' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Data de Conclusão
                  </label>
                  <input
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Avaliação
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Resenha / Comentários da Obra
                </label>
                <textarea
                  rows={2}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Escreva suas impressões sobre o livro..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeBookModal}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-amber-600 dark:hover:bg-amber-500 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              {editingBook ? 'Salvar Alterações' : 'Cadastrar Livro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
