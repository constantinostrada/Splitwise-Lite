/**
 * CreateUserUseCase
 *
 * Registers a new user in the system.
 * Ensures no duplicate email exists before persisting.
 *
 * Layer: Application
 */

import {
  DuplicateEntityException,
} from '@/domain/exceptions/DomainException';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { UserId } from '@/domain/value-objects/UserId';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';

import type { IIdGenerator } from '../../ports/IIdGenerator';
import type { CreateUserDto, UserResponseDto } from '../../dtos/UserDto';
import { UserMapper } from '../../mappers/UserMapper';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = Email.create(dto.email);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new DuplicateEntityException('User', 'email', email.value);
    }

    const user = User.create({
      id: UserId.create(this.idGenerator.generate()),
      name: dto.name,
      email,
      createdAt: new Date(),
    });

    await this.userRepository.save(user);

    return UserMapper.toResponseDto(user);
  }
}
