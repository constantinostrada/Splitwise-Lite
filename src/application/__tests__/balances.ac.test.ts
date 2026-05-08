/**
 * Acceptance criteria tests for "Cálculo de balances del grupo".
 *
 * Each `it` block maps to a single AC from the task spec and is the test
 * referenced by `chiron task ac assert`. We exercise the use cases with the
 * in-memory infrastructure so the full request → use case → repository chain
 * is covered without booting the HTTP server.
 *
 * Layer: Application (test)
 */

import { InMemoryExpenseRepository } from '@/infrastructure/persistence/InMemoryExpenseRepository';
import { InMemoryGroupRepository } from '@/infrastructure/persistence/InMemoryGroupRepository';
import { InMemoryUserRepository } from '@/infrastructure/persistence/InMemoryUserRepository';

import type { IIdGenerator } from '../ports/IIdGenerator';
import { GetGroupBalancesUseCase } from '../use-cases/balance/GetGroupBalancesUseCase';
import { AddExpenseUseCase } from '../use-cases/expense/AddExpenseUseCase';
import { AddMemberToGroupUseCase } from '../use-cases/group/AddMemberToGroupUseCase';
import { CreateGroupUseCase } from '../use-cases/group/CreateGroupUseCase';
import { CreateUserUseCase } from '../use-cases/user/CreateUserUseCase';

class SequentialIdGenerator implements IIdGenerator {
  private counter = 0;
  generate(): string {
    return `id-${++this.counter}`;
  }
}

const NAMES = ['Alice', 'Bob', 'Carol', 'Dave'] as const;

async function makeStack(memberCount: 2 | 3 | 4 = 3) {
  const userRepo = new InMemoryUserRepository();
  const groupRepo = new InMemoryGroupRepository();
  const expenseRepo = new InMemoryExpenseRepository();
  const idGen = new SequentialIdGenerator();

  const createUser = new CreateUserUseCase(userRepo, idGen);
  const createGroup = new CreateGroupUseCase(groupRepo, userRepo, idGen);
  const addMember = new AddMemberToGroupUseCase(groupRepo, userRepo);
  const addExpense = new AddExpenseUseCase(expenseRepo, groupRepo, idGen);
  const getBalances = new GetGroupBalancesUseCase(groupRepo, expenseRepo);

  const users: { id: string; name: string }[] = [];
  for (let i = 0; i < memberCount; i++) {
    const name = NAMES[i]!;
    users.push(
      await createUser.execute({
        name,
        email: `${name.toLowerCase()}@example.com`,
      }),
    );
  }

  const group = await createGroup.execute({
    name: 'Trip',
    owner_user_id: users[0]!.id,
  });
  for (const u of users.slice(1)) {
    await addMember.execute({ groupId: group.id, user_id: u.id });
  }

  return { addExpense, getBalances, group, users };
}

