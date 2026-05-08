/**
 * DomainException
 *
 * Base class for all domain-layer exceptions.
 * Allows callers to distinguish domain rule violations from unexpected errors.
 *
 * Layer: Domain
 */

export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
    // Fix prototype chain for instanceof checks in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id "${id}" was not found.`);
    this.name = 'EntityNotFoundException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicateEntityException extends DomainException {
  constructor(entityName: string, field: string, value: string) {
    super(`A ${entityName} with ${field} "${value}" already exists.`);
    this.name = 'DuplicateEntityException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
