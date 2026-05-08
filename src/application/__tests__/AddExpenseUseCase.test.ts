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

  return { alice, bob, group, addExpense, expenseRepo };
}

describe('AddExpenseUseCase', () => {
  it('adds an expense and returns a DTO with snake_case fields', async () => {
    const { alice, bob, group, addExpense } = await buildContext();

    const result = await addExpense.execute({
      groupId: group.id,
      paid_by_user_id: alice.id,
      amount: 6000,
      description: 'Dinner',
      split_among_user_ids: [alice.id, bob.id],
    });

    expect(result.description).toBe('Dinner');
    expect(result.amount).toBe(6000);
    expect(result.paid_by_user_id).toBe(alice.id);
    expect(result.group_id).toBe(group.id);
    expect(result.splits).toHaveLength(2);
    expect(result.splits[0]).toEqual({ user_id: alice.id, share_amount: 3000 });
    expect(result.splits[1]).toEqual({ user_id: bob.id, share_amount: 3000 });
  });

  it('throws when the group does not exist', async () => {
    const { alice, addExpense } = await buildContext();
    await expect(
      addExpense.execute({
        groupId: 'nonexistent',
        paid_by_user_id: alice.id,
        amount: 1000,
        description: 'Test',
        split_among_user_ids: [alice.id],
      }),
    ).rejects.toThrow('nonexistent');
  });

  it('throws when a participant is not a group member', async () => {
    const { alice, group, addExpense } = await buildContext();
    await expect(
      addExpense.execute({
        groupId: group.id,
        paid_by_user_id: alice.id,
        amount: 2000,
        description: 'Lunch',
        split_among_user_ids: [alice.id, 'outsider'],
      }),
    ).rejects.toThrow();
  });
});
