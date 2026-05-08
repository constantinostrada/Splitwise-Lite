/**
 * Acceptance criteria tests for "Endpoints de groups + miembros".
 *
 * Each `it` block maps to a single AC from the task spec and is the test
 * referenced by `chiron task ac assert`. We exercise the use cases with the
 * in-memory infrastructure so the full request → use case → repository chain
 * is covered without booting the HTTP server.
 *
 * Layer: Application (test)
 */

import {
  DuplicateEntityException,
  EntityNotFoundException,
} from '@/domain/exceptions/DomainException';
import { InMemoryGroupRepository } from '@/infrastructure/persistence/InMemoryGroupRepository';
import { InMemoryUserRepository } from '@/infrastructure/persistence/InMemoryUserRepository';

import type { IIdGenerator } from '../ports/IIdGenerator';
import { AddMemberToGroupUseCase } from '../use-cases/group/AddMemberToGroupUseCase';
import { CreateGroupUseCase } from '../use-cases/group/CreateGroupUseCase';
import { GetGroupByIdUseCase } from '../use-cases/group/GetGroupByIdUseCase';
import { CreateUserUseCase } from '../use-cases/user/CreateUserUseCase';

class SequentialIdGenerator implements IIdGenerator {
  private counter = 0;
  generate(): string {
    return `id-${++this.counter}`;
  }
}

function makeStack() {
  const userRepo = new InMemoryUserRepository();
  const groupRepo = new InMemoryGroupRepository();
  const idGen = new SequentialIdGenerator();

  return {
    userRepo,
    groupRepo,
    idGen,
    createUser: new CreateUserUseCase(userRepo, idGen),
    createGroup: new CreateGroupUseCase(groupRepo, userRepo, idGen),
    addMember: new AddMemberToGroupUseCase(groupRepo, userRepo),
    getGroup: new GetGroupByIdUseCase(groupRepo, userRepo),
  };
}

describe('Groups + members AC suite', () => {
  it('AC-1: POST /users creates a user and returns {id, name, email}', async () => {
    const { createUser } = makeStack();

    const result = await createUser.execute({
      name: 'Alice',
      email: 'alice@example.com',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Alice',
        email: 'alice@example.com',
      }),
    );
    expect(result.id).toBeTruthy();
  });

  it('AC-2: POST /groups creates a group and auto-adds the owner as the first member', async () => {
    const { createUser, createGroup } = makeStack();

    const owner = await createUser.execute({
      name: 'Alice',
      email: 'alice@example.com',
    });

    const group = await createGroup.execute({
      name: 'Trip',
      owner_user_id: owner.id,
    });

    expect(group.name).toBe('Trip');
    expect(group.members).toHaveLength(1);
    expect(group.members[0]).toEqual(
      expect.objectContaining({
        user_id: owner.id,
        name: 'Alice',
        email: 'alice@example.com',
        joined_at: expect.any(String),
      }),
    );
  });

  it('AC-3: POST /groups/:id/members adds a user; second add for same user throws DuplicateEntityException (→ 409)', async () => {
    const { createUser, createGroup, addMember } = makeStack();

    const alice = await createUser.execute({
      name: 'Alice',
      email: 'alice@example.com',
    });
    const bob = await createUser.execute({
      name: 'Bob',
      email: 'bob@example.com',
    });
    const group = await createGroup.execute({
      name: 'Trip',
      owner_user_id: alice.id,
    });

    const updated = await addMember.execute({
      groupId: group.id,
      user_id: bob.id,
    });
    expect(updated.members.map((m) => m.user_id).sort()).toEqual(
      [alice.id, bob.id].sort(),
    );

    await expect(
      addMember.execute({ groupId: group.id, user_id: bob.id }),
    ).rejects.toBeInstanceOf(DuplicateEntityException);
  });

  it('AC-4: GET /groups/:id returns members: [{user_id, name, email, joined_at}]', async () => {
    const { createUser, createGroup, addMember, getGroup } = makeStack();

    const alice = await createUser.execute({
      name: 'Alice',
      email: 'alice@example.com',
    });
    const bob = await createUser.execute({
      name: 'Bob',
      email: 'bob@example.com',
    });
    const group = await createGroup.execute({
      name: 'Trip',
      owner_user_id: alice.id,
    });
    await addMember.execute({ groupId: group.id, user_id: bob.id });

    const fetched = await getGroup.execute({ groupId: group.id });

    expect(fetched.id).toBe(group.id);
    expect(fetched.name).toBe('Trip');
    expect(fetched.members).toHaveLength(2);
    for (const member of fetched.members) {
      expect(member).toEqual(
        expect.objectContaining({
          user_id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          joined_at: expect.any(String),
        }),
      );
      expect(() => new Date(member.joined_at).toISOString()).not.toThrow();
    }
    const byId = new Map(fetched.members.map((m) => [m.user_id, m]));
    expect(byId.get(alice.id)).toEqual(
      expect.objectContaining({ name: 'Alice', email: 'alice@example.com' }),
    );
    expect(byId.get(bob.id)).toEqual(
      expect.objectContaining({ name: 'Bob', email: 'bob@example.com' }),
    );
  });

  it('AC-5: missing ids throw EntityNotFoundException (→ 404, not 500) on every endpoint use case', async () => {
    const { createUser, createGroup, addMember, getGroup } = makeStack();

    // GET /groups/:id with unknown id
    await expect(
      getGroup.execute({ groupId: 'does-not-exist' }),
    ).rejects.toBeInstanceOf(EntityNotFoundException);

    // POST /groups with an unknown owner_user_id
    await expect(
      createGroup.execute({ name: 'Ghost', owner_user_id: 'no-such-user' }),
    ).rejects.toBeInstanceOf(EntityNotFoundException);

    // POST /groups/:id/members with an unknown group
    const alice = await createUser.execute({
      name: 'Alice',
      email: 'alice@example.com',
    });
    await expect(
      addMember.execute({ groupId: 'no-such-group', user_id: alice.id }),
    ).rejects.toBeInstanceOf(EntityNotFoundException);

    // POST /groups/:id/members with an unknown user
    const group = await createGroup.execute({
      name: 'Trip',
      owner_user_id: alice.id,
    });
    await expect(
      addMember.execute({ groupId: group.id, user_id: 'no-such-user' }),
    ).rejects.toBeInstanceOf(EntityNotFoundException);
  });
});
