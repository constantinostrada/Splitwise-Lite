/**
 * UuidIdGenerator
 *
 * Implements the IIdGenerator application port using UUID v4.
 * This is the only place in the codebase where `uuid` is imported.
 *
 * Layer: Infrastructure
 */

import { v4 as uuidv4 } from 'uuid';

import type { IIdGenerator } from '@/application/ports/IIdGenerator';

export class UuidIdGenerator implements IIdGenerator {
  generate(): string {
    return uuidv4();
  }
}
