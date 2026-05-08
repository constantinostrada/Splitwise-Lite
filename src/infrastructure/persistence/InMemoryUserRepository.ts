/**
 * InMemoryUserRepository
 *
 * Implements IUserRepository using a plain in-memory Map.
 * Suitable for development, demos, and unit tests.
 * Replace with a real database-backed implementation for production.
 *
 * Layer: Infrastructure
 */

import type { User } from '@/domain/entities/User';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { Email } from '@/domain/value-objects/Email';
import type { UserId } from '@/domain/value-objects/UserId';

export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>();

  async findById(id: UserId): Promise<User | null> {
    return this.store.get(id.value) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.equals(email)) return user;
    }
    return null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.store.values());
  }

  async save(user: User): Promise<void> {
    this.store.set(user.id.value, user);
  }

  async delete(id: UserId): Promise<void> {
    this.store.delete(id.value);
  }

  /** Utility for tests — resets all stored data. */
  clear(): void {
    this.store.clear();
  }
}
