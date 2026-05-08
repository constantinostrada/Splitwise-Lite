/**
 * GetUserByIdUseCase
 *
 * Retrieves a single user by their ID.
 *
 * Layer: Application
 */

import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import { UserId } from '@/domain/value-objects/UserId';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';

import type { GetUserByIdDto, UserResponseDto } from '../../dtos/UserDto';
import { UserMapper } from '../../mappers/UserMapper';

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: GetUserByIdDto): Promise<UserResponseDto> {
    const userId = UserId.create(dto.id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new EntityNotFoundException('User', dto.id);
    }

    return UserMapper.toResponseDto(user);
  }
}
