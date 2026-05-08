/**
 * Group DTOs
 *
 * Layer: Application
 */

// ── Input DTOs ───────────────────────────────────────────────────────────────

export interface CreateGroupDto {
  readonly name: string;
  /** IDs of the initial members — at least 2 required. */
  readonly memberIds: string[];
}

export interface GetGroupDto {
  readonly groupId: string;
}

// ── Output DTOs ──────────────────────────────────────────────────────────────

export interface GroupResponseDto {
  readonly id: string;
  readonly name: string;
  readonly memberIds: string[];
  readonly createdAt: string; // ISO 8601
}
