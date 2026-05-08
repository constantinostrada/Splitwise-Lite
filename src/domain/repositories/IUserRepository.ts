/**
 * IUserRepository — Domain Repository Interface
 *
 * Describes WHAT persistence operations are available for Users.
 * Does NOT describe HOW they are implemented (no SQL, no ORM).
 *
 * Layer: Domain
 */

import type { User } from '../entities/User';
import type { UserId } from '../value-objects/UserId';
import type { Email } from '../value-objects/Email';

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
