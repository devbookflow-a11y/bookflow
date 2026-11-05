import { Book, ReadingGoal, ReadingSession } from '../types/book';
import { getTodayString, addDaysToDate, getPastDates } from './dateUtils';

export interface CategoryStatItem {
  category: string;
  count: number;
  percentage: number;
  color: string;
  pages: number;
}

export interface DashboardStats {
  booksReadThisYear: number;
  totalBooksRead: number;
  currentlyReadingCount: number;
  toReadCount: number;
  totalPagesRead: number;
  totalPagesInCompletedBooks: number;
  averagePagesPerBook: number;
  overallAveragePace: number;
  currentStreakDays: number;
  longestStreakDays: number;
  categoryDistribution: CategoryStatItem[];
  completedCategoryDistribution: CategoryStatItem[];
  dailyActivity: { date: string; label: string; pages: number }[];
  delayedBooksCount: number;
  totalNotesCount: number;
  topCategory: string;
}

export interface AnnualPaceResult {
  dayOfYear: number;
  totalDaysInYear: number;
  expectedBooksToDate: number;
  diffBooks: number;
  status: 'ahead' | 'on_track' | 'behind';
  headline: string;
  subMessage: string;
  daysRemaining: number;
  booksRemaining: number;
  pagesRemaining?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Ficção': '#6366f1', // Indigo
  'Não-Ficção': '#0ea5e9', // Sky
  'Matemática / Exatas': '#f59e0b', // Amber
  'Educação & Pedagogia': '#10b981', // Emerald
  'Desenvolvimento Pessoal': '#ec4899', // Pink
  'Tecnologia & Ciência': '#8b5cf6', // Violet
  'Filosofia & Sociologia': '#14b8a6', // Teal
  'História & Biografia': '#f97316', // Orange
  'Negócios & Carreira': '#3b82f6', // Blue
  'Literatura Clássica': '#84cc16', // Lime
  'Outros': '#94a3b8', // Slate
};

const DYNAMIC_PALETTE = ['#06b6d4', '#e11d48', '#d946ef', '#14b8a6', '#f43f5e', '#84cc16', '#a855f7', '#0284c7', '#fb923c'];

export function getCategoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DYNAMIC_PALETTE.length;
  return DYNAMIC_PALETTE[index];
}

