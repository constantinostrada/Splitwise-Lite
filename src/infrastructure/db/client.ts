/**
 * SQLite database client (better-sqlite3 + drizzle-orm)
 *
 * The connection URL comes from DATABASE_URL; if absent it falls back to a
 * local file under ./data so `npm run db:migrate` works out-of-the-box.
 * The parent directory is created on demand because better-sqlite3 will
 * otherwise throw on a missing folder.
 *
 * Layer: Infrastructure
 */

import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

import Database, { type Database as BetterSqliteDatabase } from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface DbHandle {
  db: AppDatabase;
  sqlite: BetterSqliteDatabase;
}

const DEFAULT_DB_PATH = './data/splitwise.db';

export function resolveDatabaseUrl(url?: string): string {
  return url ?? process.env.DATABASE_URL ?? DEFAULT_DB_PATH;
}

export function createDb(url?: string): DbHandle {
  const target = resolveDatabaseUrl(url);
  const filePath = isAbsolute(target) ? target : resolve(process.cwd(), target);

  if (filePath !== ':memory:') {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const sqlite = new Database(filePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
