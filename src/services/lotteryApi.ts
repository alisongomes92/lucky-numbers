/**
 * Caixa Econômica Federal Lottery API Service
 * Unofficial but widely used endpoint: servicebus2.caixa.gov.br
 * 
 * Strategy: fetch in batches, cache locally in SQLite, 
 * only re-fetch contests newer than last cached entry.
 */

export interface CaixaResult {
  numero: number;               // contest number
  dataApuracao: string;         // "dd/MM/yyyy"
  listaDezenas: string[];       // sorted winning numbers
  listaDezenasSegundoSorteio?: string[] | null; // Dupla Sena 2nd draw
  acumulado: boolean;
  valorEstimadoProximoConcurso?: number;
  nomeTimeCoracaoMesSorte?: string; // Dia de Sorte month
}

const BASE_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';

// Map our internal lottery IDs to Caixa's API slugs
const CAIXA_SLUG: Record<string, string> = {
  'mega-sena':      'megasena',
  'lotofacil':      'lotofacil',
  'quina':          'quina',
  'lotomania':      'lotomania',
  'dupla-sena':     'duplasena',
  'dia-de-sorte':   'diadesorte',
  'mais-milionaria':'maismilionaria',
};

// Approximate contests-per-year for each lottery
export const CONTESTS_PER_YEAR_MAP: Record<string, number> = {
  'mega-sena':      104,  // ~2x per week
  'lotofacil':      260,  // ~5x per week
  'quina':          260,
  'lotomania':      52,   // ~1x per week
  'dupla-sena':     104,
  'dia-de-sorte':   52,
  'mais-milionaria': 52,
};

export function getCaixaSlug(lotteryId: string): string {
  return CAIXA_SLUG[lotteryId] ?? lotteryId;
}

export function get5YearContestCount(lotteryId: string): number {
  return (CONTESTS_PER_YEAR_MAP[lotteryId] ?? 100) * 5;
}

/** Fetch the latest contest result */
export async function fetchLatestContest(lotteryId: string): Promise<CaixaResult> {
  const slug = getCaixaSlug(lotteryId);
  const response = await fetch(`${BASE_URL}/${slug}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

/** Fetch a specific contest by number */
export async function fetchContest(lotteryId: string, contestNumber: number): Promise<CaixaResult | null> {
  const slug = getCaixaSlug(lotteryId);
  try {
    const response = await fetch(`${BASE_URL}/${slug}/${contestNumber}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch a range of contests in parallel batches.
 * @param lotteryId  internal lottery id
 * @param from       first contest number (inclusive)
 * @param to         last contest number (inclusive)
 * @param batchSize  how many parallel requests per batch
 * @param onProgress callback(fetched, total)
 */
export async function fetchContestRange(
  lotteryId: string,
  from: number,
  to: number,
  batchSize = 10,
  onProgress?: (fetched: number, total: number) => void
): Promise<CaixaResult[]> {
  const results: CaixaResult[] = [];
  const total = to - from + 1;
  let fetched = 0;

  for (let start = from; start <= to; start += batchSize) {
    const end = Math.min(start + batchSize - 1, to);
    const batch = Array.from({ length: end - start + 1 }, (_, i) =>
      fetchContest(lotteryId, start + i)
    );
    const batchResults = await Promise.all(batch);
    for (const r of batchResults) {
      if (r) results.push(r);
    }
    fetched += batchSize;
    onProgress?.(Math.min(fetched, total), total);
  }

  return results;
}
