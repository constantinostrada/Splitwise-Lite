/**
 * ExpenseMapper
 *
 * Layer: Application
 */

import type { Expense } from '@/domain/entities/Expense';

import type { ExpenseResponseDto } from '../dtos/ExpenseDto';

export class ExpenseMapper {
  static toResponseDto(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id.value,
      group_id: expense.groupId.value,
      paid_by_user_id: expense.payerId.value,
      amount: expense.amount.amountInCents,
      description: expense.description,
      splits: expense.splits.map((s) => ({
        user_id: s.userId.value,
        share_amount: s.share.amountInCents,
      })),
      created_at: expense.createdAt.toISOString(),
    };
  }
}
