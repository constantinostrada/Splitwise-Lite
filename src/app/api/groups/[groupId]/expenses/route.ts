/**
 * /api/groups/[groupId]/expenses
 *
 * GET  → List expenses for a group with optional filters/sort/pagination.
 *        Query params (all optional):
 *          - date_from=YYYY-MM-DD
 *          - date_to=YYYY-MM-DD
 *          - paid_by_user_id=<userId>
 *          - sort=amount_desc        (default: created_at desc)
 *          - limit=<n>               (default 50, clamped to [1,200])
 *          - offset=<n>              (default 0)
 *        Response: { items, total, limit, offset }
 * POST → Add an expense to a group
 *
 * Layer: Interfaces (Next.js App Router route handler)
 */

import { type NextRequest } from 'next/server';

import type {
  AddExpenseDto,
  ExpensesSortOrder,
  GetExpensesByGroupDto,
} from '@/application/dtos/ExpenseDto';
import {
  makeAddExpenseUseCase,
  makeGetGroupExpensesUseCase,
} from '@/infrastructure/container';

import { created, handleError, ok } from '@/interfaces/http/helpers/apiResponse';

interface RouteParams {
  params: { groupId: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const sp = request.nextUrl.searchParams;
    const sortRaw = sp.get('sort');
    const sort: ExpensesSortOrder | undefined =
      sortRaw === 'amount_desc' ? 'amount_desc' : undefined;

    const dto: GetExpensesByGroupDto = {
      groupId: params.groupId,
      date_from: sp.get('date_from') ?? undefined,
      date_to: sp.get('date_to') ?? undefined,
      paid_by_user_id: sp.get('paid_by_user_id') ?? undefined,
      sort,
      limit: parseIntOrUndefined(sp.get('limit')),
      offset: parseIntOrUndefined(sp.get('offset')),
    };

    const useCase = makeGetGroupExpensesUseCase();
    const page = await useCase.execute(dto);
    return ok(page);
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

function parseIntOrUndefined(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === '') return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}
