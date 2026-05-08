/**
 * Group DTOs
 *
 * Layer: Application
 *
 * HTTP boundary uses snake_case for inputs/outputs (owner_user_id, user_id,
 * joined_at). Domain stays camelCase; mappers translate.
 */

// ── Input DTOs ───────────────────────────────────────────────────────────────

export interface CreateGroupDto {
  readonly name: string;
  readonly owner_user_id: string;
}

export interface GetGroupDto {
  readonly groupId: string;
}

export interface AddGroupMemberDto {
  readonly groupId: string;
  readonly user_id: string;
}

// ── Output DTOs ──────────────────────────────────────────────────────────────

export interface GroupMemberResponseDto {
  readonly user_id: string;
  readonly name: string;
  readonly email: string;
  readonly joined_at: string; // ISO 8601
}

export interface GroupResponseDto {
  readonly id: string;
  readonly name: string;
  readonly members: ReadonlyArray<GroupMemberResponseDto>;
  readonly createdAt: string; // ISO 8601
}
