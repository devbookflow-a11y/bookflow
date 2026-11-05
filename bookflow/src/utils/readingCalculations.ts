import { Book } from '../types/book';
import { getTodayString, daysBetween, addDaysToDate, formatDateBr } from './dateUtils';

export interface ReadingProjection {
  percentage: number;
  pagesRemaining: number;
  pagesRead: number;
  daysActive: number;
  currentPace: number; // pages/day
  daysNeededAtPace: number;
  estimatedCompletionDate: string; // YYYY-MM-DD
  daysUntilDeadline: number | null;
  isDelayed: boolean;
  delayDays: number;
  requiredPaceForDeadline: number;
  statusType: 'on_track' | 'at_risk' | 'delayed' | 'no_deadline' | 'completed';
  statusMessage: string;
}

/**
 * Calculates current rhythm, projection, and smart delay alerts for a book.
 */
export function calculateReadingProjection(book: Book): ReadingProjection {
  const total = Math.max(1, book.totalPages);
  const current = Math.min(total, Math.max(0, book.currentPage));
  const pagesRemaining = total - current;
  const percentage = Math.round((current / total) * 100);
  const today = getTodayString();

  if (book.status === 'completed' || current >= total) {
    return {
      percentage: 100,
      pagesRemaining: 0,
      pagesRead: total,
      daysActive: 0,
      currentPace: 0,
      daysNeededAtPace: 0,
      estimatedCompletionDate: book.completedDate || today,
      daysUntilDeadline: null,
      isDelayed: false,
      delayDays: 0,
      requiredPaceForDeadline: 0,
      statusType: 'completed',
      statusMessage: 'Livro concluído com sucesso!',
    };
  }

  // Calculate days active
  let daysActive = 1;
  if (book.startDate) {
    const diff = daysBetween(book.startDate, today);
    daysActive = Math.max(1, diff + 1);
  }

  // Calculate pages read during this reading period
  const pagesRead = current;

  // Pace calculation:
  // We look at the sessions if available, or pagesRead / daysActive
  let currentPace = 0;
  if (book.sessions && book.sessions.length > 0) {
    // If sessions exist, calculate pace from sessions in active window (e.g. last 14 days) or total sessions
    const totalSessionPages = book.sessions.reduce((acc, s) => acc + s.pagesRead, 0);
    // Find unique days with sessions or span
    const sessionDates = [...new Set(book.sessions.map((s) => s.date))];
    const sessionDays = Math.max(1, sessionDates.length);
    currentPace = Number((totalSessionPages / sessionDays).toFixed(1));
  } else {
    currentPace = Number((pagesRead / daysActive).toFixed(1));
  }

  // Fallback default pace if 0 (e.g. just started today, no pages logged yet)
  const effectivePace = currentPace > 0 ? currentPace : 10; // 10 pages/day as realistic baseline for estimation

  // Estimated days to complete
  const daysNeededAtPace = Math.ceil(pagesRemaining / effectivePace);
  const estimatedCompletionDate = addDaysToDate(today, daysNeededAtPace);

  // Deadline evaluation
  if (!book.targetDeadline) {
    return {
      percentage,
      pagesRemaining,
      pagesRead,
      daysActive,
      currentPace,
      daysNeededAtPace,
      estimatedCompletionDate,
      daysUntilDeadline: null,
      isDelayed: false,
      delayDays: 0,
      requiredPaceForDeadline: 0,
      statusType: 'no_deadline',
      statusMessage: `Estimativa de término em ${daysNeededAtPace} dias (${formatDateBr(estimatedCompletionDate)}) no ritmo atual de ${effectivePace} págs/dia.`,
    };
  }

  // We have a target deadline
  const daysUntilDeadline = daysBetween(today, book.targetDeadline);
  const delayDays = daysBetween(book.targetDeadline, estimatedCompletionDate);

  let isDelayed = false;
  let statusType: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
  let requiredPaceForDeadline = 0;
  let statusMessage = '';

  if (daysUntilDeadline <= 0) {
    // Deadline is today or already passed
    isDelayed = true;
    statusType = 'delayed';
    const overdueDays = Math.abs(daysUntilDeadline) + 1;
    requiredPaceForDeadline = pagesRemaining; // all remaining
    statusMessage = `Prazo ultrapassado há ${overdueDays} dia${overdueDays > 1 ? 's' : ''}! Faltam ${pagesRemaining} páginas.`;
  } else {
    // Required pace to meet deadline
    requiredPaceForDeadline = Math.ceil(pagesRemaining / daysUntilDeadline);

    if (delayDays > 0) {
      // Estimated date is AFTER target deadline
      isDelayed = true;
      statusType = 'delayed';
      statusMessage = `Alerta de Atraso: No ritmo atual de ${effectivePace} págs/dia, a conclusão estimada (${formatDateBr(estimatedCompletionDate)}) atrasará ${delayDays} dia${delayDays > 1 ? 's' : ''} em relação ao prazo final (${formatDateBr(book.targetDeadline)}).`;
    } else if (delayDays === 0) {
      statusType = 'at_risk';
      statusMessage = `Atenção: Você está exatamente no limite do prazo previsto (${formatDateBr(book.targetDeadline)}).`;
    } else {
      const daysAhead = Math.abs(delayDays);
      statusType = 'on_track';
      statusMessage = `No prazo! No ritmo atual, você terminará ${daysAhead} dia${daysAhead > 1 ? 's' : ''} antes da sua meta (${formatDateBr(book.targetDeadline)}).`;
    }
  }

  return {
    percentage,
    pagesRemaining,
    pagesRead,
    daysActive,
    currentPace,
    daysNeededAtPace,
    estimatedCompletionDate,
    daysUntilDeadline,
    isDelayed,
    delayDays: Math.max(0, delayDays),
    requiredPaceForDeadline,
    statusType,
    statusMessage,
  };
}
