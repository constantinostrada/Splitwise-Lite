/**
 * Group Entity
 *
 * A named collection of Users who share expenses together.
 * Enforces membership rules and naming invariants.
 *
 * Layer: Domain — no imports from outside this layer.
 */

import type { GroupId } from '../value-objects/GroupId';
import type { UserId } from '../value-objects/UserId';

export interface GroupProps {
  readonly id: GroupId;
  readonly name: string;
  readonly memberIds: ReadonlyArray<UserId>;
  readonly createdAt: Date;
}

export class Group {
  readonly id: GroupId;
  readonly name: string;
  readonly memberIds: ReadonlyArray<UserId>;
  readonly createdAt: Date;

  private constructor(props: GroupProps) {
    this.id = props.id;
    this.name = props.name;
    this.memberIds = props.memberIds;
    this.createdAt = props.createdAt;
  }

  static create(props: GroupProps): Group {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Group name must not be empty.');
    }
    if (props.name.trim().length > 120) {
      throw new Error('Group name must not exceed 120 characters.');
    }
    if (props.memberIds.length < 2) {
      throw new Error('A group must have at least 2 members.');
    }
    const uniqueIds = new Set(props.memberIds.map((id) => id.value));
    if (uniqueIds.size !== props.memberIds.length) {
      throw new Error('A group must not contain duplicate members.');
    }
    return new Group({ ...props, name: props.name.trim() });
  }

  hasMember(userId: UserId): boolean {
    return this.memberIds.some((id) => id.equals(userId));
  }

  addMember(userId: UserId): Group {
    if (this.hasMember(userId)) {
      throw new Error(`User ${userId.value} is already a member of this group.`);
    }
    return new Group({ ...this.toProps(), memberIds: [...this.memberIds, userId] });
  }

  removeMember(userId: UserId): Group {
    if (!this.hasMember(userId)) {
      throw new Error(`User ${userId.value} is not a member of this group.`);
    }
    const remaining = this.memberIds.filter((id) => !id.equals(userId));
    if (remaining.length < 2) {
      throw new Error('Removing this member would leave the group with fewer than 2 members.');
    }
    return new Group({ ...this.toProps(), memberIds: remaining });
  }

  equals(other: Group): boolean {
    return this.id.equals(other.id);
  }

  private toProps(): GroupProps {
    return {
      id: this.id,
      name: this.name,
      memberIds: this.memberIds,
      createdAt: this.createdAt,
    };
  }
}
