import type { ParsedQuestion, QuestionStatus } from '../types';
import { deriveKeywords } from './keywordMatch';

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `q_${Date.now()}_${idCounter}`;
}

interface RawOption {
  text: string;
  correct: boolean;
}

interface RawQuestion {
  questionLines: string[];
  options: RawOption[];
  explanation?: string;
  answerLetterIndex?: number;
  expectedAnswer?: string;
  keywords?: string[];
}

const QUESTION_START = /^\s*\*{0,2}\s*\d+[.)]\s*(.*)$/;
const CHECKBOX_OPTION = /^\s*[-*+]\s*\[([ xX])\]\s*(.*)$/;
const LETTER_OPTION = /^\s*(\*)?\(?([a-hA-H])\)\s*(.*)$/;
const EXPECTED_ANSWER = /^\s*>\s*Respuesta esperada\s*:\s*(.*)$/i;
const KEYWORDS_LINE = /^\s*>\s*Palabras clave\s*:\s*(.*)$/i;
const EXPLANATION_QUOTE = /^\s*>\s?(.*)$/;
const EXPLANATION_LABEL = /^\s*(?:Explicaci[oó]n|Explanation)\s*:\s*(.*)$/i;
const ANSWER_KEY = /^\s*Respuesta(?:\s+correcta)?\s*:\s*([a-hA-H])\s*$/i;
const TRAILING_CORRECTA = /\s*\(correcta\)\s*$/i;
const TRAILING_ASTERISK = /\*\s*$/;

function stripBold(text: string): string {
  return text.replace(/^\*+/, '').replace(/\*+$/, '').trim();
}

function finalizeOptionText(raw: string): { text: string; correct: boolean } {
  let text = raw.trim();
  let correct = false;

  if (TRAILING_CORRECTA.test(text)) {
    correct = true;
    text = text.replace(TRAILING_CORRECTA, '').trim();
  }

  if (TRAILING_ASTERISK.test(text)) {
    correct = true;
    text = text.replace(TRAILING_ASTERISK, '').trim();
  }

  return { text, correct };
}

function buildParsedQuestion(raw: RawQuestion): ParsedQuestion {
  const question = stripBold(raw.questionLines.join(' ').trim());

  if (raw.options.length === 0 && raw.expectedAnswer) {
    const keywords =
      raw.keywords && raw.keywords.length > 0 ? raw.keywords : deriveKeywords(raw.expectedAnswer);
    const status: QuestionStatus = keywords.length > 0 ? 'ok' : 'review';
    return {
      id: nextId(),
      kind: 'open',
      question,
      expectedAnswer: raw.expectedAnswer,
      keywords,
      status,
      include: true,
    };
  }

  const options = raw.options.map((o) => o.text);
  const correctFlags = raw.options.map((o) => o.correct);

  if (
    raw.answerLetterIndex !== undefined &&
    raw.answerLetterIndex >= 0 &&
    raw.answerLetterIndex < correctFlags.length
  ) {
    correctFlags[raw.answerLetterIndex] = true;
  }

  const correctIndices = correctFlags
    .map((flag, i) => (flag ? i : -1))
    .filter((i) => i >= 0);

  let status: QuestionStatus;
  let correctIndex = correctIndices[0] ?? 0;

  if (options.length < 2) {
    status = 'error';
  } else if (correctIndices.length !== 1) {
    status = 'review';
  } else {
    status = 'ok';
    correctIndex = correctIndices[0];
  }

  return {
    id: nextId(),
    kind: 'choice',
    question,
    options,
    correctIndex,
    explanation: raw.explanation,
    status,
    include: true,
  };
}

export function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const results: ParsedQuestion[] = [];
  let current: RawQuestion | null = null;

  const flush = () => {
    if (current && (current.questionLines.length > 0 || current.options.length > 0)) {
      results.push(buildParsedQuestion(current));
    }
    current = null;
  };

  for (const line of lines) {
    const qMatch = line.match(QUESTION_START);
    if (qMatch) {
      flush();
      current = { questionLines: qMatch[1].trim() ? [qMatch[1].trim()] : [], options: [] };
      continue;
    }

    if (!current) continue;
    if (!line.trim()) continue;

    const checkboxMatch = line.match(CHECKBOX_OPTION);
    if (checkboxMatch) {
      const markedCorrect = checkboxMatch[1].toLowerCase() === 'x';
      const { text, correct: extraCorrect } = finalizeOptionText(checkboxMatch[2]);
      current.options.push({ text, correct: markedCorrect || extraCorrect });
      continue;
    }

    const letterMatch = line.match(LETTER_OPTION);
    if (letterMatch) {
      const leadingStar = Boolean(letterMatch[1]);
      const { text, correct: extraCorrect } = finalizeOptionText(letterMatch[3]);
      current.options.push({ text, correct: leadingStar || extraCorrect });
      continue;
    }

    const answerKeyMatch = line.match(ANSWER_KEY);
    if (answerKeyMatch) {
      current.answerLetterIndex = answerKeyMatch[1].toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
      continue;
    }

    const expectedAnswerMatch = line.match(EXPECTED_ANSWER);
    if (expectedAnswerMatch) {
      current.expectedAnswer = current.expectedAnswer
        ? `${current.expectedAnswer} ${expectedAnswerMatch[1].trim()}`
        : expectedAnswerMatch[1].trim();
      continue;
    }

    const keywordsMatch = line.match(KEYWORDS_LINE);
    if (keywordsMatch) {
      const parsed = keywordsMatch[1]
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      current.keywords = [...(current.keywords ?? []), ...parsed];
      continue;
    }

    const quoteMatch = line.match(EXPLANATION_QUOTE);
    if (quoteMatch) {
      current.explanation = current.explanation
        ? `${current.explanation} ${quoteMatch[1].trim()}`
        : quoteMatch[1].trim();
      continue;
    }

    const labelMatch = line.match(EXPLANATION_LABEL);
    if (labelMatch) {
      current.explanation = current.explanation
        ? `${current.explanation} ${labelMatch[1].trim()}`
        : labelMatch[1].trim();
      continue;
    }

    if (current.options.length === 0 && current.expectedAnswer === undefined) {
      current.questionLines.push(line.trim());
    }
  }

  flush();
  return results;
}
