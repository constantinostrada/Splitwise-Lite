/**
 * GetGroupBalancesUseCase
 *
 * Computes the minimum set of transfers required to settle every member's
 * balance within a group. Returns one entry per recommended transfer:
 *   { from_user_id, to_user_id, amount }
 *
 * Layer: Application
 */

import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import { BalanceCalculator } from '@/domain/services/BalanceCalculator';
import { GroupId } from '@/domain/value-objects/GroupId';

import type {
  GetGroupBalancesDto,
  SettlementResponseDto,
} from '../../dtos/BalanceDto';

export class GetGroupBalancesUseCase {
  private readonly calculator = new BalanceCalculator();

  constructor(
    private readonly groupRepository: IGroupRepository,
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(dto: GetGroupBalancesDto): Promise<SettlementResponseDto[]> {
    const groupId = GroupId.create(dto.groupId);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    const expenses = await this.expenseRepository.findByGroupId(groupId);
    const balances = this.calculator.computeBalances(expenses);
    const settlements = this.calculator.minimiseSettlements(balances);

    return settlements.map((s) => ({
      from_user_id: s.fromUserId.value,
      to_user_id: s.toUserId.value,
      amount: s.amountCents,
    }));
  }
}
