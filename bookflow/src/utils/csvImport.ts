import { Book, BookCategory } from '../types/book';

export const VALID_CATEGORIES: BookCategory[] = [
  'Ficção',
  'Não-Ficção',
  'Matemática / Exatas',
  'Educação & Pedagogia',
  'Desenvolvimento Pessoal',
  'Tecnologia & Ciência',
  'Filosofia & Sociologia',
  'História & Biografia',
  'Negócios & Carreira',
  'Literatura Clássica',
  'Outros',
];

/**
 * Normalizes a string for robust duplicate comparison:
 * lowercase, removes accents, strips extra internal spaces and punctuation.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

/**
 * Generates and triggers automatic download of a CSV template with UTF-8 BOM
 * so that Microsoft Excel and other spreadsheet editors display accented Portuguese cleanly.
 */
export function downloadCsvTemplate(): void {
  // UTF-8 BOM
  const BOM = '\uFEFF';
  
  // Semicolon is widely used in Brazil/Latin America Excel; we use semicolon with standard header
  const headers = ['Titulo', 'Autor', 'Categoria', 'TotalPaginas', 'Tags'];
  
  const sampleRows = [
    [
      'Duna',
      'Frank Herbert',
      'Ficção',
      '680',
      'Ficção Científica;Clássico;Favorito',
    ],
    [
      'A Arte da Guerra',
      'Sun Tzu',
      'Filosofia & Sociologia',
      '160',
      'Estratégia;História',
    ],
    [
      'O Poder do Hábito',
      'Charles Duhigg',
      'Desenvolvimento Pessoal',
      '408',
      'Produtividade;Psicologia',
    ],
    [
      'O Andar do Bêbado',
      'Leonard Mlodinow',
      'Matemática / Exatas',
      '304',
      'Estatística;Probabilidade;Ciência',
    ],
  ];

  // Helper to escape CSV field
  const escapeField = (val: string) => {
    if (val.includes(';') || val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvRows = [
    headers.join(';'),
    ...sampleRows.map((row) => row.map(escapeField).join(';')),
  ];

  const csvContent = BOM + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'modelo_livros_bookflow.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Flexible RFC-4180 CSV line parser supporting quoted fields with delimiters
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export interface ParsedCsvBook {
  title: string;
  author: string;
  category: BookCategory;
  totalPages: number;
  tags: string[];
}

export interface CsvImportResult {
  totalRowsProcessed: number;
  validBooksToAdd: ParsedCsvBook[];
  duplicateBooks: { title: string; author: string; reason: string }[];
  invalidRows: { rowNumber: number; reason: string; raw: string }[];
}

/**
 * Parses CSV content, detects delimiter, maps headers flexibly,
 * and performs intelligent duplicate checking against existing books.
 */
export function parseAndValidateCsv(
  csvContent: string,
  existingBooks: Book[]
): CsvImportResult {
  // Strip BOM if present
  let cleanContent = csvContent;
  if (cleanContent.charCodeAt(0) === 0xfeff) {
    cleanContent = cleanContent.slice(1);
  }

  const lines = cleanContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      totalRowsProcessed: 0,
      validBooksToAdd: [],
      duplicateBooks: [],
      invalidRows: [
        {
          rowNumber: 1,
          reason: 'O arquivo não contém linhas de dados suficientes (cabeçalho + livros).',
          raw: cleanContent.slice(0, 50),
        },
      ],
    };
  }

  // Detect delimiter (semicolon or comma or tab)
  const headerLine = lines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;

  let delimiter = ';';
  if (commaCount > semicolonCount && commaCount >= tabCount) {
    delimiter = ',';
  } else if (tabCount > semicolonCount && tabCount > commaCount) {
    delimiter = '\t';
  }

  const headers = parseCsvLine(headerLine, delimiter).map((h) =>
    normalizeText(h)
  );

  // Column index detection
  const colIndex = {
    title: headers.findIndex((h) => h.includes('titul') || h.includes('title') || h.includes('nome') || h.includes('livro')),
    author: headers.findIndex((h) => h.includes('autor') || h.includes('author') || h.includes('escritor')),
    category: headers.findIndex((h) => h.includes('categ') || h.includes('gener') || h.includes('assunt')),
    pages: headers.findIndex((h) => h.includes('pagin') || h.includes('page') || h.includes('total') || h.includes('folhas')),
    tags: headers.findIndex((h) => h.includes('tag') || h.includes('etiquet') || h.includes('palavra') || h.includes('badge')),
  };

  // If title was not found, fallback to column 0
  if (colIndex.title === -1 && headers.length > 0) colIndex.title = 0;
  // If author was not found, fallback to column 1
  if (colIndex.author === -1 && headers.length > 1) colIndex.author = 1;

  // Build existing books map for intelligent duplicate detection
  const existingKeySet = new Set<string>();
  existingBooks.forEach((b) => {
    const key = `${normalizeText(b.title)}:::${normalizeText(b.author)}`;
    existingKeySet.add(key);
  });

  // Track duplicates within the CSV itself
  const batchKeySet = new Set<string>();

  const validBooksToAdd: ParsedCsvBook[] = [];
  const duplicateBooks: { title: string; author: string; reason: string }[] = [];
  const invalidRows: { rowNumber: number; reason: string; raw: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cells = parseCsvLine(rawLine, delimiter);

    // Skip empty lines
    if (cells.every((c) => c === '')) continue;

    const rawTitle = colIndex.title >= 0 ? cells[colIndex.title] || '' : '';
    const rawAuthor = colIndex.author >= 0 ? cells[colIndex.author] || '' : '';
    const rawCategory = colIndex.category >= 0 ? cells[colIndex.category] || '' : '';
    const rawPages = colIndex.pages >= 0 ? cells[colIndex.pages] || '' : '';
    const rawTags = colIndex.tags >= 0 ? cells[colIndex.tags] || '' : '';

    const cleanTitle = rawTitle.replace(/^["']|["']$/g, '').trim();
    const cleanAuthor = rawAuthor.replace(/^["']|["']$/g, '').trim();

    if (!cleanTitle || !cleanAuthor) {
      invalidRows.push({
        rowNumber: i + 1,
        reason: 'Título ou Autor ausente ou em branco.',
        raw: rawLine,
      });
      continue;
    }

    // Check duplicate
    const bookKey = `${normalizeText(cleanTitle)}:::${normalizeText(cleanAuthor)}`;

    if (existingKeySet.has(bookKey)) {
      duplicateBooks.push({
        title: cleanTitle,
        author: cleanAuthor,
        reason: 'Já existe na sua biblioteca (verificação inteligente de Título e Autor)',
      });
      continue;
    }

    if (batchKeySet.has(bookKey)) {
      duplicateBooks.push({
        title: cleanTitle,
        author: cleanAuthor,
        reason: 'Duplicata repetida dentro da própria planilha',
      });
      continue;
    }

    batchKeySet.add(bookKey);

    // Category matching
    let matchedCategory: BookCategory = 'Ficção';
    const normCat = normalizeText(rawCategory);
    const foundCat = VALID_CATEGORIES.find(
      (vc) => normalizeText(vc) === normCat || normCat.includes(normalizeText(vc))
    );
    if (foundCat) {
      matchedCategory = foundCat;
    } else if (normCat.includes('exata') || normCat.includes('matemat') || normCat.includes('fisic')) {
      matchedCategory = 'Matemática / Exatas';
    } else if (normCat.includes('pessoal') || normCat.includes('habito') || normCat.includes('autoajuda')) {
      matchedCategory = 'Desenvolvimento Pessoal';
    } else if (normCat.includes('educa') || normCat.includes('pedagog')) {
      matchedCategory = 'Educação & Pedagogia';
    } else if (normCat.includes('tecnol') || normCat.includes('cienc') || normCat.includes('program')) {
      matchedCategory = 'Tecnologia & Ciência';
    } else if (normCat.includes('filosof') || normCat.includes('sociol')) {
      matchedCategory = 'Filosofia & Sociologia';
    } else if (normCat.includes('histor') || normCat.includes('biograf')) {
      matchedCategory = 'História & Biografia';
    } else if (normCat.includes('negoc') || normCat.includes('carreir') || normCat.includes('finan') || normCat.includes('gest')) {
      matchedCategory = 'Negócios & Carreira';
    } else if (normCat.includes('classic')) {
      matchedCategory = 'Literatura Clássica';
    } else if (normCat.includes('nao ficcao') || normCat.includes('nao-ficcao')) {
      matchedCategory = 'Não-Ficção';
    } else if (rawCategory.trim()) {
      matchedCategory = rawCategory.trim();
    }

    // Pages parsing
    const parsedPages = parseInt(rawPages.replace(/\D/g, ''), 10);
    const totalPages = !isNaN(parsedPages) && parsedPages > 0 ? parsedPages : 250;

    // Tags parsing: split by ';' or ',' or '|'
    const tagTokens = rawTags
      ? rawTags
          .split(/[;,|]/)
          .map((t) => t.trim().replace(/^#/, ''))
          .filter((t) => t.length > 0)
      : [];

    validBooksToAdd.push({
      title: cleanTitle,
      author: cleanAuthor,
      category: matchedCategory,
      totalPages,
      tags: tagTokens,
    });
  }

  return {
    totalRowsProcessed: lines.length - 1,
    validBooksToAdd,
    duplicateBooks,
    invalidRows,
  };
}
