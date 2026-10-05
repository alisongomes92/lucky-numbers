import {
  fetchLatestContest,
  fetchContestRange,
  CONTESTS_PER_YEAR_MAP,
} from './lotteryApi';
import {
  getStatsDb,
  insertResults,
  updateSyncMeta,
  getSyncMeta,
} from '../storage/statsDatabase';

export type SyncStatus =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'syncing'; fetched: number; total: number }
  | { phase: 'done'; contestsFetched: number }
  | { phase: 'error'; message: string };

export type PeriodYears = 0.5 | 1 | 2 | 3 | 5 | 10 | 0; // 0 = all time

export const PERIOD_OPTIONS: { label: string; value: PeriodYears }[] = [
  { label: '6 meses',       value: 0.5 },
  { label: '1 ano',         value: 1   },
  { label: '2 anos',        value: 2   },
  { label: '3 anos',        value: 3   },
  { label: '5 anos',        value: 5   },
  { label: '10 anos',       value: 10  },
  { label: 'Todo histórico', value: 0  },
];

export async function syncLottery(
  lotteryId: string,
  periodYears: PeriodYears,
  onStatus: (s: SyncStatus) => void
): Promise<void> {
  try {
    onStatus({ phase: 'checking' });
    const db = await getStatsDb();

    // 1. Get latest contest number from Caixa API
    const latest = await fetchLatestContest(lotteryId);
    const latestContest = latest.numero;

    // 2. Calculate how many contests back covers the period
    const contestsPerYear = CONTESTS_PER_YEAR_MAP[lotteryId] ?? 100;
    const windowSize = periodYears === 0
      ? latestContest   // all time → from contest #1
      : Math.round(contestsPerYear * periodYears);

    const fromContest = Math.max(1, latestContest - windowSize);

    // 3. Check existing cache
    const meta = await getSyncMeta(db, lotteryId);
    const lastCached = meta?.lastCachedContest ?? 0;

    // Always re-sync if period changed (start fresh from fromContest)
    const effectiveFrom = Math.max(fromContest, lastCached + 1);

    if (effectiveFrom > latestContest) {
      onStatus({ phase: 'done', contestsFetched: 0 });
      return;
    }

    const total = latestContest - effectiveFrom + 1;
    let fetched = 0;

    onStatus({ phase: 'syncing', fetched: 0, total });

    // 4. Fetch in batches of 15
    const BATCH = 15;
    for (let start = effectiveFrom; start <= latestContest; start += BATCH) {
      const end = Math.min(start + BATCH - 1, latestContest);
      const results = await fetchContestRange(lotteryId, start, end, BATCH);
      await insertResults(db, lotteryId, results);
      fetched += results.length;
      onStatus({ phase: 'syncing', fetched: Math.min(fetched, total), total });
    }

    // Ensure latest is inserted
    await insertResults(db, lotteryId, [latest]);
    await updateSyncMeta(db, lotteryId, latestContest);

    onStatus({ phase: 'done', contestsFetched: fetched });
  } catch (e: any) {
    onStatus({ phase: 'error', message: e?.message ?? 'Erro desconhecido' });
  }
}
