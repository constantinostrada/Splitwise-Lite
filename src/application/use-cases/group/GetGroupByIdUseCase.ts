/**
 * GetGroupByIdUseCase
 *
 * Layer: Application
 */

import { EntityNotFoundException } from '@/domain/exceptions/DomainException';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import { GroupId } from '@/domain/value-objects/GroupId';

import type { GetGroupDto, GroupResponseDto } from '../../dtos/GroupDto';
import { GroupMapper } from '../../mappers/GroupMapper';

export class GetGroupByIdUseCase {
  constructor(private readonly groupRepository: IGroupRepository) {}

  async execute(dto: GetGroupDto): Promise<GroupResponseDto> {
    const groupId = GroupId.create(dto.groupId);
    const group = await this.groupRepository.findById(groupId);

    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    return GroupMapper.toResponseDto(group);
  }
}
