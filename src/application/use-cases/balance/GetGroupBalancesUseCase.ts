/**
 * GetGroupBalancesUseCase
 *
 * Computes the net balance for every group member and
 * suggests a minimal set of payments to settle all debts.
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
  GroupBalancesResponseDto,
} from '../../dtos/BalanceDto';

export class GetGroupBalancesUseCase {
  private readonly calculator = new BalanceCalculator();

  constructor(
    private readonly groupRepository: IGroupRepository,
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(dto: GetGroupBalancesDto): Promise<GroupBalancesResponseDto> {
    const groupId = GroupId.create(dto.groupId);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    const expenses = await this.expenseRepository.findByGroupId(groupId);

    const balances = this.calculator.computeBalances(expenses);
    const settlements = this.calculator.minimiseSettlements(balances);

    return {
      groupId: dto.groupId,
      balances: balances.map((b) => ({
        userId: b.userId.value,
        netAmountInCents: b.netCents,
        currency: b.currency,
      })),
      settlements: settlements.map((s) => ({
        fromUserId: s.fromUserId.value,
        toUserId: s.toUserId.value,
        amountInCents: s.amountCents,
        currency: s.currency,
      })),
    };
  }
}
