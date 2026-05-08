/**
 * Drizzle ORM schema — SQLite
 *
 * All primary keys are UUID v4 strings generated in application code via the
 * `uuid` package (no autoincrement). Decimal monetary fields use a custom
 * SQL type literal `numeric(12,2)` because drizzle's built-in `numeric()`
 * helper for SQLite does not expose precision/scale options.
 *
 * Layer: Infrastructure
 */

import { v4 as uuidv4 } from 'uuid';
import {
  customType,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const decimal12_2 = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'numeric(12,2)';
  },
});

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const groups = sqliteTable('groups', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const groupMembers = sqliteTable(
  'group_members',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: integer('joined_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    groupUserUnique: uniqueIndex('group_members_group_user_unique').on(
      table.groupId,
      table.userId,
    ),
  }),
);

export const expenses = sqliteTable('expenses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  groupId: text('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  payerId: text('payer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  description: text('description').notNull(),
  amount: decimal12_2('amount').notNull(),
  currency: text('currency').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const expenseSplits = sqliteTable('expense_splits', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  expenseId: text('expense_id')
    .notNull()
    .references(() => expenses.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  shareAmount: decimal12_2('share_amount').notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type GroupRow = typeof groups.$inferSelect;
export type NewGroupRow = typeof groups.$inferInsert;
export type GroupMemberRow = typeof groupMembers.$inferSelect;
export type NewGroupMemberRow = typeof groupMembers.$inferInsert;
export type ExpenseRow = typeof expenses.$inferSelect;
export type NewExpenseRow = typeof expenses.$inferInsert;
export type ExpenseSplitRow = typeof expenseSplits.$inferSelect;
export type NewExpenseSplitRow = typeof expenseSplits.$inferInsert;
