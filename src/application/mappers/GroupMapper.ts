/**
 * GroupMapper
 *
 * Layer: Application
 *
 * Translates the Group domain entity into a snake_case HTTP response.
 * Member hydration requires a `usersById` map to attach name+email to
 * each member entry.
 */

import type { Group } from '@/domain/entities/Group';
import type { User } from '@/domain/entities/User';

import type { GroupResponseDto } from '../dtos/GroupDto';

export class GroupMapper {
  static toResponseDto(group: Group, usersById: Map<string, User>): GroupResponseDto {
    return {
      id: group.id.value,
      name: group.name,
      members: group.members.map((m) => {
        const user = usersById.get(m.userId.value);
        return {
          user_id: m.userId.value,
          name: user ? user.name : '',
          email: user ? user.email.value : '',
          joined_at: m.joinedAt.toISOString(),
        };
      }),
      createdAt: group.createdAt.toISOString(),
    };
  }
}
