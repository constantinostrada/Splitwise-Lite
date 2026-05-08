/**
 * GetGroupExpensesUseCase
 *
 * Returns all expenses recorded for a given group.
 *
 * Layer: Application
 */

import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import { GroupId } from '@/domain/value-objects/GroupId';

import type { ExpenseResponseDto, GetExpensesByGroupDto } from '../../dtos/ExpenseDto';
import { ExpenseMapper } from '../../mappers/ExpenseMapper';

export class GetGroupExpensesUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(dto: GetExpensesByGroupDto): Promise<ExpenseResponseDto[]> {
    const groupId = GroupId.create(dto.groupId);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    const expenses = await this.expenseRepository.findByGroupId(groupId);
    return expenses.map(ExpenseMapper.toResponseDto);
  }
}
