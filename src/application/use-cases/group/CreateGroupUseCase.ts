/**
 * CreateGroupUseCase
 *
 * Creates a new expense-sharing group with the supplied owner as the
 * first (and only) member. Additional members are added later via
 * AddMemberToGroupUseCase.
 *
 * Layer: Application
 */

import { Group } from '@/domain/entities/Group';
import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { User } from '@/domain/entities/User';
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
    const ownerId = UserId.create(dto.owner_user_id);
    const owner = await this.userRepository.findById(ownerId);
    if (!owner) {
      throw new EntityNotFoundException('User', dto.owner_user_id);
    }

    const now = new Date();
    const group = Group.create({
      id: GroupId.create(this.idGenerator.generate()),
      name: dto.name,
      members: [{ userId: ownerId, joinedAt: now }],
      createdAt: now,
    });

    await this.groupRepository.save(group);

    const usersById = new Map<string, User>([[ownerId.value, owner]]);
    return GroupMapper.toResponseDto(group, usersById);
  }
}
