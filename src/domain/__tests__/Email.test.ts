/**
 * Unit tests for the Email value object.
 *
 * Layer: Domain
 */

import { Email } from '../value-objects/Email';

describe('Email', () => {
  it('creates a valid email and normalises to lowercase', () => {
    const email = Email.create('Alice@Example.COM');
    expect(email.value).toBe('alice@example.com');
  });

  it('throws for an invalid email address', () => {
    expect(() => Email.create('not-an-email')).toThrow('not a valid email address');
  });

  it('throws for an empty string', () => {
    expect(() => Email.create('')).toThrow('must not be empty');
  });

  it('compares two equal emails correctly', () => {
    const a = Email.create('test@example.com');
    const b = Email.create('TEST@EXAMPLE.COM');
    expect(a.equals(b)).toBe(true);
  });
});
