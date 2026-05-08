/**
 * Unit tests for the User entity.
 *
 * Layer: Domain
 */

import { User } from '../entities/User';
import { Email } from '../value-objects/Email';
import { UserId } from '../value-objects/UserId';

function makeUser(overrides?: Partial<Parameters<typeof User.create>[0]>): User {
  return User.create({
    id: UserId.create('user-1'),
    name: 'Alice',
    email: Email.create('alice@example.com'),
    createdAt: new Date('2024-01-01'),
    ...overrides,
  });
}

describe('User entity', () => {
  it('creates a valid user', () => {
    const user = makeUser();
    expect(user.name).toBe('Alice');
    expect(user.email.value).toBe('alice@example.com');
  });

  it('trims whitespace from the name', () => {
    const user = makeUser({ name: '  Bob  ' });
    expect(user.name).toBe('Bob');
  });

  it('throws when name is empty', () => {
    expect(() => makeUser({ name: '' })).toThrow('must not be empty');
  });

  it('throws when name exceeds 100 characters', () => {
    expect(() => makeUser({ name: 'A'.repeat(101) })).toThrow('100 characters');
  });

  it('renames to a new user instance without mutation', () => {
    const original = makeUser();
    const renamed = original.rename('Bob');
    expect(original.name).toBe('Alice');
    expect(renamed.name).toBe('Bob');
    expect(renamed.id.equals(original.id)).toBe(true);
  });

  it('evaluates equality by ID', () => {
    const a = makeUser();
    const b = makeUser({ name: 'Different Name' });
    expect(a.equals(b)).toBe(true);
  });
});
