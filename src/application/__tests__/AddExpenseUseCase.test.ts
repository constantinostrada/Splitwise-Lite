/**
 * Unit tests for AddExpenseUseCase.
 *
 * Layer: Application
 */

import { InMemoryExpenseRepository } from '@/infrastructure/persistence/InMemoryExpenseRepository';
import { InMemoryGroupRepository } from '@/infrastructure/persistence/InMemoryGroupRepository';
import { InMemoryUserRepository } from '@/infrastructure/persistence/InMemoryUserRepository';

import { AddMemberToGroupUseCase } from '../use-cases/group/AddMemberToGroupUseCase';
import { CreateGroupUseCase } from '../use-cases/group/CreateGroupUseCase';
import { CreateUserUseCase } from '../use-cases/user/CreateUserUseCase';
import { AddExpenseUseCase } from '../use-cases/expense/AddExpenseUseCase';
import type { IIdGenerator } from '../ports/IIdGenerator';

class SequentialIdGenerator implements IIdGenerator {
  private counter = 0;
  generate(): string {
    return `id-${++this.counter}`;
  }
}

async function buildContext() {
  const userRepo = new InMemoryUserRepository();
  const groupRepo = new InMemoryGroupRepository();
  const expenseRepo = new InMemoryExpenseRepository();
  const idGen = new SequentialIdGenerator();

  const createUser = new CreateUserUseCase(userRepo, idGen);
  const createGroup = new CreateGroupUseCase(groupRepo, userRepo, idGen);
  const addMember = new AddMemberToGroupUseCase(groupRepo, userRepo);
  const addExpense = new AddExpenseUseCase(expenseRepo, groupRepo, idGen);

  const alice = await createUser.execute({ name: 'Alice', email: 'alice@example.com' });
  const bob   = await createUser.execute({ name: 'Bob',   email: 'bob@example.com' });
  const group = await createGroup.execute({
    name: 'Test Group',
    owner_user_id: alice.id,
  });
  await addMember.execute({ groupId: group.id, user_id: bob.id });

  return { alice, bob, group, addExpense };
}

describe('AddExpenseUseCase', () => {
  it('adds an expense and returns a DTO', async () => {
    const { alice, bob, group, addExpense } = await buildContext();

    const result = await addExpense.execute({
      groupId: group.id,
      payerId: alice.id,
      amountInCents: 6000,
      currency: 'USD',
      description: 'Dinner',
      splits: [
        { userId: alice.id, amountInCents: 3000 },
        { userId: bob.id,   amountInCents: 3000 },
      ],
    });

    expect(result.description).toBe('Dinner');
    expect(result.amountInCents).toBe(6000);
    expect(result.currency).toBe('USD');
    expect(result.payerId).toBe(alice.id);
    expect(result.splits).toHaveLength(2);
  });

  it('throws when the group does not exist', async () => {
    const { alice, bob, addExpense } = await buildContext();
    await expect(
      addExpense.execute({
        groupId: 'nonexistent',
        payerId: alice.id,
        amountInCents: 1000,
        currency: 'USD',
        description: 'Test',
        splits: [
          { userId: alice.id, amountInCents: 500 },
          { userId: bob.id,   amountInCents: 500 },
        ],
      }),
    ).rejects.toThrow('nonexistent');
  });

  it('throws when splits do not sum to the total amount', async () => {
    const { alice, bob, group, addExpense } = await buildContext();
    await expect(
      addExpense.execute({
        groupId: group.id,
        payerId: alice.id,
        amountInCents: 6000,
        currency: 'USD',
        description: 'Dinner',
        splits: [
          { userId: alice.id, amountInCents: 3000 },
          { userId: bob.id,   amountInCents: 2000 }, // wrong total
        ],
      }),
    ).rejects.toThrow();
  });

  it('throws when a split participant is not a group member', async () => {
    const { alice, group, addExpense } = await buildContext();
    await expect(
      addExpense.execute({
        groupId: group.id,
        payerId: alice.id,
        amountInCents: 2000,
        currency: 'USD',
        description: 'Lunch',
        splits: [
          { userId: alice.id,    amountInCents: 1000 },
          { userId: 'outsider',  amountInCents: 1000 },
        ],
      }),
    ).rejects.toThrow();
  });
});
