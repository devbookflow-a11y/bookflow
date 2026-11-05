export type BookStatus = 'reading' | 'to_read' | 'completed' | 'none';

export type StandardBookCategory =
  | 'Ficção'
  | 'Não-Ficção'
  | 'Matemática / Exatas'
  | 'Educação & Pedagogia'
  | 'Desenvolvimento Pessoal'
  | 'Tecnologia & Ciência'
  | 'Filosofia & Sociologia'
  | 'História & Biografia'
  | 'Negócios & Carreira'
  | 'Literatura Clássica'
  | 'Outros';

export type BookCategory = StandardBookCategory | string;

export interface ReadingSession {
  id: string;
  bookId: string;
  date: string; // YYYY-MM-DD
  pagesRead: number;
  endingPage: number;
  notes?: string;
  timestamp: number;
}

export type NoteType = 'quote' | 'reflection' | 'note' | 'insight';

export interface BookNote {
  id: string;
  bookId: string;
  content: string;
  pageOrChapter?: string;
  type: NoteType;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  category: BookCategory;
  tags: string[];
  status: BookStatus;
  startDate?: string; // YYYY-MM-DD
  targetDeadline?: string; // YYYY-MM-DD
  completedDate?: string; // YYYY-MM-DD
  rating?: number; // 1-5
  review?: string;
  accentColor?: string; // Tailwind color name like 'amber', 'emerald', 'sky', 'indigo', 'rose', 'purple'
  sessions: ReadingSession[];
  notes?: BookNote[];
  createdAt: number;
  updatedAt: number;
}

export interface ReadingGoal {
  year: number;
  targetBooks: number;
  targetPages?: number;
  dailyPageTarget: number;
}

export interface ReadingReminderSettings {
  enabled: boolean;
  time: string; // HH:mm format, e.g. "20:00"
  frequency: 'daily' | 'weekdays' | 'weekends';
  browserPush: boolean;
  soundEnabled: boolean;
  customMessage?: string;
  lastNotifiedDate?: string; // YYYY-MM-DD
}

export const DEFAULT_REMINDER_SETTINGS: ReadingReminderSettings = {
  enabled: true,
  time: '20:00',
  frequency: 'daily',
  browserPush: true,
  soundEnabled: true,
  customMessage: 'Hora da leitura diária! Dedique alguns minutos para avançar no seu livro.',
};

export type ViewTab = 'reading' | 'library' | 'to_read' | 'completed' | 'dashboard' | 'admin' | 'settings';

