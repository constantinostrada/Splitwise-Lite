/**
 * IGroupRepository — Domain Repository Interface
 *
 * Layer: Domain
 */

import type { Group } from '../entities/Group';
import type { GroupId } from '../value-objects/GroupId';
import type { UserId } from '../value-objects/UserId';

export interface IGroupRepository {
  findById(id: GroupId): Promise<Group | null>;
  findByMemberId(userId: UserId): Promise<Group[]>;
  save(group: Group): Promise<void>;
  delete(id: GroupId): Promise<void>;
}
