/**
 * User Entity
 *
 * Represents a participant in an expense group.
 * Protects its own invariants — invalid state cannot be constructed.
 *
 * Layer: Domain — no imports from outside this layer.
 */

import type { UserId } from '../value-objects/UserId';
import type { Email } from '../value-objects/Email';

export interface UserProps {
  readonly id: UserId;
  readonly name: string;
  readonly email: Email;
  readonly createdAt: Date;
}

export class User {
  readonly id: UserId;
  readonly name: string;
  readonly email: Email;
  readonly createdAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.createdAt = props.createdAt;
  }

  static create(props: UserProps): User {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('User name must not be empty.');
    }
    if (props.name.trim().length > 100) {
      throw new Error('User name must not exceed 100 characters.');
    }
    return new User({ ...props, name: props.name.trim() });
  }

  /**
   * Returns a new User with an updated name (entities are not mutated in-place).
   */
  rename(newName: string): User {
    return User.create({ ...this.toProps(), name: newName });
  }

  equals(other: User): boolean {
    return this.id.equals(other.id);
  }

  private toProps(): UserProps {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
    };
  }
}
