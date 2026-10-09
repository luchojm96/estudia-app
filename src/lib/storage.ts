import type { StoredQuizSet } from '../types';

const STORAGE_KEY = 'estudia_quiz_v1';

export function persistSet(set: StoredQuizSet): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(set));
  } catch {
    // localStorage puede fallar en modo privado o si está deshabilitado.
  }
}

export function loadPersisted(): StoredQuizSet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredQuizSet;
    if (!parsed || !Array.isArray(parsed.questions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorar
  }
}

export function formatRelativeTime(epochMs: number): string {
  const diffMs = Date.now() - epochMs;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'hace un momento';
  if (diffMs < hour) {
    const mins = Math.round(diffMs / minute);
    return `hace ${mins} minuto${mins === 1 ? '' : 's'}`;
  }
  if (diffMs < day) {
    const hours = Math.round(diffMs / hour);
    return `hace ${hours} hora${hours === 1 ? '' : 's'}`;
  }
  const days = Math.round(diffMs / day);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}
