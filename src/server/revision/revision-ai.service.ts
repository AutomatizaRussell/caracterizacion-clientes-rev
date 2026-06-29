import type { MatchStatus } from './revision-types';

type ItemForSuggestion = {
  id: string;
  text: string;
  categoryTitle: string;
};

type FileForSuggestion = {
  id: string;
  originalFileName: string;
};

export type LocalMatchSuggestion = {
  adjuntoId: string;
  itemId: string | null;
  score: number;
  status: MatchStatus;
  reason: string;
  warnings: string[];
};

const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'a', 'en', 'por', 'para',
  'con', 'sin', 'un', 'una', 'unos', 'unas', 'archivo', 'documento', 'pdf',
  'xls', 'xlsx', 'doc', 'docx', 'informacion', 'información', 'soporte'
]);

function tokenize(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function scoreTokens(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0;

  const rightSet = new Set(right);
  const matches = left.filter((token) => rightSet.has(token)).length;

  return matches / Math.max(left.length, right.length);
}

function getStatusForScore(score: number): MatchStatus {
  if (score >= 0.82) return 'SUGGESTED_BY_AI';
  if (score >= 0.6) return 'SUGGESTED_BY_AI';
  return 'UNMATCHED';
}

export function buildLocalMatchSuggestions(params: {
  items: ItemForSuggestion[];
  files: FileForSuggestion[];
}): LocalMatchSuggestion[] {
  const itemTokens = params.items.map((item) => ({
    item,
    tokens: tokenize(`${item.categoryTitle} ${item.text}`),
  }));

  return params.files.map((file) => {
    const fileTokens = tokenize(file.originalFileName);
    const candidates = itemTokens
      .map((entry) => ({
        item: entry.item,
        score: scoreTokens(fileTokens, entry.tokens),
      }))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0] ?? null;
    const second = candidates[1] ?? null;
    const warnings: string[] = [];

    if (!best || best.score < 0.6) {
      return {
        adjuntoId: file.id,
        itemId: null,
        score: best?.score ?? 0,
        status: 'UNMATCHED',
        reason: 'No se encontró una coincidencia suficientemente fuerte usando nombre de archivo, categoría e ítem.',
        warnings: ['Requiere asociación manual.'],
      };
    }

    if (second && Math.abs(best.score - second.score) < 0.1) {
      warnings.push('El archivo coincide con más de un ítem de forma similar.');
    }

    if (fileTokens.length <= 1) {
      warnings.push('El nombre del archivo es poco descriptivo.');
    }

    return {
      adjuntoId: file.id,
      itemId: best.item.id,
      score: Number(best.score.toFixed(4)),
      status: getStatusForScore(best.score),
      reason: 'Coincidencia sugerida por nombre de archivo, categoría e ítem solicitado.',
      warnings,
    };
  });
}
