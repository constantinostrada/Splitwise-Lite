/**
 * Money Value Object
 *
 * Represents a monetary amount as an integer count of the smallest currency
 * unit (e.g. cents for USD/EUR) to avoid floating-point rounding errors.
 *
 * Layer: Domain
 */

export class Money {
  /** Amount stored in the smallest unit (e.g. cents). */
  readonly amountInCents: number;
  readonly currency: string;

  private constructor(amountInCents: number, currency: string) {
    this.amountInCents = amountInCents;
    this.currency = currency;
  }

  /**
   * @param amountInCents Must be a non-negative integer.
   * @param currency      ISO 4217 currency code (e.g. "USD").
   */
  static create(amountInCents: number, currency: string): Money {
    if (!Number.isInteger(amountInCents)) {
      throw new Error('Money amount must be an integer number of cents.');
    }
    if (amountInCents < 0) {
      throw new Error('Money amount must not be negative.');
    }
    const normalisedCurrency = currency.trim().toUpperCase();
    if (normalisedCurrency.length !== 3) {
      throw new Error('Currency must be a valid 3-letter ISO 4217 code.');
    }
    return new Money(amountInCents, normalisedCurrency);
  }

  /** Convenience factory: converts a decimal amount (e.g. 12.50) to cents. */
  static fromDecimal(amount: number, currency: string): Money {
    return Money.create(Math.round(amount * 100), currency);
  }

  isZeroOrNegative(): boolean {
    return this.amountInCents <= 0;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountInCents + other.amountInCents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountInCents - other.amountInCents, this.currency);
  }

  /** Splits this amount into N equal parts. Returns remainder in the first element. */
  splitEvenly(n: number): Money[] {
    if (!Number.isInteger(n) || n < 1) {
      throw new Error('Split count must be a positive integer.');
    }
    const base = Math.floor(this.amountInCents / n);
    const remainder = this.amountInCents % n;
    return Array.from({ length: n }, (_, i) =>
      new Money(base + (i === 0 ? remainder : 0), this.currency),
    );
  }

  toDecimal(): number {
    return this.amountInCents / 100;
  }

  equals(other: Money): boolean {
    return this.amountInCents === other.amountInCents && this.currency === other.currency;
  }

  toString(): string {
    return `${this.toDecimal().toFixed(2)} ${this.currency}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this.currency} and ${other.currency}.`,
      );
    }
  }
}
