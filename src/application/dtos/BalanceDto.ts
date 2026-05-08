/**
 * Balance & Settlement DTOs
 *
 * Layer: Application
 */

export interface GetGroupBalancesDto {
  readonly groupId: string;
}

export interface UserBalanceResponseDto {
  readonly userId: string;
  /** Positive = owed money; negative = owes money. */
  readonly netAmountInCents: number;
  readonly currency: string;
}

export interface SettlementResponseDto {
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly amountInCents: number;
  readonly currency: string;
}

export interface GroupBalancesResponseDto {
  readonly groupId: string;
  readonly balances: UserBalanceResponseDto[];
  readonly settlements: SettlementResponseDto[];
}
