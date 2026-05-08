/**
 * Email Value Object
 *
 * Immutable, self-validating email address.
 * Normalised to lowercase on construction.
 *
 * Layer: Domain
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Email {
    if (!raw || raw.trim().length === 0) {
      throw new Error('Email must not be empty.');
    }
    const normalised = raw.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalised)) {
      throw new Error(`"${raw}" is not a valid email address.`);
    }
    return new Email(normalised);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