export function calculateAnnualPace(
  goal: ReadingGoal,
  booksReadThisYear: number,
  pagesReadThisYear: number = 0
): AnnualPaceResult {
  const currentYear = goal.year || new Date().getFullYear();
  const now = new Date();
  const startOfYear = new Date(currentYear, 0, 1);
  const isLeap = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0;
  const totalDaysInYear = isLeap ? 366 : 365;

  // Day of year (1 to 365/366)
  const diffTime = Math.max(0, now.getTime() - startOfYear.getTime());
  const dayOfYear = Math.min(totalDaysInYear, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const daysRemaining = Math.max(0, totalDaysInYear - dayOfYear);

  // Expected books read up to today based on linear annual pace
  const expectedBooksToDate = (goal.targetBooks * dayOfYear) / totalDaysInYear;
  const diffBooks = Number((booksReadThisYear - expectedBooksToDate).toFixed(1));
  const booksRemaining = Math.max(0, goal.targetBooks - booksReadThisYear);

  let status: 'ahead' | 'on_track' | 'behind' = 'on_track';
  let headline = '';
  let subMessage = '';

  const roundedDiff = Math.abs(Math.round(diffBooks));

  if (diffBooks >= 0.8) {
    status = 'ahead';
    const booksLabel = roundedDiff === 1 ? '1 livro' : `${roundedDiff} livros`;
    headline = `Você está ${booksLabel} à frente da meta esperada para esta época do ano!`;
    subMessage = `Excelente ritmo! Pelo calendário de hoje era esperado ter lido ~${expectedBooksToDate.toFixed(1)} livros e você já concluiu ${booksReadThisYear}.`;
  } else if (diffBooks <= -0.8) {
    status = 'behind';
    const booksLabel = roundedDiff === 1 ? '1 livro' : `${roundedDiff} livros`;
    headline = `Você está ${booksLabel} atrás da meta esperada para esta época do ano.`;
    subMessage = `Para recuperar o ritmo, tente ler algumas páginas extras hoje. Faltam ${booksRemaining} livros nos ${daysRemaining} dias restantes.`;
  } else {
    status = 'on_track';
    headline = 'Você está no ritmo exato esperado para a sua meta anual!';
    subMessage = `Constância exemplar: ${booksReadThisYear} livros concluídos até o dia ${dayOfYear} do ano. Continue assim!`;
  }

  return {
    dayOfYear,
    totalDaysInYear,
    expectedBooksToDate: Number(expectedBooksToDate.toFixed(1)),
    diffBooks,
    status,
    headline,
    subMessage,
    daysRemaining,
    booksRemaining,
  };
}

export function calculateDashboardStats(books: Book[]): DashboardStats {
  const currentYear = new Date().getFullYear();
  const today = getTodayString();

  // Books counts
  const completedBooks = books.filter((b) => b.status === 'completed');
  const readingBooks = books.filter((b) => b.status === 'reading');
  const toReadBooks = books.filter((b) => b.status === 'to_read');

  const booksReadThisYear = completedBooks.filter((b) => {
    if (!b.completedDate) return false;
    return b.completedDate.startsWith(String(currentYear));
  }).length;

  // Total pages read across all books
  let totalPagesRead = 0;
  let totalPagesInCompletedBooks = 0;
  books.forEach((b) => {
    if (b.status === 'completed') {
      totalPagesRead += b.totalPages;
      totalPagesInCompletedBooks += b.totalPages;
    } else {
      totalPagesRead += Math.min(b.currentPage, b.totalPages);
    }
  });

  // Average pages per completed book (or all books if none completed)
  const averagePagesPerBook =
    completedBooks.length > 0
      ? Math.round(totalPagesInCompletedBooks / completedBooks.length)
      : books.length > 0
      ? Math.round(books.reduce((acc, b) => acc + b.totalPages, 0) / books.length)
      : 0;

  // Total notes and quotes across all books
  const totalNotesCount = books.reduce((acc, b) => acc + (b.notes?.length || 0), 0);

  // Collect all reading sessions across books
  const allSessions: ReadingSession[] = [];
  books.forEach((b) => {
    if (b.sessions && b.sessions.length > 0) {
      allSessions.push(...b.sessions);
    }
  });

  // Aggregate pages read by date
  const pagesByDate: Record<string, number> = {};
  allSessions.forEach((s) => {
    pagesByDate[s.date] = (pagesByDate[s.date] || 0) + s.pagesRead;
  });

  // Calculate streak
  let currentStreakDays = 0;
  let checkDate = today;

  // If user hasn't logged today yet, also check if they logged yesterday so streak doesn't break prematurely today
  const hasLoggedToday = (pagesByDate[today] || 0) > 0;
  if (!hasLoggedToday) {
    const yesterday = addDaysToDate(today, -1);
    if ((pagesByDate[yesterday] || 0) > 0) {
      checkDate = yesterday;
    }
  }

  while ((pagesByDate[checkDate] || 0) > 0) {
    currentStreakDays++;
    checkDate = addDaysToDate(checkDate, -1);
  }

  // Calculate longest streak
  const uniqueDates = Object.keys(pagesByDate).sort();
  let longestStreakDays = currentStreakDays;
  let tempStreak = 0;
  let prevDate = '';

  for (const date of uniqueDates) {
    if (prevDate && addDaysToDate(prevDate, 1) === date) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    if (tempStreak > longestStreakDays) {
      longestStreakDays = tempStreak;
    }
    prevDate = date;
  }

  // Overall average pace
  const daysWithReading = Object.keys(pagesByDate).length;
  const overallAveragePace =
    daysWithReading > 0
      ? Number((totalPagesRead / Math.max(1, daysWithReading)).toFixed(1))
      : 15;

  // Daily activity for the last 14 days
  const past14Dates = getPastDates(14);
  const dailyActivity = past14Dates.map((dateStr) => {
    const parts = dateStr.split('-');
    const day = parts[2];
    const month = parts[1];
    return {
      date: dateStr,
      label: `${day}/${month}`,
      pages: pagesByDate[dateStr] || 0,
    };
  });

  // Category distribution across ALL books
  const categoryCounts: Record<string, { count: number; pages: number }> = {};
  books.forEach((b) => {
    if (!categoryCounts[b.category]) {
      categoryCounts[b.category] = { count: 0, pages: 0 };
    }
    categoryCounts[b.category].count += 1;
    categoryCounts[b.category].pages += b.totalPages;
  });

  const totalBooks = Math.max(1, books.length);
  const categoryDistribution: CategoryStatItem[] = Object.entries(categoryCounts)
    .map(([cat, data]) => ({
      category: cat,
      count: data.count,
      pages: data.pages,
      percentage: Math.round((data.count / totalBooks) * 100),
      color: getCategoryColor(cat),
    }))
    .sort((a, b) => b.count - a.count);

  // Category distribution for COMPLETED books
  const completedCategoryCounts: Record<string, { count: number; pages: number }> = {};
  completedBooks.forEach((b) => {
    if (!completedCategoryCounts[b.category]) {
      completedCategoryCounts[b.category] = { count: 0, pages: 0 };
    }
    completedCategoryCounts[b.category].count += 1;
    completedCategoryCounts[b.category].pages += b.totalPages;
  });

  const totalCompleted = Math.max(1, completedBooks.length);
  const completedCategoryDistribution: CategoryStatItem[] = Object.entries(completedCategoryCounts)
    .map(([cat, data]) => ({
      category: cat,
      count: data.count,
      pages: data.pages,
      percentage: Math.round((data.count / totalCompleted) * 100),
      color: getCategoryColor(cat),
    }))
    .sort((a, b) => b.count - a.count);

  const topCategory = categoryDistribution[0]?.category || 'Nenhuma';

  // Delayed books count among active reading
  let delayedBooksCount = 0;
  readingBooks.forEach((b) => {
    if (b.targetDeadline) {
      const pace = (b.currentPage || 1) / Math.max(1, b.sessions?.length || 1);
      const remaining = Math.max(0, b.totalPages - b.currentPage);
      const daysNeeded = Math.ceil(remaining / Math.max(1, pace));
      const finishDate = addDaysToDate(today, daysNeeded);
      if (finishDate > b.targetDeadline) {
        delayedBooksCount++;
      }
    }
  });

  return {
    booksReadThisYear,
    totalBooksRead: completedBooks.length,
    currentlyReadingCount: readingBooks.length,
    toReadCount: toReadBooks.length,
    totalPagesRead,
    totalPagesInCompletedBooks,
    averagePagesPerBook,
    overallAveragePace,
    currentStreakDays,
    longestStreakDays,
    categoryDistribution,
    completedCategoryDistribution,
    dailyActivity,
    delayedBooksCount,
    totalNotesCount,
    topCategory,
  };
}
