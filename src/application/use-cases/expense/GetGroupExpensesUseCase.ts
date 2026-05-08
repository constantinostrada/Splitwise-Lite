/**
 * GetGroupExpensesUseCase
 *
 * Returns a paginated, filterable, sortable page of expenses for a group.
 *
 * Layer: Application
 */

import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import type { Expense } from '@/domain/entities/Expense';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import { GroupId } from '@/domain/value-objects/GroupId';

import type {
  ExpensesPageResponseDto,
  GetExpensesByGroupDto,
} from '../../dtos/ExpenseDto';
import { ExpenseMapper } from '../../mappers/ExpenseMapper';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class GetGroupExpensesUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(dto: GetExpensesByGroupDto): Promise<ExpensesPageResponseDto> {
    const groupId = GroupId.create(dto.groupId);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    const all = await this.expenseRepository.findByGroupId(groupId);

    const dateFrom = parseDateBoundary(dto.date_from, 'start');
    const dateTo = parseDateBoundary(dto.date_to, 'end');

    const filtered = all.filter((expense) => {
      if (dateFrom && expense.createdAt < dateFrom) return false;
      if (dateTo && expense.createdAt > dateTo) return false;
      if (dto.paid_by_user_id && expense.payerId.value !== dto.paid_by_user_id) {
        return false;
      }
      return true;
    });

    const sorted = sortExpenses(filtered, dto.sort);

    const limit = clamp(toInt(dto.limit, DEFAULT_LIMIT), 1, MAX_LIMIT);
    const offset = Math.max(0, toInt(dto.offset, 0));

    const page = sorted.slice(offset, offset + limit);

    return {
      items: page.map(ExpenseMapper.toResponseDto),
      total: filtered.length,
      limit,
      offset,
    };
  }
}

function sortExpenses(expenses: Expense[], sort?: string): Expense[] {
  const copy = [...expenses];
  if (sort === 'amount_desc') {
    copy.sort((a, b) => b.amount.amountInCents - a.amount.amountInCents);
  } else {
    copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return copy;
}

function parseDateBoundary(
  raw: string | undefined,
  edge: 'start' | 'end',
): Date | null {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const iso = edge === 'start' ? `${raw}T00:00:00.000Z` : `${raw}T23:59:59.999Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
