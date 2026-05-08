/**
 * Dependency Injection Container (manual / singleton)
 *
 * Wires together infrastructure implementations with application use cases.
 * All `new` calls for concrete dependencies live here and nowhere else.
 *
 * In a larger codebase this could be replaced with an IoC library (e.g. tsyringe,
 * InversifyJS) without touching any domain or application code.
 *
 * Layer: Infrastructure — this is the composition root.
 */

import { AddExpenseUseCase } from '@/application/use-cases/expense/AddExpenseUseCase';
import { GetGroupExpensesUseCase } from '@/application/use-cases/expense/GetGroupExpensesUseCase';
import { GetGroupBalancesUseCase } from '@/application/use-cases/balance/GetGroupBalancesUseCase';
import { AddMemberToGroupUseCase } from '@/application/use-cases/group/AddMemberToGroupUseCase';
import { CreateGroupUseCase } from '@/application/use-cases/group/CreateGroupUseCase';
import { GetGroupByIdUseCase } from '@/application/use-cases/group/GetGroupByIdUseCase';
import { CreateUserUseCase } from '@/application/use-cases/user/CreateUserUseCase';
import { GetUserByIdUseCase } from '@/application/use-cases/user/GetUserByIdUseCase';
import { ListUsersUseCase } from '@/application/use-cases/user/ListUsersUseCase';

import { UuidIdGenerator } from './id/UuidIdGenerator';
import { InMemoryExpenseRepository } from './persistence/InMemoryExpenseRepository';
import { InMemoryGroupRepository } from './persistence/InMemoryGroupRepository';
import { InMemoryUserRepository } from './persistence/InMemoryUserRepository';

// ── Repositories (singletons — shared state across requests in dev/demo) ─────
const userRepository = new InMemoryUserRepository();
const groupRepository = new InMemoryGroupRepository();
const expenseRepository = new InMemoryExpenseRepository();

// ── Shared utilities ──────────────────────────────────────────────────────────
const idGenerator = new UuidIdGenerator();

// ── Use Case factories ────────────────────────────────────────────────────────
// Each factory returns a fresh use case instance (cheap, stateless).
// Repositories are injected as singletons so data persists across calls.

export function makeCreateUserUseCase(): CreateUserUseCase {
  return new CreateUserUseCase(userRepository, idGenerator);
}

export function makeGetUserByIdUseCase(): GetUserByIdUseCase {
  return new GetUserByIdUseCase(userRepository);
}

export function makeListUsersUseCase(): ListUsersUseCase {
  return new ListUsersUseCase(userRepository);
}

export function makeCreateGroupUseCase(): CreateGroupUseCase {
  return new CreateGroupUseCase(groupRepository, userRepository, idGenerator);
}

export function makeGetGroupByIdUseCase(): GetGroupByIdUseCase {
  return new GetGroupByIdUseCase(groupRepository, userRepository);
}

export function makeAddMemberToGroupUseCase(): AddMemberToGroupUseCase {
  return new AddMemberToGroupUseCase(groupRepository, userRepository);
}

export function makeAddExpenseUseCase(): AddExpenseUseCase {
  return new AddExpenseUseCase(expenseRepository, groupRepository, idGenerator);
}

export function makeGetGroupExpensesUseCase(): GetGroupExpensesUseCase {
  return new GetGroupExpensesUseCase(expenseRepository, groupRepository);
}

export function makeGetGroupBalancesUseCase(): GetGroupBalancesUseCase {
  return new GetGroupBalancesUseCase(groupRepository, expenseRepository);
}
