/**
 * User DTOs
 *
 * Plain data shapes used as inputs and outputs for User use cases.
 * No domain entity types leak beyond the application boundary.
 *
 * Layer: Application
 */

// ── Input DTOs ───────────────────────────────────────────────────────────────

export interface CreateUserDto {
  readonly name: string;
  readonly email: string;
}

export interface UpdateUserDto {
  readonly id: string;
  readonly name: string;
}

export interface GetUserByIdDto {
  readonly id: string;
}

// ── Output DTOs ──────────────────────────────────────────────────────────────

export interface UserResponseDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: string; // ISO 8601
}
