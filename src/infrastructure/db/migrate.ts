/**
 * Migration runner — invoked by `npm run db:migrate`.
 *
 * Applies every migration in ./drizzle against the configured SQLite database.
 * Safe to run repeatedly; drizzle skips migrations already recorded in
 * `__drizzle_migrations`.
 *
 * Layer: Infrastructure
 */

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { createDb, resolveDatabaseUrl } from './client';

export function runMigrations(opts: { url?: string; migrationsFolder?: string } = {}): void {
  const { db, sqlite } = createDb(opts.url);
  try {
    migrate(db, { migrationsFolder: opts.migrationsFolder ?? './drizzle' });
  } finally {
    sqlite.close();
  }
}

if (require.main === module) {
  const url = resolveDatabaseUrl();
  // eslint-disable-next-line no-console
  console.log(`[db:migrate] applying migrations to ${url}`);
  runMigrations({ url });
  // eslint-disable-next-line no-console
  console.log('[db:migrate] done');
}
