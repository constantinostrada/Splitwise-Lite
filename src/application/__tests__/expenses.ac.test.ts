/**
 * Acceptance criteria tests for "Registrar gastos split nuevo".
 *
 * Each `it` block maps to a single AC from the task spec and is the test
 * referenced by `chiron task ac assert`. We exercise the use cases with the
 * in-memory infrastructure so the full request → use case → repository chain
 * is covered without booting the HTTP server.
 *
 * Layer: Application (test)
 */

import { GroupId } from '@/domain/value-objects/GroupId';
import { InMemoryExpenseRepository } from '@/infrastructure/persistence/InMemoryExpenseRepository';
import { InMemoryGroupRepository } from '@/infrastructure/persistence/InMemoryGroupRepository';
import { InMemoryUserRepository } from '@/infrastructure/persistence/InMemoryUserRepository';

import type { IIdGenerator } from '../ports/IIdGenerator';
import { AddExpenseUseCase } from '../use-cases/expense/AddExpenseUseCase';
import { GetGroupExpensesUseCase } from '../use-cases/expense/GetGroupExpensesUseCase';
import { AddMemberToGroupUseCase } from '../use-cases/group/AddMemberToGroupUseCase';
import { CreateGroupUseCase } from '../use-cases/group/CreateGroupUseCase';
import { CreateUserUseCase } from '../use-cases/user/CreateUserUseCase';

class SequentialIdGenerator implements IIdGenerator {
  private counter = 0;
  generate(): string {
    return `id-${++this.counter}`;
  }
}

async function makeStack() {
  const userRepo = new InMemoryUserRepository();
  const groupRepo = new InMemoryGroupRepository();
  const expenseRepo = new InMemoryExpenseRepository();
  const idGen = new SequentialIdGenerator();

  const createUser = new CreateUserUseCase(userRepo, idGen);
  const createGroup = new CreateGroupUseCase(groupRepo, userRepo, idGen);
  const addMember = new AddMemberToGroupUseCase(groupRepo, userRepo);
  const addExpense = new AddExpenseUseCase(expenseRepo, groupRepo, idGen);
  const getGroupExpenses = new GetGroupExpensesUseCase(expenseRepo, groupRepo);

  const alice = await createUser.execute({ name: 'Alice', email: 'alice@example.com' });
  const bob = await createUser.execute({ name: 'Bob', email: 'bob@example.com' });
  const carol = await createUser.execute({ name: 'Carol', email: 'carol@example.com' });
  const outsider = await createUser.execute({
    name: 'Outsider',
    email: 'outsider@example.com',
  });

  const group = await createGroup.execute({
    name: 'Trip',
    owner_user_id: alice.id,
  });
  await addMember.execute({ groupId: group.id, user_id: bob.id });
  await addMember.execute({ groupId: group.id, user_id: carol.id });

  return {
    expenseRepo,
    addExpense,
    getGroupExpenses,
    group,
    alice,
    bob,
    carol,
    outsider,
  };
}

describe('Expenses AC suite', () => {
  it('AC-1: POST /groups/:id/expenses persists expense + N splits', async () => {
    const { addExpense, expenseRepo, group, alice, bob } = await makeStack();

    const result = await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice.id,
      amount: 4000,
      description: 'Dinner',
      split_among_user_ids: [alice.id, bob.id],
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        group_id: group.id,
        paid_by_user_id: alice.id,
        amount: 4000,
        description: 'Dinner',
        created_at: expect.any(String),
      }),
    );
    expect(result.splits).toHaveLength(2);
    expect(result.splits[0]).toEqual({ user_id: alice.id, share_amount: 2000 });
    expect(result.splits[1]).toEqual({ user_id: bob.id, share_amount: 2000 });

    // Persisted in the repository (1 expense with 2 splits attached to it)
    const all = await expenseRepo.findByGroupId(GroupId.create(group.id));
    expect(all).toHaveLength(1);
    const persisted = all[0]!;
    expect(persisted.splits).toHaveLength(2);
  });

  it('AC-2: empty split_among_user_ids divides among ALL group members', async () => {
    const { addExpense, group, alice, bob, carol } = await makeStack();

    const result = await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice.id,
      amount: 3000,
      description: 'Groceries',
    });

    expect(result.splits).toHaveLength(3);
    const ids = result.splits.map((s) => s.user_id).sort();
    expect(ids).toEqual([alice.id, bob.id, carol.id].sort());
    for (const split of result.splits) {
      expect(split.share_amount).toBe(1000);
    }
  });

  it('AC-3: sum of share_amount equals amount; last split absorbs the rounding residue', async () => {
    const { addExpense, group, alice } = await makeStack();

    // 100 cents / 3 participants = 33, 33, 34 (last absorbs the residue)
    const result = await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice.id,
      amount: 100,
      description: 'Coffee',
    });

    expect(result.splits).toHaveLength(3);
    const sum = result.splits.reduce((acc, s) => acc + s.share_amount, 0);
    expect(sum).toBe(result.amount);

    const shares = result.splits.map((s) => s.share_amount);
    expect(shares.slice(0, -1).every((v) => v === 33)).toBe(true);
    expect(shares[shares.length - 1]).toBe(34);
  });

  it('AC-4: throws (→ 400 Bad Request) when paid_by_user_id is not a member of the group', async () => {
    const { addExpense, group, outsider, alice } = await makeStack();

    await expect(
      addExpense.execute({
        groupId: group.id,
        paid_by_user_id: outsider.id,
        amount: 1000,
        description: 'Sneaky',
        split_among_user_ids: [alice.id],
      }),
    ).rejects.toThrow(/not a member/i);
  });

  it('AC-5: GET /groups/:id/expenses returns all expenses with splits embedded', async () => {
    const { addExpense, getGroupExpenses, group, alice, bob, carol } =
      await makeStack();

    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice.id,
      amount: 3000,
      description: 'Dinner',
    });
    await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: bob.id,
      amount: 1500,
      description: 'Taxi',
      split_among_user_ids: [alice.id, bob.id, carol.id],
    });

    const page = await getGroupExpenses.execute({ groupId: group.id });
    const expenses = page.items;

    expect(expenses).toHaveLength(2);
    for (const exp of expenses) {
      expect(exp).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          group_id: group.id,
          paid_by_user_id: expect.any(String),
          amount: expect.any(Number),
          description: expect.any(String),
          created_at: expect.any(String),
        }),
      );
      expect(Array.isArray(exp.splits)).toBe(true);
      expect(exp.splits.length).toBeGreaterThan(0);
      for (const split of exp.splits) {
        expect(split).toEqual(
          expect.objectContaining({
            user_id: expect.any(String),
            share_amount: expect.any(Number),
          }),
        );
      }
      const sum = exp.splits.reduce((acc, s) => acc + s.share_amount, 0);
      expect(sum).toBe(exp.amount);
    }
  });
});
