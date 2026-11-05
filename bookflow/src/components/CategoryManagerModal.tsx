import React, { useState, useMemo } from 'react';
import { X, Plus, Layers, Trash2, Check, AlertCircle, Pencil, ArrowDownAZ, Info } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { DEFAULT_CATEGORIES } from '../context/BookContext';
import { getCategoryColor } from '../utils/dashboardMetrics';

const POPULAR_SUGGESTIONS = [
  'Arte, Design & Música',
  'Direito & Legislação',
  'Espiritualidade & Religião',
  'Fantasia & Sci-Fi',
  'Poesia',
  'Psicologia & Psicanálise',
  'Quadrinhos & Mangás',
  'Saúde & Medicina',
];

export const CategoryManagerModal: React.FC = () => {
  const {
    isCategoryModalOpen,
    closeCategoryModal,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    books,
  } = useBooks();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inline editing state
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Always keep categories sorted alphabetically
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );
  }, [categories]);

  if (!isCategoryModalOpen) return null;

  // Count books per category
  const booksCountByCat: Record<string, number> = {};
  books.forEach((b) => {
    booksCountByCat[b.category] = (booksCountByCat[b.category] || 0) + 1;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const name = newCategoryName.trim();
    if (!name) {
      setErrorMsg('Por favor, informe o nome da categoria.');
      return;
    }

    const ok = addCategory(name);
    if (!ok) {
      setErrorMsg(`A categoria "${name}" já existe na lista.`);
      return;
    }

    setNewCategoryName('');
    setSuccessMsg(`Categoria "${name}" adicionada com sucesso!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleQuickAdd = (suggestion: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const ok = addCategory(suggestion);
    if (!ok) {
      setErrorMsg(`A categoria "${suggestion}" já existe.`);
      return;
    }
    setSuccessMsg(`Categoria "${suggestion}" adicionada com sucesso!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleStartEdit = (catName: string) => {
    setEditingCat(catName);
    setEditValue(catName);
    setEditError(null);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingCat(null);
    setEditValue('');
    setEditError(null);
  };

  const handleSaveEdit = (oldCatName: string) => {
    const cleanNew = editValue.trim();
    if (!cleanNew) {
      setEditError('O nome da categoria não pode ficar vazio.');
      return;
    }

    if (cleanNew === oldCatName) {
      handleCancelEdit();
      return;
    }

    const ok = updateCategory(oldCatName, cleanNew);
    if (!ok) {
      setEditError(`Já existe outra categoria com o nome "${cleanNew}".`);
      return;
    }

    const affectedBooks = booksCountByCat[oldCatName] || 0;
    setEditingCat(null);
    setEditValue('');
    setEditError(null);
    setSuccessMsg(
      affectedBooks > 0
        ? `Categoria renomeada para "${cleanNew}"! ${affectedBooks} livro(s) atualizado(s).`
        : `Categoria renomeada para "${cleanNew}" com sucesso!`
    );
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDelete = (catName: string) => {
    const count = booksCountByCat[catName] || 0;
    if (count > 0) {
      if (
        !window.confirm(
          `A categoria "${catName}" possui ${count} livro(s) associado(s). Tem certeza que deseja removê-la da lista de opções? (Os livros manterão o texto atual).`
        )
      ) {
        return;
      }
    }
    deleteCategory(catName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Gerenciar Categorias
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adicione, edite e personalize os gêneros literários da sua estante
              </p>
            </div>
          </div>
          <button
            onClick={closeCategoryModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Criar Nova Categoria
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Fantasia, Psicologia, Mangás..."
                className="flex-1 px-3.5 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs md:text-sm font-bold rounded-xl bg-slate-900 text-white dark:bg-amber-600 dark:hover:bg-amber-500 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <Check className="w-3.5 h-3.5" />
                {successMsg}
              </p>
            )}
          </form>

          {/* Quick Suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Sugestões Rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SUGGESTIONS.filter((s) => !categories.includes(s)).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => handleQuickAdd(sugg)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-500/10 hover:text-amber-600 dark:bg-slate-800 dark:hover:bg-amber-500/20 dark:hover:text-amber-400 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  <span>{sugg}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info note regarding alphabetical sorting and editing */}
          <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Organização Alfabética e Edição
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Todas as categorias são ordenadas automaticamente de A a Z. Ao editar o nome de qualquer categoria, os livros cadastrados nela são atualizados instantaneamente.
              </p>
            </div>
          </div>

          {/* Existing Categories List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ArrowDownAZ className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Categorias em Ordem Alfabética ({sortedCategories.length})
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {books.length} livros na estante
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {sortedCategories.map((cat) => {
                const isDefault = DEFAULT_CATEGORIES.includes(cat);
                const bookCount = booksCountByCat[cat] || 0;
                const dotColor = getCategoryColor(cat);
                const isEditing = editingCat === cat;

                if (isEditing) {
                  return (
                    <div
                      key={cat}
                      className="p-3 px-4 bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-amber-500 transition-colors"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                            Renomear categoria:
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {bookCount} livro(s) serão atualizados
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => {
                              setEditValue(e.target.value);
                              if (editError) setEditError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEdit(cat);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Nome da categoria"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 flex items-center gap-1 transition-colors shadow-2xs"
                            title="Salvar alteração (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Cancelar (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {editError && (
                          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {editError}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat}
                    className="p-3 px-4 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cat}
                      </span>
                      {isDefault && (
                        <span className="text-[10px] text-slate-400 font-normal shrink-0">
                          (padrão)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {bookCount} {bookCount === 1 ? 'livro' : 'livros'}
                      </span>

                      {/* Edit Button for ANY category */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        title={`Editar categoria "${cat}"`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title={`Remover categoria "${cat}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/20">
          <button
            type="button"
            onClick={closeCategoryModal}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-amber-600 dark:hover:bg-amber-500 text-xs font-semibold"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
