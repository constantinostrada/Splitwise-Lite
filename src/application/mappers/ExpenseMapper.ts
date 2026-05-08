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
      groupId: expense.groupId.value,
      payerId: expense.payerId.value,
      amountInCents: expense.amount.amountInCents,
      currency: expense.amount.currency,
      description: expense.description,
      splits: expense.splits.map((s) => ({
        userId: s.userId.value,
        amountInCents: s.share.amountInCents,
        currency: s.share.currency,
      })),
      createdAt: expense.createdAt.toISOString(),
    };
  }
}
