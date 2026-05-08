/**
 * Unit tests for the Money value object.
 *
 * Layer: Domain
 */

import { Money } from '../value-objects/Money';

describe('Money', () => {
  describe('create', () => {
    it('creates a valid Money instance', () => {
      const m = Money.create(1500, 'USD');
      expect(m.amountInCents).toBe(1500);
      expect(m.currency).toBe('USD');
    });

    it('normalises currency to uppercase', () => {
      const m = Money.create(100, 'usd');
      expect(m.currency).toBe('USD');
    });

    it('throws for negative amounts', () => {
      expect(() => Money.create(-1, 'USD')).toThrow('must not be negative');
    });

    it('throws for non-integer amounts', () => {
      expect(() => Money.create(10.5, 'USD')).toThrow('must be an integer');
    });

    it('throws for invalid currency codes', () => {
      expect(() => Money.create(100, 'US')).toThrow('ISO 4217');
    });
  });

  describe('fromDecimal', () => {
    it('converts a decimal to cents correctly', () => {
      const m = Money.fromDecimal(12.5, 'USD');
      expect(m.amountInCents).toBe(1250);
    });

    it('rounds half-pennies correctly', () => {
      const m = Money.fromDecimal(0.005, 'USD');
      expect(m.amountInCents).toBe(1); // Math.round rounds up
    });
  });

  describe('add', () => {
    it('sums two Money instances of the same currency', () => {
      const a = Money.create(300, 'USD');
      const b = Money.create(200, 'USD');
      expect(a.add(b).amountInCents).toBe(500);
    });

    it('throws for different currencies', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(100, 'EUR');
      expect(() => a.add(b)).toThrow('Currency mismatch');
    });
  });

  describe('splitEvenly', () => {
    it('splits 100 cents into 3 even parts with remainder in first', () => {
      const m = Money.create(100, 'USD');
      const parts = m.splitEvenly(3);
      expect(parts).toHaveLength(3);
      expect(parts[0]!.amountInCents).toBe(34); // 33 + 1 remainder
      expect(parts[1]!.amountInCents).toBe(33);
      expect(parts[2]!.amountInCents).toBe(33);
      const total = parts.reduce((s, p) => s + p.amountInCents, 0);
      expect(total).toBe(100);
    });

    it('throws for n < 1', () => {
      expect(() => Money.create(100, 'USD').splitEvenly(0)).toThrow('positive integer');
    });
  });

  describe('isZeroOrNegative', () => {
    it('returns true for zero', () => {
      expect(Money.create(0, 'USD').isZeroOrNegative()).toBe(true);
    });

    it('returns false for positive', () => {
      expect(Money.create(1, 'USD').isZeroOrNegative()).toBe(false);
    });
  });
});
