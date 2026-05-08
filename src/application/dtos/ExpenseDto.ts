/**
 * Expense DTOs
 *
 * Layer: Application
 *
 * HTTP boundary uses snake_case for inputs/outputs (paid_by_user_id,
 * split_among_user_ids, share_amount, group_id, created_at). Domain stays
 * camelCase; mappers translate.
 *
 * Amounts are integer counts of the smallest currency unit (cents) to align
 * with the persistence schema and the Money value object.
 */

// ── Input DTOs ───────────────────────────────────────────────────────────────

export interface AddExpenseDto {
  readonly groupId: string;
  readonly paid_by_user_id: string;
  readonly amount: number;
  readonly description: string;
  readonly split_among_user_ids?: ReadonlyArray<string>;
}

export type ExpensesSortOrder = 'amount_desc';

export interface GetExpensesByGroupDto {
  readonly groupId: string;
  readonly date_from?: string;
  readonly date_to?: string;
  readonly paid_by_user_id?: string;
  readonly sort?: ExpensesSortOrder;
  readonly limit?: number;
  readonly offset?: number;
}

// ── Output DTOs ──────────────────────────────────────────────────────────────

export interface SplitShareResponseDto {
  readonly user_id: string;
  readonly share_amount: number;
}

export interface ExpenseResponseDto {
  readonly id: string;
  readonly group_id: string;
  readonly paid_by_user_id: string;
  readonly amount: number;
  readonly description: string;
  readonly splits: ReadonlyArray<SplitShareResponseDto>;
  readonly created_at: string;
}

export interface ExpensesPageResponseDto {
  readonly items: ReadonlyArray<ExpenseResponseDto>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}