describe('Balances AC suite', () => {
  it('AC-1: GET /groups/:id/balances returns minimal transfers as [{from_user_id, to_user_id, amount}] (simple 2-person scenario)', async () => {
    const { addExpense, getBalances, group, users } = await makeStack(2);
    const [alice, bob] = users;

    // Alice paid 4000, split evenly with Bob → Bob owes Alice 2000.
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice!.id,
      amount: 4000,
      description: 'Dinner',
    });

    const transfers = await getBalances.execute({ groupId: group.id });

    expect(Array.isArray(transfers)).toBe(true);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toEqual({
      from_user_id: bob!.id,
      to_user_id: alice!.id,
      amount: 2000,
    });
    // Shape: every entry has exactly the three documented fields.
    for (const t of transfers) {
      expect(Object.keys(t).sort()).toEqual(
        ['amount', 'from_user_id', 'to_user_id'].sort(),
      );
      expect(typeof t.amount).toBe('number');
      expect(Number.isInteger(t.amount)).toBe(true);
    }
  });

  it('AC-2: overpayer appears as to_user_id (receives), underpayer as from_user_id (owes)', async () => {
    const { addExpense, getBalances, group, users } = await makeStack(3);
    const [alice, bob, carol] = users;

    // Alice fronts the entire 3000 expense — she has overpaid.
    // Bob and Carol each owe 1000 to Alice (underpayers).
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice!.id,
      amount: 3000,
      description: 'Hotel',
    });

    const transfers = await getBalances.execute({ groupId: group.id });

    expect(transfers).toHaveLength(2);

    // Alice (overpayer) must only ever be `to_user_id`.
    expect(transfers.every((t) => t.to_user_id === alice!.id)).toBe(true);
    expect(transfers.every((t) => t.from_user_id !== alice!.id)).toBe(true);

    // Bob & Carol (underpayers) must only ever be `from_user_id`.
    const fromIds = transfers.map((t) => t.from_user_id).sort();
    expect(fromIds).toEqual([bob!.id, carol!.id].sort());
    expect(transfers.every((t) => t.amount === 1000)).toBe(true);
  });

  it('AC-3: returns [] when everyone is settled (balanced group)', async () => {
    const { addExpense, getBalances, group, users } = await makeStack(3);
    const [alice, bob, carol] = users;

    // Three identical expenses, each paid by a different member and split
    // evenly — every member's net is zero.
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice!.id,
      amount: 3000,
      description: 'Day 1',
    });
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: bob!.id,
      amount: 3000,
      description: 'Day 2',
    });
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: carol!.id,
      amount: 3000,
      description: 'Day 3',
    });

    const transfers = await getBalances.execute({ groupId: group.id });

    expect(transfers).toEqual([]);
  });

  it('AC-4: minimises the number of transfers (no circular flow) for a 4-person group with complex imbalance', async () => {
    const { addExpense, getBalances, group, users } = await makeStack(4);
    const [alice, bob, carol, dave] = users;

    // Two expenses, all four members participating in each.
    // Alice pays 1000 → each member owes 250.
    // Bob   pays  600 → each member owes 150.
    // Net balances (cents): Alice +600, Bob +200, Carol -400, Dave -400. Sum = 0.
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice!.id,
      amount: 1000,
      description: 'Groceries',
    });
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: bob!.id,
      amount: 600,
      description: 'Gas',
    });

    const transfers = await getBalances.execute({ groupId: group.id });

    // For N members with non-zero balance the greedy algorithm produces at
    // most N-1 transfers. With 4 unbalanced members ≤ 3 transfers.
    expect(transfers.length).toBeLessThanOrEqual(3);
    expect(transfers.length).toBeGreaterThan(0);

    // No user appears as both a payer and a receiver: there are no circular
    // transfers (Alice → Bob → Carol → Alice would leak through this check).
    const senders = new Set(transfers.map((t) => t.from_user_id));
    const receivers = new Set(transfers.map((t) => t.to_user_id));
    for (const id of senders) {
      expect(receivers.has(id)).toBe(false);
    }

    // Total settled cents equals the absolute imbalance (800).
    const totalSettled = transfers.reduce((acc, t) => acc + t.amount, 0);
    expect(totalSettled).toBe(800);

    // Per-user post-settlement balance must be exactly zero.
    const net = new Map<string, number>([
      [alice!.id, +600],
      [bob!.id, +200],
      [carol!.id, -400],
      [dave!.id, -400],
    ]);
    for (const t of transfers) {
      net.set(t.from_user_id, net.get(t.from_user_id)! + t.amount);
      net.set(t.to_user_id, net.get(t.to_user_id)! - t.amount);
    }
    for (const v of net.values()) {
      expect(v).toBe(0);
    }
  });

  it('AC-5: single-expense scenario — one payer, N-1 owers, produces N-1 inbound transfers', async () => {
    const { addExpense, getBalances, group, users } = await makeStack(3);
    const [alice, bob, carol] = users;

    // The only expense in the group: Alice pays 300 split among all three.
    // Each ower owes 100 to Alice. The greedy algorithm should emit exactly
    // 2 inbound transfers, both pointing at Alice.
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice!.id,
      amount: 300,
      description: 'Coffee',
    });

    const transfers = await getBalances.execute({ groupId: group.id });

    expect(transfers).toHaveLength(2);
    for (const t of transfers) {
      expect(t.to_user_id).toBe(alice!.id);
      expect(t.amount).toBe(100);
    }
    expect(transfers.map((t) => t.from_user_id).sort()).toEqual(
      [bob!.id, carol!.id].sort(),
    );
  });
});
