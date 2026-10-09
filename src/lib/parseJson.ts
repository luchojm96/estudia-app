import type { ParsedQuestion, QuestionStatus } from '../types';
import { deriveKeywords } from './keywordMatch';

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `qj_${Date.now()}_${idCounter}`;
}

export class JsonParseError extends Error {}

interface RawJsonQuestion {
  question?: unknown;
  pregunta?: unknown;
  options?: unknown;
  opciones?: unknown;
  correct?: unknown;
  correctIndex?: unknown;
  answer?: unknown;
  explanation?: unknown;
  explicacion?: unknown;
  type?: unknown;
  expectedAnswer?: unknown;
  respuestaEsperada?: unknown;
  keywords?: unknown;
  palabrasClave?: unknown;
}

export function parseJSONQuestions(raw: string): ParsedQuestion[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new JsonParseError('El archivo no contiene JSON válido.');
  }

  let list: unknown;
  if (Array.isArray(data)) {
    list = data;
  } else if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { questions?: unknown }).questions)
  ) {
    list = (data as { questions: unknown[] }).questions;
  } else {
    throw new JsonParseError(
      'El JSON debe ser un array de preguntas o un objeto con la clave "questions".',
    );
  }

  return (list as RawJsonQuestion[]).map((item) => buildFromRaw(item));
}

function buildFromRaw(item: RawJsonQuestion): ParsedQuestion {
  const question = String(item.question ?? item.pregunta ?? '').trim();
  const expectedAnswerValue = item.expectedAnswer ?? item.respuestaEsperada;
  const isOpen = item.type === 'open' || item.type === 'desarrollo' || expectedAnswerValue !== undefined;

  if (isOpen) {
    const expectedAnswer = String(expectedAnswerValue ?? '').trim();
    const rawKeywords = item.keywords ?? item.palabrasClave;
    const keywords = Array.isArray(rawKeywords)
      ? rawKeywords.map((k) => String(k).trim()).filter(Boolean)
      : deriveKeywords(expectedAnswer);
    const status: QuestionStatus = keywords.length > 0 ? 'ok' : 'review';

    return {
      id: nextId(),
      kind: 'open',
      question,
      expectedAnswer,
      keywords,
      status,
      include: true,
    };
  }

  const rawOptions = item.options ?? item.opciones;
  const options = Array.isArray(rawOptions) ? rawOptions.map((o) => String(o)) : [];
  const explanationValue = item.explanation ?? item.explicacion;
  const explanation = explanationValue !== undefined ? String(explanationValue) : undefined;

  let correctIndex = -1;
  if (typeof item.correctIndex === 'number') {
    correctIndex = item.correctIndex;
  } else if (typeof item.correct === 'number') {
    correctIndex = item.correct;
  } else if (typeof item.correct === 'string') {
    correctIndex = options.findIndex((o) => o.toLowerCase() === (item.correct as string).toLowerCase());
  } else if (typeof item.answer === 'string') {
    correctIndex = options.findIndex((o) => o.toLowerCase() === (item.answer as string).toLowerCase());
  }

  let status: QuestionStatus;
  if (options.length < 2) {
    status = 'error';
  } else if (correctIndex < 0 || correctIndex >= options.length) {
    status = 'review';
    correctIndex = 0;
  } else {
    status = 'ok';
  }

  return {
    id: nextId(),
    kind: 'choice',
    question,
    options,
    correctIndex,
    explanation,
    status,
    include: true,
  };
}
