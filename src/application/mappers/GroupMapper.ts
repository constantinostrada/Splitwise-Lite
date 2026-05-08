/**
 * GroupMapper
 *
 * Layer: Application
 */

import type { Group } from '@/domain/entities/Group';

import type { GroupResponseDto } from '../dtos/GroupDto';

export class GroupMapper {
  static toResponseDto(group: Group): GroupResponseDto {
    return {
      id: group.id.value,
      name: group.name,
      memberIds: group.memberIds.map((id) => id.value),
      createdAt: group.createdAt.toISOString(),
    };
  }
}
