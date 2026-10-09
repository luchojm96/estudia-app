export type QuestionStatus = 'ok' | 'review' | 'error';

export interface ParsedChoiceQuestion {
  id: string;
  kind: 'choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  status: QuestionStatus;
  include: boolean;
  sourceFile?: string;
}

export interface ParsedOpenQuestion {
  id: string;
  kind: 'open';
  question: string;
  expectedAnswer: string;
  keywords: string[];
  status: QuestionStatus;
  include: boolean;
  sourceFile?: string;
}

export type ParsedQuestion = ParsedChoiceQuestion | ParsedOpenQuestion;

export type QuestionPatch = Partial<ParsedChoiceQuestion> & Partial<ParsedOpenQuestion>;

export interface ChoiceQuizQuestion {
  kind: 'choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface OpenQuizQuestion {
  kind: 'open';
  question: string;
  expectedAnswer: string;
  keywords: string[];
}

export type QuizQuestion = ChoiceQuizQuestion | OpenQuizQuestion;

export interface MissedAnswer {
  question: string;
  options: string[];
  correctIndex: number;
  yourIndex: number;
  explanation?: string;
}

export interface ChoiceFlashcardResult {
  kind: 'choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  known: boolean;
}

export interface OpenFlashcardResult {
  kind: 'open';
  question: string;
  expectedAnswer: string;
  keywords: string[];
  userAnswer: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  completeness: 'completa' | 'incompleta';
}

export type FlashcardResult = ChoiceFlashcardResult | OpenFlashcardResult;

export type StudyMode = 'quiz' | 'flashcards';

export interface StoredQuizSet {
  sourceName: string;
  savedAt: number;
  questions: QuizQuestion[];
  lastMode?: StudyMode;
}

export interface ExamSectionConfig {
  totalRequested: number;
  filePercentages: Record<string, number>;
}

export interface ExamConfig {
  choice: ExamSectionConfig | null;
  open: ExamSectionConfig | null;
  durationMinutes: number;
}

export interface ExamShortfall {
  sourceFile: string;
  kind: 'choice' | 'open';
  requested: number;
  available: number;
}

export interface ExamChoiceAnswer {
  kind: 'choice';
  question: string;
  options: string[];
  correctIndex: number;
  yourIndex: number | null;
  explanation?: string;
  correct: boolean;
}

export interface ExamOpenAnswer {
  kind: 'open';
  question: string;
  expectedAnswer: string;
  keywords: string[];
  userAnswer: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  completeness: 'completa' | 'incompleta';
}

export type ExamAnswer = ExamChoiceAnswer | ExamOpenAnswer;

export type Screen =
  | 'landing'
  | 'review'
  | 'quiz'
  | 'results'
  | 'flashcards'
  | 'flashcard-results'
  | 'exam-setup'
  | 'exam'
  | 'exam-results';
