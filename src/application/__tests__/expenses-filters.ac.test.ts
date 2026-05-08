/**
 * Acceptance criteria tests for "Búsqueda y filtros en expenses"
 * (task hvwTFv8EwtwGAAcJphmC).
 *
 * Each `it` block maps to a single AC. The use case is exercised against the
 * in-memory infrastructure with hand-built Expense entities so we can control
 * `createdAt`, `amount`, and `payerId` deterministically — which is what the
 * filter / sort / pagination behaviour is defined against.
 *
 * Layer: Application (test)
 */

import { Expense } from '@/domain/entities/Expense';
import type { SplitShare } from '@/domain/entities/Expense';
import { ExpenseId } from '@/domain/value-objects/ExpenseId';
import { GroupId } from '@/domain/value-objects/GroupId';
import { Money } from '@/domain/value-objects/Money';
import { UserId } from '@/domain/value-objects/UserId';

import { InMemoryExpenseRepository } from '@/infrastructure/persistence/InMemoryExpenseRepository';
import { InMemoryGroupRepository } from '@/infrastructure/persistence/InMemoryGroupRepository';
import { InMemoryUserRepository } from '@/infrastructure/persistence/InMemoryUserRepository';

import type { IIdGenerator } from '../ports/IIdGenerator';
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

interface SeedExpense {
  readonly id: string;
  readonly payerId: string;
  readonly amountCents: number;
  readonly createdAt: Date;
  readonly participants?: ReadonlyArray<string>;
  readonly description?: string;
}

function buildExpense(groupId: string, seed: SeedExpense): Expense {
  const total = Money.create(seed.amountCents, 'USD');
  const participantIds = (seed.participants ?? [seed.payerId]).map((id) =>
    UserId.create(id),
  );
  const n = participantIds.length;
  const base = Math.floor(seed.amountCents / n);
  const remainder = seed.amountCents - base * n;
  const splits: SplitShare[] = participantIds.map((userId, i) => ({
    userId,
    share: Money.create(i === n - 1 ? base + remainder : base, 'USD'),
  }));

  return Expense.create({
    id: ExpenseId.create(seed.id),
    groupId: GroupId.create(groupId),
    payerId: UserId.create(seed.payerId),
    amount: total,
    description: seed.description ?? `Expense ${seed.id}`,
    splits,
    createdAt: seed.createdAt,
  });
}

async function makeStack() {
  const userRepo = new InMemoryUserRepository();
  const groupRepo = new InMemoryGroupRepository();
  const expenseRepo = new InMemoryExpenseRepository();
  const idGen = new SequentialIdGenerator();

  const createUser = new CreateUserUseCase(userRepo, idGen);
  const createGroup = new CreateGroupUseCase(groupRepo, userRepo, idGen);
  const addMember = new AddMemberToGroupUseCase(groupRepo, userRepo);
  const getGroupExpenses = new GetGroupExpensesUseCase(expenseRepo, groupRepo);

  const alice = await createUser.execute({ name: 'Alice', email: 'alice@example.com' });
  const bob = await createUser.execute({ name: 'Bob', email: 'bob@example.com' });
  const carol = await createUser.execute({ name: 'Carol', email: 'carol@example.com' });

  const group = await createGroup.execute({
    name: 'Trip',
    owner_user_id: alice.id,
  });
  await addMember.execute({ groupId: group.id, user_id: bob.id });
  await addMember.execute({ groupId: group.id, user_id: carol.id });

  return { expenseRepo, getGroupExpenses, group, alice, bob, carol };
}

