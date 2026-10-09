export const COMPLETENESS_THRESHOLD = 0.6;
const MIN_TOKEN_LENGTH = 4;
const MAX_KEYWORDS = 12;

const STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un',
  'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le',
  'ya', 'o', 'este', 'si', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre',
  'tambien', 'me', 'hasta', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos',
  'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'esto', 'mi',
  'antes', 'algunos', 'unos', 'yo', 'otro', 'otras', 'otra', 'tanto', 'esa',
  'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas',
  'algunas', 'algo', 'nosotros', 'mis', 'tuyo', 'ellas', 'nosotras', 'vosotros', 'vosotras',
  'os', 'mio', 'mia', 'mios', 'mias', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos',
  'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros',
  'vuestras', 'esos', 'esas',
  'son', 'es', 'estan', 'era', 'eran', 'sea', 'sean', 'ser', 'siendo', 'sido',
  'hay', 'ha', 'han', 'hace', 'hacen', 'puede', 'pueden', 'debe', 'deben', 'tiene', 'tienen',
  'permite', 'permiten', 'debido', 'segun', 'cada', 'sino', 'aunque', 'pues', 'asi', 'ademas',
  'dentro', 'fuera', 'bajo', 'mediante', 'cuales', 'cuyo', 'cuya', 'cuyos', 'cuyas',
  'solo', 'solamente', 'siempre', 'nunca', 'mientras', 'ejemplo', 'forma', 'manera', 'caso',
]);

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(normalized: string): string[] {
  return normalized.split(' ').filter(Boolean);
}

export function deriveKeywords(text: string): string[] {
  const tokens = tokenize(normalizeText(text));
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const token of tokens) {
    if (token.length < MIN_TOKEN_LENGTH) continue;
    if (STOPWORDS.has(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    keywords.push(token);
    if (keywords.length >= MAX_KEYWORDS) break;
  }

  return keywords;
}

function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < MIN_TOKEN_LENGTH || b.length < MIN_TOKEN_LENGTH) return false;
  return a.startsWith(b) || b.startsWith(a);
}

interface OpenAnswerScore {
  matched: string[];
  missing: string[];
  ratio: number;
  completeness: 'completa' | 'incompleta';
}

export function scoreOpenAnswer(userAnswer: string, keywords: string[]): OpenAnswerScore {
  const userTokens = tokenize(normalizeText(userAnswer));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const rawKeyword of keywords) {
    const keywordTokens = tokenize(normalizeText(rawKeyword));
    if (keywordTokens.length === 0) continue;
    const allWordsPresent = keywordTokens.every((kw) => userTokens.some((ut) => tokensMatch(ut, kw)));
    if (allWordsPresent) {
      matched.push(rawKeyword);
    } else {
      missing.push(rawKeyword);
    }
  }

  const total = matched.length + missing.length;
  const ratio = total === 0 ? 0 : matched.length / total;

  return {
    matched,
    missing,
    ratio,
    completeness: ratio >= COMPLETENESS_THRESHOLD ? 'completa' : 'incompleta',
  };
}
