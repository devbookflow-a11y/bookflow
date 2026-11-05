import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  BookOpen,
  ArrowRight,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import {
  downloadCsvTemplate,
  parseAndValidateCsv,
  CsvImportResult,
} from '../utils/csvImport';

type ModalStep = 'upload' | 'preview' | 'result';

export const CsvImportModal: React.FC = () => {
  const {
    isCsvModalOpen,
    closeCsvModal,
    books,
    addBooksBulk,
    setCurrentTab,
  } = useBooks();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ModalStep>('upload');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvImportResult | null>(null);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  if (!isCsvModalOpen) return null;

  const handleReset = () => {
    setStep('upload');
    setSelectedFileName('');
    setParseResult(null);
    setImportedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    closeCsvModal();
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Por favor, selecione um arquivo no formato CSV (.csv).');
      return;
    }

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const result = parseAndValidateCsv(content, books);
        setParseResult(result);
        setStep('preview');
      }
    };
    reader.onerror = () => {
      alert('Ocorreu um erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validBooksToAdd.length === 0) return;

    // Map to Book payload with status 'to_read'
    const newBooksPayload = parseResult.validBooksToAdd.map((b) => ({
      title: b.title,
      author: b.author,
      category: b.category,
      totalPages: b.totalPages,
      currentPage: 0,
      tags: b.tags,
      status: 'to_read' as const,
    }));

    addBooksBulk(newBooksPayload);
    setImportedCount(newBooksPayload.length);
    setStep('result');
  };

  const handleFinish = () => {
    handleClose();
    setCurrentTab('to_read');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Importação em Massa via Planilha (CSV)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adicione múltiplos livros para a sua lista "Pretendo Ler"
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template download section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Modelo de Planilha Pronto para Download
                  </h3>
                  <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed max-w-md">
                    Baixe o arquivo CSV modelo com as colunas corretas predefinidas: <strong className="font-semibold">Titulo</strong>, <strong className="font-semibold">Autor</strong>, <strong className="font-semibold">Categoria</strong>, <strong className="font-semibold">TotalPaginas</strong> e <strong className="font-semibold">Tags</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Modelo (.csv)</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-500/70 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Arraste sua planilha CSV aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Aceita arquivos codificados em UTF-8 exportados do Excel ou Google Planilhas (.csv)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold"
                >
                  Selecionar Arquivo do Computador
                </button>
              </div>

              {/* Duplicate Prevention Notice */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">Detecção Inteligente de Duplicatas:</strong> O sistema verifica automaticamente título e autor em toda a sua estante. Livros que já existirem em qualquer status (Lendo, Pretendo Ler ou Já Lidos) não serão duplicados.
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && parseResult && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {selectedFileName}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Trocar arquivo</span>
                </button>
              </div>

              {/* Status Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Ready to Add */}
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">
                    Novos Livros Válidos
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                    {parseResult.validBooksToAdd.length}
                  </span>
                  <span className="text-[10px] text-emerald-800/70 dark:text-emerald-400/70 block mt-0.5">
                    Irão para "Pretendo Ler"
                  </span>
                </div>

                {/* Duplicates to Skip */}
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block">
                    Duplicatas Ignoradas
                  </span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums font-mono">
                    {parseResult.duplicateBooks.length}
                  </span>
                  <span className="text-[10px] text-amber-800/70 dark:text-amber-400/70 block mt-0.5">
                    Já presentes na biblioteca
                  </span>
                </div>

                {/* Total Processed */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Linhas Processadas
                  </span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-200 tabular-nums font-mono">
                    {parseResult.totalRowsProcessed}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Total na planilha
                  </span>
                </div>
              </div>

              {/* Books Ready to be Added List */}
              {parseResult.validBooksToAdd.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Livros que serão adicionados ({parseResult.validBooksToAdd.length}):</span>
                  </h4>
                  <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {parseResult.validBooksToAdd.map((book, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 px-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {book.title}
                          </span>
                          <span className="text-slate-400 ml-1.5">por {book.author}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-500">
                          <span>{book.category}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{book.totalPages} págs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates Details Warning List */}
              {parseResult.duplicateBooks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Duplicatas identificadas (não serão repetidas):</span>
                  </h4>
                  <div className="max-h-36 overflow-y-auto border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl divide-y divide-amber-100 dark:divide-amber-900/30">
                    {parseResult.duplicateBooks.map((dup, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 px-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate text-slate-700 dark:text-slate-300">
                          <strong className="font-semibold">{dup.title}</strong>{' '}
                          <span className="text-slate-400">({dup.author})</span>
                        </div>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 shrink-0 font-medium">
                          {dup.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid Rows Warning */}
              {parseResult.invalidRows.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold block mb-1">
                    {parseResult.invalidRows.length} linha(s) ignorada(s) por falta de título ou autor:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {parseResult.invalidRows.slice(0, 3).map((inv, idx) => (
                      <li key={idx}>Linha {inv.rowNumber}: {inv.reason}</li>
                    ))}
                    {parseResult.invalidRows.length > 3 && (
                      <li>...e mais {parseResult.invalidRows.length - 3} linhas.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={parseResult.validBooksToAdd.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 disabled:opacity-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <span>Confirmar e Importar {parseResult.validBooksToAdd.length} Livros</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Importação Concluída com Sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                  <strong className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {importedCount} livro{importedCount !== 1 ? 's' : ''}
                  </strong>{' '}
                  foram adicionados com sucesso à sua lista de <strong className="font-semibold text-slate-900 dark:text-white">"Pretendo Ler"</strong>.
                  {parseResult && parseResult.duplicateBooks.length > 0 && (
                    <span className="block mt-1 text-slate-500 dark:text-slate-400">
                      {parseResult.duplicateBooks.length} livro{parseResult.duplicateBooks.length !== 1 ? 's foram ignorados' : ' foi ignorado'} por já existir na biblioteca.
                    </span>
                  )}
                </p>
              </div>

              {/* Quick Summary of Imported Titles */}
              {parseResult && parseResult.validBooksToAdd.length > 0 && (
                <div className="text-left bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 max-h-48 overflow-y-auto">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                    Livros adicionados:
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parseResult.validBooksToAdd.map((book, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {book.title}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                          {book.author}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 text-white dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95"
                >
                  Concluir e Ver Lista "Pretendo Ler"
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
