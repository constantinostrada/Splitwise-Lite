/**
 * UserId Value Object
 *
 * A strongly-typed, immutable wrapper around a UUID string.
 * Equality is determined by value, not reference.
 *
 * Layer: Domain
 */

export class UserId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): UserId {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId must not be empty.');
    }
    return new UserId(value.trim());
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
