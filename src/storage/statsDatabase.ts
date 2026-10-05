/**
 * Statistics database — stores historical contest results and
 * pre-computed frequency data for fast retrieval.
 */

import * as SQLite from 'expo-sqlite';
import { CaixaResult } from '../services/lotteryApi';

export interface NumberStat {
  number: number;
  count: number;           // how many times drawn
  frequency: number;       // 0–1 relative frequency
  lastContest: number;     // last contest it appeared in
  lastDate: string;        // "dd/MM/yyyy"
  gapAvg: number;          // avg contests between appearances
  streak: number;          // contests since last appearance (0 = appeared in last)
}

export interface LotteryStats {
  lotteryId: string;
  totalContests: number;
  firstContest: number;
  lastContest: number;
  lastUpdated: string;     // ISO date string
  numberStats: NumberStat[];
  hottestNumbers: number[];   // top 6/15/etc most frequent
  coldestNumbers: number[];   // least frequent
  overdueNumbers: number[];   // haven't appeared in longest time
}

export interface SyncMeta {
  lotteryId: string;
  lastCachedContest: number;
  lastSyncAt: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getStatsDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('lottery_stats.db');
    await initStatsDb(db);
  }
  return db;
}

async function initStatsDb(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS contest_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lottery_id TEXT NOT NULL,
      contest_number INTEGER NOT NULL,
      draw_date TEXT NOT NULL,
      numbers TEXT NOT NULL,
      UNIQUE(lottery_id, contest_number)
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      lottery_id TEXT PRIMARY KEY,
      last_cached_contest INTEGER DEFAULT 0,
      last_sync_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_lottery_contest
      ON contest_results(lottery_id, contest_number);
  `);
}

/** Insert a batch of results, ignoring duplicates */
export async function insertResults(
  db: SQLite.SQLiteDatabase,
  lotteryId: string,
  results: CaixaResult[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const r of results) {
      if (!r.listaDezenas?.length) continue;
      await db.runAsync(
        `INSERT OR IGNORE INTO contest_results 
         (lottery_id, contest_number, draw_date, numbers)
         VALUES (?, ?, ?, ?)`,
        [lotteryId, r.numero, r.dataApuracao, JSON.stringify(r.listaDezenas.map(Number))]
      );
    }
  });
}

/** Update sync meta after fetching */
export async function updateSyncMeta(
  db: SQLite.SQLiteDatabase,
  lotteryId: string,
  lastContest: number
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_meta (lottery_id, last_cached_contest, last_sync_at)
     VALUES (?, ?, ?)
     ON CONFLICT(lottery_id) DO UPDATE SET
       last_cached_contest = excluded.last_cached_contest,
       last_sync_at = excluded.last_sync_at`,
    [lotteryId, lastContest, new Date().toISOString()]
  );
}

export async function getSyncMeta(
  db: SQLite.SQLiteDatabase,
  lotteryId: string
): Promise<SyncMeta | null> {
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM sync_meta WHERE lottery_id = ?`,
    [lotteryId]
  );
  if (!row) return null;
  return {
    lotteryId: row.lottery_id,
    lastCachedContest: row.last_cached_contest,
    lastSyncAt: row.last_sync_at,
  };
}

export async function getContestCount(
  db: SQLite.SQLiteDatabase,
  lotteryId: string
): Promise<number> {
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM contest_results WHERE lottery_id = ?`,
    [lotteryId]
  );
  return row?.cnt ?? 0;
}

/** Load all stored results and compute statistics */
export async function computeStats(
  db: SQLite.SQLiteDatabase,
  lotteryId: string,
  pickCount: number,
  minNumber: number,
  maxNumber: number
): Promise<LotteryStats | null> {
  const rows = await db.getAllAsync<any>(
    `SELECT contest_number, draw_date, numbers
     FROM contest_results
     WHERE lottery_id = ?
     ORDER BY contest_number ASC`,
    [lotteryId]
  );

  if (!rows.length) return null;

  const totalContests = rows.length;
  const firstContest = rows[0].contest_number as number;
  const lastContest = rows[rows.length - 1].contest_number as number;

  // count[num] → appearances count
  const countMap: Record<number, number> = {};
  const lastAppearance: Record<number, { contest: number; date: string }> = {};
  const appearances: Record<number, number[]> = {};

  for (let n = minNumber; n <= maxNumber; n++) {
    countMap[n] = 0;
    appearances[n] = [];
  }

  for (const row of rows) {
    const nums: number[] = JSON.parse(row.numbers);
    for (const n of nums) {
      countMap[n] = (countMap[n] ?? 0) + 1;
      lastAppearance[n] = { contest: row.contest_number, date: row.draw_date };
      appearances[n] = appearances[n] ?? [];
      appearances[n].push(row.contest_number);
    }
  }

  // Build NumberStat array
  const numberStats: NumberStat[] = [];
  for (let n = minNumber; n <= maxNumber; n++) {
    const count = countMap[n] ?? 0;
    const apps = appearances[n] ?? [];

    // average gap between appearances
    let gapAvg = 0;
    if (apps.length > 1) {
      let totalGap = 0;
      for (let i = 1; i < apps.length; i++) totalGap += apps[i] - apps[i - 1];
      gapAvg = totalGap / (apps.length - 1);
    }

    const streak = lastContest - (lastAppearance[n]?.contest ?? firstContest);

    numberStats.push({
      number: n,
      count,
      frequency: totalContests > 0 ? count / totalContests : 0,
      lastContest: lastAppearance[n]?.contest ?? 0,
      lastDate: lastAppearance[n]?.date ?? '—',
      gapAvg: Math.round(gapAvg),
      streak,
    });
  }

  // Sort for hot/cold/overdue
  const byFreq = [...numberStats].sort((a, b) => b.count - a.count);
  const hottestNumbers = byFreq.slice(0, pickCount).map(s => s.number);
  const coldestNumbers = byFreq.slice(-pickCount).map(s => s.number);
  const overdueNumbers = [...numberStats]
    .sort((a, b) => b.streak - a.streak)
    .slice(0, pickCount)
    .map(s => s.number);

  return {
    lotteryId,
    totalContests,
    firstContest,
    lastContest,
    lastUpdated: new Date().toISOString(),
    numberStats,
    hottestNumbers,
    coldestNumbers,
    overdueNumbers,
  };
}
