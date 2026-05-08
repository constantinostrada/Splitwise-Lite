/**
 * InMemoryExpenseRepository
 *
 * Layer: Infrastructure
 */

import type { Expense } from '@/domain/entities/Expense';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import type { ExpenseId } from '@/domain/value-objects/ExpenseId';
import type { GroupId } from '@/domain/value-objects/GroupId';

export class InMemoryExpenseRepository implements IExpenseRepository {
  private readonly store = new Map<string, Expense>();

  async findById(id: ExpenseId): Promise<Expense | null> {
    return this.store.get(id.value) ?? null;
  }

  async findByGroupId(groupId: GroupId): Promise<Expense[]> {
    return Array.from(this.store.values()).filter((e) =>
      e.groupId.equals(groupId),
    );
  }

  async save(expense: Expense): Promise<void> {
    this.store.set(expense.id.value, expense);
  }

  async delete(id: ExpenseId): Promise<void> {
    this.store.delete(id.value);
  }

  clear(): void {
    this.store.clear();
  }
}
