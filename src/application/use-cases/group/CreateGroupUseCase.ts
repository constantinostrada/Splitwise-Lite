/**
 * CreateGroupUseCase
 *
 * Creates a new expense-sharing group and validates that all supplied
 * member IDs belong to existing users.
 *
 * Layer: Application
 */

import { Group } from '@/domain/entities/Group';
import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { GroupId } from '@/domain/value-objects/GroupId';
import { UserId } from '@/domain/value-objects/UserId';

import type { CreateGroupDto, GroupResponseDto } from '../../dtos/GroupDto';
import { GroupMapper } from '../../mappers/GroupMapper';
import type { IIdGenerator } from '../../ports/IIdGenerator';

export class CreateGroupUseCase {
  constructor(
    private readonly groupRepository: IGroupRepository,
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(dto: CreateGroupDto): Promise<GroupResponseDto> {
    // Validate every member exists
    const memberIds: UserId[] = [];
    for (const rawId of dto.memberIds) {
      const userId = UserId.create(rawId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new EntityNotFoundException('User', rawId);
      }
      memberIds.push(userId);
    }

    const group = Group.create({
      id: GroupId.create(this.idGenerator.generate()),
      name: dto.name,
      memberIds,
      createdAt: new Date(),
    });

    await this.groupRepository.save(group);

    return GroupMapper.toResponseDto(group);
  }
}
