/**
 * IIdGenerator — Application Port
 *
 * Abstracts ID generation so use cases remain independent of
 * the concrete strategy (UUID v4, ULID, database sequences, etc.).
 *
 * Layer: Application
 */

export interface IIdGenerator {
  generate(): string;
}
