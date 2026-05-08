/**
 * Schema + migration integration tests.
 *
 * Each test maps 1:1 to an acceptance criterion of task GiuDmeZV9R7mosNrpdPX:
 *   ac-1: schema exposes the 5 expected tables
 *   ac-2: every table's primary key is a UUID v4 generated in code
 *   ac-3: group_members has a unique constraint on (group_id, user_id)
 *   ac-4: expense_splits stores share_amount as numeric(12,2)
 *   ac-5: `npm run db:migrate` runs cleanly on an empty SQLite file
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import Database from 'better-sqlite3';
import { validate as isUuid, version as uuidVersion } from 'uuid';

import { createDb } from '../client';
import { runMigrations } from '../migrate';
import {
  expenseSplits,
  expenses,
  groupMembers,
  groups,
  users,
} from '../schema';

const REPO_ROOT = resolve(__dirname, '../../../../');
const MIGRATIONS = join(REPO_ROOT, 'drizzle');

function makeTempDbPath(): { path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'splitwise-schema-'));
  const path = join(dir, 'test.db');
  return {
    path,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function listTables(dbPath: string): string[] {
  const sqlite = new Database(dbPath);
  try {
    const rows = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle_%'",
      )
      .all() as { name: string }[];
    return rows.map((r) => r.name).sort();
  } finally {
    sqlite.close();
  }
}

describe('drizzle schema', () => {
  describe('ac-1: schema declares 5 tables', () => {
    it('exposes users, groups, group_members, expenses, expense_splits', () => {
      const tableObjects = { users, groups, groupMembers, expenses, expenseSplits };
      for (const [, table] of Object.entries(tableObjects)) {
        expect(table).toBeDefined();
      }

      const tmp = makeTempDbPath();
      try {
        runMigrations({ url: tmp.path, migrationsFolder: MIGRATIONS });
        const tables = listTables(tmp.path);
        expect(tables).toEqual(
          ['expense_splits', 'expenses', 'group_members', 'groups', 'users'].sort(),
        );
      } finally {
        tmp.cleanup();
      }
    });
  });

  describe('ac-2: every PK is a UUID v4 generated in code', () => {
    it('inserts rows with code-generated UUID v4 primary keys (no autoincrement)', () => {
      const tmp = makeTempDbPath();
      try {
        runMigrations({ url: tmp.path, migrationsFolder: MIGRATIONS });
        const { db, sqlite } = createDb(tmp.path);

        try {
          const userRow = db
            .insert(users)
            .values({ name: 'Alice', email: 'alice@example.com' })
            .returning()
            .get();
          const groupRow = db
            .insert(groups)
            .values({ name: 'Trip' })
            .returning()
            .get();
          const memberRow = db
            .insert(groupMembers)
            .values({ groupId: groupRow.id, userId: userRow.id })
            .returning()
            .get();
          const expenseRow = db
            .insert(expenses)
            .values({
              groupId: groupRow.id,
              payerId: userRow.id,
              description: 'Lunch',
              amount: '20.00',
              currency: 'USD',
            })
            .returning()
            .get();
          const splitRow = db
            .insert(expenseSplits)
            .values({
              expenseId: expenseRow.id,
              userId: userRow.id,
              shareAmount: '20.00',
            })
            .returning()
            .get();

          for (const id of [
            userRow.id,
            groupRow.id,
            memberRow.id,
            expenseRow.id,
            splitRow.id,
          ]) {
            expect(typeof id).toBe('string');
            expect(isUuid(id)).toBe(true);
            expect(uuidVersion(id)).toBe(4);
          }

          const idColumns = sqlite
            .prepare(
              "SELECT m.name AS table_name, p.type FROM sqlite_master m, pragma_table_info(m.name) p WHERE m.type='table' AND p.name='id' AND m.name IN ('users','groups','group_members','expenses','expense_splits')",
            )
            .all() as { table_name: string; type: string }[];
          expect(idColumns).toHaveLength(5);
          for (const col of idColumns) {
            expect(col.type.toLowerCase()).toBe('text');
          }
        } finally {
          sqlite.close();
        }
      } finally {
        tmp.cleanup();
      }
    });
  });

  describe('ac-3: group_members enforces a unique (group_id, user_id) constraint', () => {
    it('rejects duplicate memberships', () => {
      const tmp = makeTempDbPath();
      try {
        runMigrations({ url: tmp.path, migrationsFolder: MIGRATIONS });
        const { db, sqlite } = createDb(tmp.path);

        try {
          const user = db
            .insert(users)
            .values({ name: 'Bob', email: 'bob@example.com' })
            .returning()
            .get();
          const group = db
            .insert(groups)
            .values({ name: 'Roommates' })
            .returning()
            .get();

          db.insert(groupMembers)
            .values({ groupId: group.id, userId: user.id })
            .run();

          expect(() =>
            db
              .insert(groupMembers)
              .values({ groupId: group.id, userId: user.id })
              .run(),
          ).toThrow(/UNIQUE constraint failed/);
        } finally {
          sqlite.close();
        }
      } finally {
        tmp.cleanup();
      }
    });
  });

  describe('ac-4: expense_splits.share_amount is numeric(12,2)', () => {
    it('column references expense_id + user_id and uses numeric(12,2)', () => {
      const tmp = makeTempDbPath();
      try {
        runMigrations({ url: tmp.path, migrationsFolder: MIGRATIONS });
        const sqlite = new Database(tmp.path);

        try {
          const cols = sqlite
            .prepare("PRAGMA table_info('expense_splits')")
            .all() as { name: string; type: string; notnull: number }[];
          const byName = new Map(cols.map((c) => [c.name, c]));

          expect(byName.has('expense_id')).toBe(true);
          expect(byName.has('user_id')).toBe(true);
          expect(byName.has('share_amount')).toBe(true);

          const shareCol = byName.get('share_amount')!;
          expect(shareCol.type.toLowerCase()).toBe('numeric(12,2)');
          expect(shareCol.notnull).toBe(1);

          const fks = sqlite
            .prepare("PRAGMA foreign_key_list('expense_splits')")
            .all() as { table: string; from: string; to: string }[];
          const fkPairs = fks.map((f) => `${f.from}->${f.table}.${f.to}`).sort();
          expect(fkPairs).toEqual(
            ['expense_id->expenses.id', 'user_id->users.id'].sort(),
          );
        } finally {
          sqlite.close();
        }
      } finally {
        tmp.cleanup();
      }
    });
  });

  describe('ac-5: db:migrate runs cleanly against an empty SQLite', () => {
    it('creates all tables when invoked via npm run db:migrate', () => {
      const tmp = makeTempDbPath();
      try {
        execSync('npm run db:migrate', {
          cwd: REPO_ROOT,
          env: { ...process.env, DATABASE_URL: tmp.path },
          stdio: 'pipe',
        });

        const tables = listTables(tmp.path);
        expect(tables).toEqual(
          ['expense_splits', 'expenses', 'group_members', 'groups', 'users'].sort(),
        );
      } finally {
        tmp.cleanup();
      }
    }, 60_000);
  });
});
