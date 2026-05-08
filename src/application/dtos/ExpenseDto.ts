/**
 * Expense DTOs
 *
 * Layer: Application
 */

// ── Input DTOs ───────────────────────────────────────────────────────────────

export interface SplitShareInputDto {
  readonly userId: string;
  /** Amount in the smallest currency unit (e.g. cents). */
  readonly amountInCents: number;
}

export interface AddExpenseDto {
  readonly groupId: string;
  readonly payerId: string;
  /** Total amount in smallest currency unit (e.g. cents). */
  readonly amountInCents: number;
  readonly currency: string;
  readonly description: string;
  /** How the expense is split among members. Must sum to amountInCents. */
  readonly splits: SplitShareInputDto[];
}

export interface GetExpensesByGroupDto {
  readonly groupId: string;
}

// ── Output DTOs ──────────────────────────────────────────────────────────────

export interface SplitShareResponseDto {
  readonly userId: string;
  readonly amountInCents: number;
  readonly currency: string;
}

export interface ExpenseResponseDto {
  readonly id: string;
  readonly groupId: string;
  readonly payerId: string;
  readonly amountInCents: number;
  readonly currency: string;
  readonly description: string;
  readonly splits: SplitShareResponseDto[];
  readonly createdAt: string; // ISO 8601
}
