/**
 * InMemoryGroupRepository
 *
 * Layer: Infrastructure
 */

import type { Group } from '@/domain/entities/Group';
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository';
import type { GroupId } from '@/domain/value-objects/GroupId';
import type { UserId } from '@/domain/value-objects/UserId';

export class InMemoryGroupRepository implements IGroupRepository {
  private readonly store = new Map<string, Group>();

  async findById(id: GroupId): Promise<Group | null> {
    return this.store.get(id.value) ?? null;
  }

  async findByMemberId(userId: UserId): Promise<Group[]> {
    return Array.from(this.store.values()).filter((g) => g.hasMember(userId));
  }

  async save(group: Group): Promise<void> {
    this.store.set(group.id.value, group);
  }

  async delete(id: GroupId): Promise<void> {
    this.store.delete(id.value);
  }

  clear(): void {
    this.store.clear();
  }
}
