/**
 * AddExpenseUseCase
 *
 * Records a new expense within a group:
 *  - The group must exist.
 *  - The payer must be a member of the group (else BAD_REQUEST).
 *  - If `split_among_user_ids` is empty/omitted, splits among ALL group members.
 *  - Otherwise splits among the supplied users (all must be group members).
 *  - Shares are computed evenly; the LAST split absorbs any rounding remainder
 *    so the splits always sum exactly to `amount`.
 *
 * Layer: Application
 */

import { Expense } from '@/domain/entities/Expense';
import type { SplitShare } from '@/domain/entities/Expense';
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

const DEFAULT_CURRENCY = 'USD';

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

    const payerId = UserId.create(dto.paid_by_user_id);
    if (!group.hasMember(payerId)) {
      throw new Error(
        `User "${dto.paid_by_user_id}" is not a member of group "${dto.groupId}".`,
      );
    }

    const participantIds: UserId[] =
      dto.split_among_user_ids && dto.split_among_user_ids.length > 0
        ? dto.split_among_user_ids.map((id) => UserId.create(id))
        : group.memberIds.map((m) => m);

    for (const participant of participantIds) {
      if (!group.hasMember(participant)) {
        throw new Error(
          `User "${participant.value}" is not a member of group "${dto.groupId}".`,
        );
      }
    }

    const totalAmount = Money.create(dto.amount, DEFAULT_CURRENCY);
    const splits = this.computeSplits(participantIds, totalAmount);

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

  private computeSplits(
    participants: ReadonlyArray<UserId>,
    total: Money,
  ): SplitShare[] {
    const n = participants.length;
    const base = Math.floor(total.amountInCents / n);
    const remainder = total.amountInCents - base * n;
    return participants.map((userId, i) => ({
      userId,
      share: Money.create(
        i === n - 1 ? base + remainder : base,
        total.currency,
      ),
    }));
  }
}
