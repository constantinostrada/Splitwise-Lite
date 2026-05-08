/**
 * IExpenseRepository — Domain Repository Interface
 *
 * Layer: Domain
 */

import type { Expense } from '../entities/Expense';
import type { ExpenseId } from '../value-objects/ExpenseId';
import type { GroupId } from '../value-objects/GroupId';

export interface IExpenseRepository {
  findById(id: ExpenseId): Promise<Expense | null>;
  findByGroupId(groupId: GroupId): Promise<Expense[]>;
  save(expense: Expense): Promise<void>;
  delete(id: ExpenseId): Promise<void>;
}
