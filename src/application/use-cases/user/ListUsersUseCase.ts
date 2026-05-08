/**
 * ListUsersUseCase
 *
 * Returns all registered users.
 *
 * Layer: Application
 */

import type { IUserRepository } from '@/domain/repositories/IUserRepository';

import type { UserResponseDto } from '../../dtos/UserDto';
import { UserMapper } from '../../mappers/UserMapper';

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map(UserMapper.toResponseDto);
  }
}
