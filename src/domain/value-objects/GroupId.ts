/**
 * GroupId Value Object
 *
 * Layer: Domain
 */

export class GroupId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): GroupId {
    if (!value || value.trim().length === 0) {
      throw new Error('GroupId must not be empty.');
    }
    return new GroupId(value.trim());
  }

  equals(other: GroupId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
