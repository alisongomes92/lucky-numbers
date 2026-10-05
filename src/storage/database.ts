import * as SQLite from 'expo-sqlite';
import { GeneratedResult } from '../utils/generator';

export interface SavedEntry {
  id: number;
  lotteryId: string;
  lotteryName: string;
  numbers: number[];
  extraNumbers?: number[];
  extraLabels?: string[];
  createdAt: string;
  isFavorite: boolean;
  note?: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('lucky_numbers.db');
    await initDatabase(db);
  }
  return db;
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lottery_id TEXT NOT NULL,
      lottery_name TEXT NOT NULL,
      numbers TEXT NOT NULL,
      extra_numbers TEXT,
      extra_labels TEXT,
      created_at TEXT NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      note TEXT
    );
  `);
}

export async function saveEntry(
  lotteryId: string,
  lotteryName: string,
  result: GeneratedResult,
  isFavorite: boolean = false,
  note?: string
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const sqlResult = await db.runAsync(
    `INSERT INTO entries (lottery_id, lottery_name, numbers, extra_numbers, extra_labels, created_at, is_favorite, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lotteryId,
      lotteryName,
      JSON.stringify(result.numbers),
      result.extraNumbers ? JSON.stringify(result.extraNumbers) : null,
      result.extraLabels ? JSON.stringify(result.extraLabels) : null,
      now,
      isFavorite ? 1 : 0,
      note ?? null,
    ]
  );

  return sqlResult.lastInsertRowId;
}

export async function toggleFavorite(id: number, isFavorite: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE entries SET is_favorite = ? WHERE id = ?`, [isFavorite ? 1 : 0, id]);
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM entries WHERE id = ?`, [id]);
}

export async function getHistory(limit: number = 50): Promise<SavedEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM entries ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(mapRow);
}

export async function getFavorites(): Promise<SavedEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM entries WHERE is_favorite = 1 ORDER BY created_at DESC`
  );
  return rows.map(mapRow);
}

function mapRow(row: any): SavedEntry {
  return {
    id: row.id,
    lotteryId: row.lottery_id,
    lotteryName: row.lottery_name,
    numbers: JSON.parse(row.numbers),
    extraNumbers: row.extra_numbers ? JSON.parse(row.extra_numbers) : undefined,
    extraLabels: row.extra_labels ? JSON.parse(row.extra_labels) : undefined,
    createdAt: row.created_at,
    isFavorite: row.is_favorite === 1,
    note: row.note ?? undefined,
  };
}
