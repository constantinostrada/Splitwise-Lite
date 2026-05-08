/**
 * BalanceCalculator — Domain Service
 *
 * Calculates the net balance each member owes or is owed within a group,
 * and produces a minimal set of settlement transactions.
 *
 * This logic does not naturally belong to any single entity, so it lives
 * in a domain service. It receives its inputs as plain arguments.
 *
 * Layer: Domain — zero third-party dependencies.
 */

import type { Expense } from '../entities/Expense';
import type { UserId } from '../value-objects/UserId';

/** Net balance for a single user: positive = owed money, negative = owes money. */
export interface UserBalance {
  readonly userId: UserId;
  /** Balance in the smallest currency unit (cents). */
  readonly netCents: number;
  readonly currency: string;
}

/** A single recommended payment to settle debts. */
export interface Settlement {
  readonly fromUserId: UserId;
  readonly toUserId: UserId;
  readonly amountCents: number;
  readonly currency: string;
}

export class BalanceCalculator {
  /**
   * Computes the net balance per user across all provided expenses.
   * All expenses must share the same currency.
   */
  computeBalances(expenses: ReadonlyArray<Expense>): UserBalance[] {
    if (expenses.length === 0) return [];

    const currency = expenses[0]!.amount.currency;
    const netMap = new Map<string, { userId: UserId; netCents: number }>();

    for (const expense of expenses) {
      if (expense.amount.currency !== currency) {
        throw new Error('All expenses in a settlement must use the same currency.');
      }

      // The payer is credited the full expense amount
      this.adjustBalance(netMap, expense.payerId, +expense.amount.amountInCents);

      // Each participant in the split is debited their share
      for (const split of expense.splits) {
        this.adjustBalance(netMap, split.userId, -split.share.amountInCents);
      }
    }

    return Array.from(netMap.values()).map((entry) => ({
      userId: entry.userId,
      netCents: entry.netCents,
      currency,
    }));
  }

  /**
   * Produces a minimal list of settlements (payments) that resolve all debts.
   * Uses a greedy algorithm: largest creditor receives from largest debtor first.
   */
  minimiseSettlements(balances: ReadonlyArray<UserBalance>): Settlement[] {
    if (balances.length === 0) return [];

    const currency = balances[0]!.currency;

    // Mutable working copies
    const debtors = balances
      .filter((b) => b.netCents < 0)
      .map((b) => ({ userId: b.userId, cents: -b.netCents }))
      .sort((a, b) => b.cents - a.cents);

    const creditors = balances
      .filter((b) => b.netCents > 0)
      .map((b) => ({ userId: b.userId, cents: b.netCents }))
      .sort((a, b) => b.cents - a.cents);

    const settlements: Settlement[] = [];

    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d]!;
      const creditor = creditors[c]!;

      const amount = Math.min(debtor.cents, creditor.cents);

      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountCents: amount,
        currency,
      });

      debtor.cents -= amount;
      creditor.cents -= amount;

      if (debtor.cents === 0) d++;
      if (creditor.cents === 0) c++;
    }

    return settlements;
  }

  private adjustBalance(
    map: Map<string, { userId: UserId; netCents: number }>,
    userId: UserId,
    deltaCents: number,
  ): void {
    const key = userId.value;
    const existing = map.get(key);
    if (existing) {
      existing.netCents += deltaCents;
    } else {
      map.set(key, { userId, netCents: deltaCents });
    }
  }
}
