/**
 * Unit tests for the BalanceCalculator domain service.
 *
 * Layer: Domain
 */

import { Expense } from '../entities/Expense';
import { BalanceCalculator } from '../services/BalanceCalculator';
import { ExpenseId } from '../value-objects/ExpenseId';
import { GroupId } from '../value-objects/GroupId';
import { Money } from '../value-objects/Money';
import { UserId } from '../value-objects/UserId';

const groupId = GroupId.create('group-1');
const alice = UserId.create('alice');
const bob = UserId.create('bob');
const carol = UserId.create('carol');

function makeExpense(
  payerId: UserId,
  amountCents: number,
  splits: Array<{ userId: UserId; cents: number }>,
): Expense {
  const amount = Money.create(amountCents, 'USD');
  return Expense.create({
    id: ExpenseId.create(Math.random().toString()),
    groupId,
    payerId,
    amount,
    description: 'Test expense',
    splits: splits.map((s) => ({
      userId: s.userId,
      share: Money.create(s.cents, 'USD'),
    })),
    createdAt: new Date(),
  });
}

describe('BalanceCalculator', () => {
  const calculator = new BalanceCalculator();

  describe('computeBalances', () => {
    it('returns empty array for no expenses', () => {
      expect(calculator.computeBalances([])).toEqual([]);
    });

    it('computes correct balances for a simple two-person expense', () => {
      const expense = makeExpense(alice, 6000, [
        { userId: alice, cents: 3000 },
        { userId: bob, cents: 3000 },
      ]);

      const balances = calculator.computeBalances([expense]);
      const aliceBalance = balances.find((b) => b.userId.equals(alice));
      const bobBalance = balances.find((b) => b.userId.equals(bob));

      // Alice paid 60, owes 30 → net +30
      expect(aliceBalance?.netCents).toBe(3000);
      // Bob paid 0, owes 30 → net -30
      expect(bobBalance?.netCents).toBe(-3000);
    });

    it('handles multiple expenses correctly', () => {
      // Alice pays $60 split equally (3-way)
      const e1 = makeExpense(alice, 6000, [
        { userId: alice, cents: 2000 },
        { userId: bob,   cents: 2000 },
        { userId: carol, cents: 2000 },
      ]);
      // Bob pays $30 split equally (3-way)
      const e2 = makeExpense(bob, 3000, [
        { userId: alice, cents: 1000 },
        { userId: bob,   cents: 1000 },
        { userId: carol, cents: 1000 },
      ]);

      const balances = calculator.computeBalances([e1, e2]);
      const net = Object.fromEntries(
        balances.map((b) => [b.userId.value, b.netCents]),
      );

      // alice: +6000 - 2000 - 1000 = +3000
      expect(net['alice']).toBe(3000);
      // bob:   +3000 - 2000 - 1000 = 0
      expect(net['bob']).toBe(0);
      // carol:        -2000 - 1000 = -3000
      expect(net['carol']).toBe(-3000);
    });
  });

  describe('minimiseSettlements', () => {
    it('produces a single settlement for two people', () => {
      const balances = [
        { userId: alice, netCents: 3000,  currency: 'USD' },
        { userId: bob,   netCents: -3000, currency: 'USD' },
      ];

      const settlements = calculator.minimiseSettlements(balances);
      expect(settlements).toHaveLength(1);
      expect(settlements[0]!.fromUserId.equals(bob)).toBe(true);
      expect(settlements[0]!.toUserId.equals(alice)).toBe(true);
      expect(settlements[0]!.amountCents).toBe(3000);
    });

    it('minimises to 2 settlements for 3 people', () => {
      // alice +3000, bob -1000, carol -2000
      const balances = [
        { userId: alice, netCents:  3000, currency: 'USD' },
        { userId: bob,   netCents: -1000, currency: 'USD' },
        { userId: carol, netCents: -2000, currency: 'USD' },
      ];

      const settlements = calculator.minimiseSettlements(balances);
      expect(settlements).toHaveLength(2);

      const total = settlements.reduce((s, t) => s + t.amountCents, 0);
      expect(total).toBe(3000);
    });

    it('returns empty array for empty balances', () => {
      expect(calculator.minimiseSettlements([])).toEqual([]);
    });
  });
});
