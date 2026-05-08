/**
 * Integration-style unit tests for CreateUserUseCase.
 *
 * Uses the in-memory repository so no mocking framework is needed.
 *
 * Layer: Application
 */

import { DuplicateEntityException } from '@/domain/exceptions/DomainException';

import { CreateUserUseCase } from '../use-cases/user/CreateUserUseCase';
import type { IIdGenerator } from '../ports/IIdGenerator';
import { InMemoryUserRepository } from '@/infrastructure/persistence/InMemoryUserRepository';

class StubIdGenerator implements IIdGenerator {
  private counter = 0;
  generate(): string {
    return `test-id-${++this.counter}`;
  }
}

describe('CreateUserUseCase', () => {
  let repo: InMemoryUserRepository;
  let idGen: StubIdGenerator;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    idGen = new StubIdGenerator();
    useCase = new CreateUserUseCase(repo, idGen);
  });

  it('creates a user and returns a DTO', async () => {
    const result = await useCase.execute({ name: 'Alice', email: 'alice@example.com' });

    expect(result.id).toBe('test-id-1');
    expect(result.name).toBe('Alice');
    expect(result.email).toBe('alice@example.com');
    expect(result.createdAt).toBeTruthy();
  });

  it('normalises email to lowercase', async () => {
    const result = await useCase.execute({ name: 'Bob', email: 'BOB@EXAMPLE.COM' });
    expect(result.email).toBe('bob@example.com');
  });

  it('throws DuplicateEntityException when email already exists', async () => {
    await useCase.execute({ name: 'Alice', email: 'alice@example.com' });
    await expect(
      useCase.execute({ name: 'Alice 2', email: 'alice@example.com' }),
    ).rejects.toThrow(DuplicateEntityException);
  });

  it('throws for an invalid email address', async () => {
    await expect(
      useCase.execute({ name: 'Invalid', email: 'not-an-email' }),
    ).rejects.toThrow();
  });

  it('throws for an empty user name', async () => {
    await expect(
      useCase.execute({ name: '', email: 'valid@example.com' }),
    ).rejects.toThrow();
  });
});
