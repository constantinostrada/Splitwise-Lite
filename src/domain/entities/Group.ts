/**
 * Group Entity
 *
 * A named collection of Users who share expenses together.
 * Each member carries the timestamp at which they joined the group.
 *
 * Layer: Domain — no imports from outside this layer.
 */

import type { GroupId } from '../value-objects/GroupId';
import type { UserId } from '../value-objects/UserId';

export interface GroupMember {
  readonly userId: UserId;
  readonly joinedAt: Date;
}

export interface GroupProps {
  readonly id: GroupId;
  readonly name: string;
  readonly members: ReadonlyArray<GroupMember>;
  readonly createdAt: Date;
}

export class Group {
  readonly id: GroupId;
  readonly name: string;
  readonly members: ReadonlyArray<GroupMember>;
  readonly createdAt: Date;

  private constructor(props: GroupProps) {
    this.id = props.id;
    this.name = props.name;
    this.members = props.members;
    this.createdAt = props.createdAt;
  }

  static create(props: GroupProps): Group {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Group name must not be empty.');
    }
    if (props.name.trim().length > 120) {
      throw new Error('Group name must not exceed 120 characters.');
    }
    const uniqueIds = new Set(props.members.map((m) => m.userId.value));
    if (uniqueIds.size !== props.members.length) {
      throw new Error('A group must not contain duplicate members.');
    }
    return new Group({ ...props, name: props.name.trim() });
  }

  get memberIds(): ReadonlyArray<UserId> {
    return this.members.map((m) => m.userId);
  }

  hasMember(userId: UserId): boolean {
    return this.members.some((m) => m.userId.equals(userId));
  }

  addMember(userId: UserId, joinedAt: Date): Group {
    if (this.hasMember(userId)) {
      throw new Error(`User ${userId.value} is already a member of this group.`);
    }
    return new Group({
      ...this.toProps(),
      members: [...this.members, { userId, joinedAt }],
    });
  }

  removeMember(userId: UserId): Group {
    if (!this.hasMember(userId)) {
      throw new Error(`User ${userId.value} is not a member of this group.`);
    }
    const remaining = this.members.filter((m) => !m.userId.equals(userId));
    return new Group({ ...this.toProps(), members: remaining });
  }

  equals(other: Group): boolean {
    return this.id.equals(other.id);
  }

  private toProps(): GroupProps {
    return {
      id: this.id,
      name: this.name,
      members: this.members,
      createdAt: this.createdAt,
    };
  }
}
