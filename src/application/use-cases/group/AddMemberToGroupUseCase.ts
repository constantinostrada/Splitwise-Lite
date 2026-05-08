/**
 * AddMemberToGroupUseCase
 *
 * Adds a user as a member of an existing group. Throws EntityNotFoundException
 * (-> 404) when the group or user does not exist, and DuplicateEntityException
 * (-> 409) when the user is already a member.
 *
 * Layer: Application
 */

import type { User } from '@/domain/entities/User';
import {
  DuplicateEntityException,
  EntityNotFoundException,
} from '@/domain/exceptions/DomainException';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { GroupId } from '@/domain/value-objects/GroupId';
import { UserId } from '@/domain/value-objects/UserId';

import type { AddGroupMemberDto, GroupResponseDto } from '../../dtos/GroupDto';
import { GroupMapper } from '../../mappers/GroupMapper';

export class AddMemberToGroupUseCase {
  constructor(
    private readonly groupRepository: IGroupRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: AddGroupMemberDto): Promise<GroupResponseDto> {
    const groupId = GroupId.create(dto.groupId);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    const userId = UserId.create(dto.user_id);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', dto.user_id);
    }

    if (group.hasMember(userId)) {
      throw new DuplicateEntityException('GroupMember', 'userId', dto.user_id);
    }

    const updated = group.addMember(userId, new Date());
    await this.groupRepository.save(updated);

    const usersById = new Map<string, User>();
    for (const member of updated.members) {
      const u = await this.userRepository.findById(member.userId);
      if (u) usersById.set(member.userId.value, u);
    }

    return GroupMapper.toResponseDto(updated, usersById);
  }
}
