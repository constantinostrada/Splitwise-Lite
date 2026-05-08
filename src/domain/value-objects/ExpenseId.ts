/**
 * ExpenseId Value Object
 *
 * Layer: Domain
 */

export class ExpenseId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): ExpenseId {
    if (!value || value.trim().length === 0) {
      throw new Error('ExpenseId must not be empty.');
    }
    return new ExpenseId(value.trim());
  }

  equals(other: ExpenseId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
