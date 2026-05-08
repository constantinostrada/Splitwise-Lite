/**
 * AddExpenseUseCase
 *
 * Records a new expense within a group and validates:
 *  - The group exists.
 *  - The payer is a member of the group.
 *  - All split participants are members of the group.
 *  - Split amounts sum to the total expense amount.
 *
 * Layer: Application
 */

import { Expense } from '@/domain/entities/Expense';
import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import { ExpenseId } from '@/domain/value-objects/ExpenseId';
import { GroupId } from '@/domain/value-objects/GroupId';
import { Money } from '@/domain/value-objects/Money';
import { UserId } from '@/domain/value-objects/UserId';

import type { AddExpenseDto, ExpenseResponseDto } from '../../dtos/ExpenseDto';
import { ExpenseMapper } from '../../mappers/ExpenseMapper';
import type { IIdGenerator } from '../../ports/IIdGenerator';

export class AddExpenseUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly groupRepository: IGroupRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(dto: AddExpenseDto): Promise<ExpenseResponseDto> {
    const groupId = GroupId.create(dto.groupId);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    const payerId = UserId.create(dto.payerId);
    if (!group.hasMember(payerId)) {
      throw new Error(`Payer "${dto.payerId}" is not a member of group "${dto.groupId}".`);
    }

    const totalAmount = Money.create(dto.amountInCents, dto.currency);

    const splits = dto.splits.map((s) => {
      const userId = UserId.create(s.userId);
      if (!group.hasMember(userId)) {
        throw new Error(
          `Split participant "${s.userId}" is not a member of group "${dto.groupId}".`,
        );
      }
      return {
        userId,
        share: Money.create(s.amountInCents, dto.currency),
      };
    });

    const expense = Expense.create({
      id: ExpenseId.create(this.idGenerator.generate()),
      groupId,
      payerId,
      amount: totalAmount,
      description: dto.description,
      splits,
      createdAt: new Date(),
    });

    await this.expenseRepository.save(expense);

    return ExpenseMapper.toResponseDto(expense);
  }
}