describe('Expenses filters/sort/pagination AC suite', () => {
  it('AC-1: groupId is required, date_from/date_to filter by created_at range (inclusive)', async () => {
    const { expenseRepo, getGroupExpenses, group, alice, bob } = await makeStack();

    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-jan',
        payerId: alice.id,
        amountCents: 1000,
        createdAt: new Date('2026-01-15T12:00:00Z'),
      }),
    );
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-feb',
        payerId: bob.id,
        amountCents: 2000,
        createdAt: new Date('2026-02-15T12:00:00Z'),
      }),
    );
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-mar',
        payerId: alice.id,
        amountCents: 3000,
        createdAt: new Date('2026-03-15T12:00:00Z'),
      }),
    );

    // No filters: all 3 returned.
    const all = await getGroupExpenses.execute({ groupId: group.id });
    expect(all.items).toHaveLength(3);
    expect(all.total).toBe(3);

    // date_from only: drop January.
    const fromFeb = await getGroupExpenses.execute({
      groupId: group.id,
      date_from: '2026-02-01',
    });
    expect(fromFeb.items.map((e) => e.id).sort()).toEqual(['e-feb', 'e-mar']);

    // date_to only: drop March.
    const untilFeb = await getGroupExpenses.execute({
      groupId: group.id,
      date_to: '2026-02-28',
    });
    expect(untilFeb.items.map((e) => e.id).sort()).toEqual(['e-feb', 'e-jan']);

    // Both bounds: only February.
    const onlyFeb = await getGroupExpenses.execute({
      groupId: group.id,
      date_from: '2026-02-01',
      date_to: '2026-02-28',
    });
    expect(onlyFeb.items).toHaveLength(1);
    expect(onlyFeb.items[0]!.id).toBe('e-feb');
  });

  it('AC-2: ?paid_by_user_id=X filters expenses paid by that user', async () => {
    const { expenseRepo, getGroupExpenses, group, alice, bob } = await makeStack();

    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-a1',
        payerId: alice.id,
        amountCents: 1000,
        createdAt: new Date('2026-01-01T10:00:00Z'),
      }),
    );
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-a2',
        payerId: alice.id,
        amountCents: 1500,
        createdAt: new Date('2026-01-02T10:00:00Z'),
      }),
    );
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-b1',
        payerId: bob.id,
        amountCents: 2500,
        createdAt: new Date('2026-01-03T10:00:00Z'),
      }),
    );

    const onlyAlice = await getGroupExpenses.execute({
      groupId: group.id,
      paid_by_user_id: alice.id,
    });
    expect(onlyAlice.items).toHaveLength(2);
    expect(onlyAlice.total).toBe(2);
    for (const exp of onlyAlice.items) {
      expect(exp.paid_by_user_id).toBe(alice.id);
    }

    const onlyBob = await getGroupExpenses.execute({
      groupId: group.id,
      paid_by_user_id: bob.id,
    });
    expect(onlyBob.items).toHaveLength(1);
    expect(onlyBob.items[0]!.id).toBe('e-b1');
  });

  it('AC-3: default sort is created_at DESC; sort=amount_desc switches to amount DESC', async () => {
    const { expenseRepo, getGroupExpenses, group, alice } = await makeStack();

    // Insert in a deliberately scrambled order so we can prove sorting happened.
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-mid',
        payerId: alice.id,
        amountCents: 5000,
        createdAt: new Date('2026-01-02T00:00:00Z'),
      }),
    );
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-old',
        payerId: alice.id,
        amountCents: 9000,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
    );
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-new',
        payerId: alice.id,
        amountCents: 1000,
        createdAt: new Date('2026-01-03T00:00:00Z'),
      }),
    );

    // Default → most recent first.
    const byDate = await getGroupExpenses.execute({ groupId: group.id });
    expect(byDate.items.map((e) => e.id)).toEqual(['e-new', 'e-mid', 'e-old']);

    // Override → biggest amount first.
    const byAmount = await getGroupExpenses.execute({
      groupId: group.id,
      sort: 'amount_desc',
    });
    expect(byAmount.items.map((e) => e.id)).toEqual(['e-old', 'e-mid', 'e-new']);
  });

  it('AC-4: limit defaults to 50, max 200 (clamped silently); offset paginates', async () => {
    const { expenseRepo, getGroupExpenses, group, alice } = await makeStack();

    // Seed 60 expenses, each one created at a distinct timestamp.
    for (let i = 0; i < 60; i++) {
      await expenseRepo.save(
        buildExpense(group.id, {
          id: `e-${String(i).padStart(3, '0')}`,
          payerId: alice.id,
          amountCents: 100 + i,
          createdAt: new Date(2026, 0, 1, 0, i),
        }),
      );
    }

    // Default limit = 50.
    const defaultPage = await getGroupExpenses.execute({ groupId: group.id });
    expect(defaultPage.items).toHaveLength(50);
    expect(defaultPage.limit).toBe(50);
    expect(defaultPage.offset).toBe(0);
    expect(defaultPage.total).toBe(60);

    // limit=10, offset=50 → last 10 of the 60.
    const tail = await getGroupExpenses.execute({
      groupId: group.id,
      limit: 10,
      offset: 50,
    });
    expect(tail.items).toHaveLength(10);
    expect(tail.limit).toBe(10);
    expect(tail.offset).toBe(50);
    expect(tail.total).toBe(60);

    // limit way above 200 must clamp silently (no error).
    const clamped = await getGroupExpenses.execute({
      groupId: group.id,
      limit: 9999,
    });
    expect(clamped.limit).toBe(200);
    // Only 60 in the store, so items can't exceed 60 either.
    expect(clamped.items.length).toBeLessThanOrEqual(200);
    expect(clamped.items).toHaveLength(60);
  });

  it('AC-5: response wrapper carries items, total, limit, offset', async () => {
    const { expenseRepo, getGroupExpenses, group, alice } = await makeStack();

    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-1',
        payerId: alice.id,
        amountCents: 1000,
        createdAt: new Date('2026-01-01T10:00:00Z'),
      }),
    );
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-2',
        payerId: alice.id,
        amountCents: 2000,
        createdAt: new Date('2026-01-02T10:00:00Z'),
      }),
    );
    await expenseRepo.save(
      buildExpense(group.id, {
        id: 'e-3',
        payerId: alice.id,
        amountCents: 3000,
        createdAt: new Date('2026-01-03T10:00:00Z'),
      }),
    );

    const page = await getGroupExpenses.execute({
      groupId: group.id,
      limit: 2,
      offset: 1,
    });

    expect(page).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        total: 3,
        limit: 2,
        offset: 1,
      }),
    );
    expect(page.items).toHaveLength(2);
    // total stays at the *filtered* count regardless of paging window, so the
    // client knows whether more pages exist.
    expect(page.total).toBeGreaterThan(page.items.length);
  });
});
