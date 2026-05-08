/**
 * Balance & Settlement DTOs
 *
 * Layer: Application
 */

export interface GetGroupBalancesDto {
  readonly groupId: string;
}

export interface SettlementResponseDto {
  readonly from_user_id: string;
  readonly to_user_id: string;
  /** Amount in the smallest currency unit (cents). */
  readonly amount: number;
}
