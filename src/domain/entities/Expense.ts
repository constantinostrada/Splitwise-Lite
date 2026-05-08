/**
 * Expense Entity
 *
 * Represents a real-world expense paid by one member of a group,
 * to be split among one or more members.
 *
 * Layer: Domain — no imports from outside this layer.
 */

import type { ExpenseId } from '../value-objects/ExpenseId';
import type { GroupId } from '../value-objects/GroupId';
import type { UserId } from '../value-objects/UserId';
import type { Money } from '../value-objects/Money';

export interface SplitShare {
  readonly userId: UserId;
  readonly share: Money;
}

export interface ExpenseProps {
  readonly id: ExpenseId;
  readonly groupId: GroupId;
  readonly payerId: UserId;
  readonly amount: Money;
  readonly description: string;
  readonly splits: ReadonlyArray<SplitShare>;
  readonly createdAt: Date;
}

export class Expense {
  readonly id: ExpenseId;
  readonly groupId: GroupId;
  readonly payerId: UserId;
  readonly amount: Money;
  readonly description: string;
  readonly splits: ReadonlyArray<SplitShare>;
  readonly createdAt: Date;

  private constructor(props: ExpenseProps) {
    this.id = props.id;
    this.groupId = props.groupId;
    this.payerId = props.payerId;
    this.amount = props.amount;
    this.description = props.description;
    this.splits = props.splits;
    this.createdAt = props.createdAt;
  }

  static create(props: ExpenseProps): Expense {
    if (!props.description || props.description.trim().length === 0) {
      throw new Error('Expense description must not be empty.');
    }
    if (props.description.trim().length > 255) {
      throw new Error('Expense description must not exceed 255 characters.');
    }
    if (props.amount.isZeroOrNegative()) {
      throw new Error('Expense amount must be greater than zero.');
    }
    if (props.splits.length === 0) {
      throw new Error('An expense must have at least one split.');
    }

    const splitTotal = props.splits.reduce(
      (sum, s) => sum + s.share.amountInCents,
      0,
    );
    if (splitTotal !== props.amount.amountInCents) {
      throw new Error(
        `Split amounts (${splitTotal}) must sum to the total expense amount (${props.amount.amountInCents}).`,
      );
    }

    const payerInSplit = props.splits.some((s) => s.userId.equals(props.payerId));
    if (!payerInSplit) {
      throw new Error('The payer must be included in the expense splits.');
    }

    return new Expense({ ...props, description: props.description.trim() });
  }

  equals(other: Expense): boolean {
    return this.id.equals(other.id);
  }
}
