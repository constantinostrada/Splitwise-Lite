/**
 * GetGroupByIdUseCase
 *
 * Layer: Application
 */

import type { User } from '@/domain/entities/User';
import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { GroupId } from '@/domain/value-objects/GroupId';

import type { GetGroupDto, GroupResponseDto } from '../../dtos/GroupDto';
import { GroupMapper } from '../../mappers/GroupMapper';

export class GetGroupByIdUseCase {
  constructor(
    private readonly groupRepository: IGroupRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: GetGroupDto): Promise<GroupResponseDto> {
    const groupId = GroupId.create(dto.groupId);
    const group = await this.groupRepository.findById(groupId);

    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    const usersById = new Map<string, User>();
    for (const member of group.members) {
      const user = await this.userRepository.findById(member.userId);
      if (user) {
        usersById.set(member.userId.value, user);
      }
    }

    return GroupMapper.toResponseDto(group, usersById);
  }
}
