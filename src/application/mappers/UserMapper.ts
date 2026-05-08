/**
 * UserMapper
 *
 * Converts between domain User entities and application-layer DTOs.
 * Use cases return DTOs, never raw entities, to protect the domain boundary.
 *
 * Layer: Application
 */

import type { User } from '@/domain/entities/User';

import type { UserResponseDto } from '../dtos/UserDto';

export class UserMapper {
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id.value,
      name: user.name,
      email: user.email.value,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
