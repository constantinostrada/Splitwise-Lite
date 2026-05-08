/**
 * /api/groups/[groupId]/expenses
 *
 * GET  → List all expenses for a group
 * POST → Add an expense to a group
 *
 * Layer: Interfaces (Next.js App Router route handler)
 */

import { type NextRequest } from 'next/server';

import type { AddExpenseDto } from '@/application/dtos/ExpenseDto';
import {
  makeAddExpenseUseCase,
  makeGetGroupExpensesUseCase,
} from '@/infrastructure/container';

import { created, handleError, ok } from '@/interfaces/http/helpers/apiResponse';

interface RouteParams {
  params: { groupId: string };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const useCase = makeGetGroupExpensesUseCase();
    const expenses = await useCase.execute({ groupId: params.groupId });
    return ok(expenses);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const body = (await request.json()) as Omit<AddExpenseDto, 'groupId'>;
    const useCase = makeAddExpenseUseCase();
    const expense = await useCase.execute({ ...body, groupId: params.groupId });
    return created(expense);
  } catch (error) {
    return handleError(error);
  }
}
