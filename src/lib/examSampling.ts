import type { ExamShortfall, ParsedQuestion } from '../types';
import { shuffle } from './shuffle';

export interface FileAvailability {
  sourceFile: string;
  available: number;
}

export interface SamplePlanItem {
  sourceFile: string;
  requested: number;
  take: number;
}

function isUsable(q: ParsedQuestion): boolean {
  return q.status !== 'error' && q.status !== 'review';
}

export function computeFileAvailability(
  questions: ParsedQuestion[],
  kind: 'choice' | 'open',
): FileAvailability[] {
  const counts = new Map<string, number>();
  for (const q of questions) {
    if (q.kind !== kind || !isUsable(q)) continue;
    const key = q.sourceFile ?? '';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([sourceFile, available]) => ({ sourceFile, available }));
}

export function buildSamplePlan(
  totalRequested: number,
  filePercentages: Record<string, number>,
  availability: FileAvailability[],
): SamplePlanItem[] {
  const availableByFile = new Map(availability.map((a) => [a.sourceFile, a.available]));
  const entries = Object.entries(filePercentages).filter(([, pct]) => pct > 0);

  const raw = entries.map(([sourceFile, pct]) => {
    const ideal = (totalRequested * pct) / 100;
    return { sourceFile, ideal, base: Math.floor(ideal) };
  });

  let allocated = raw.reduce((sum, r) => sum + r.base, 0);
  let remainder = totalRequested - allocated;

  const byRemainderDesc = [...raw].sort((a, b) => b.ideal - Math.floor(b.ideal) - (a.ideal - Math.floor(a.ideal)));
  const bonus = new Map<string, number>();
  for (let i = 0; i < byRemainderDesc.length && remainder > 0; i += 1) {
    bonus.set(byRemainderDesc[i].sourceFile, 1);
    remainder -= 1;
  }

  return raw.map((r) => {
    const requested = r.base + (bonus.get(r.sourceFile) ?? 0);
    const available = availableByFile.get(r.sourceFile) ?? 0;
    return { sourceFile: r.sourceFile, requested, take: Math.min(requested, available) };
  });
}

export function sampleQuestionsByFile<T extends { sourceFile?: string }>(
  pool: T[],
  totalRequested: number,
  filePercentages: Record<string, number>,
  kind: 'choice' | 'open',
): { sampled: T[]; shortfalls: ExamShortfall[] } {
  const byFile = new Map<string, T[]>();
  for (const item of pool) {
    const key = item.sourceFile ?? '';
    const list = byFile.get(key);
    if (list) list.push(item);
    else byFile.set(key, [item]);
  }

  const availability: FileAvailability[] = Array.from(byFile.entries()).map(([sourceFile, items]) => ({
    sourceFile,
    available: items.length,
  }));

  const plan = buildSamplePlan(totalRequested, filePercentages, availability);

  const sampled: T[] = [];
  const shortfalls: ExamShortfall[] = [];

  for (const item of plan) {
    const fromFile = byFile.get(item.sourceFile) ?? [];
    sampled.push(...shuffle(fromFile).slice(0, item.take));
    if (item.take < item.requested) {
      shortfalls.push({
        sourceFile: item.sourceFile,
        kind,
        requested: item.requested,
        available: fromFile.length,
      });
    }
  }

  return { sampled: shuffle(sampled), shortfalls };
}
