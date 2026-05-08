/**
 * /api/groups/[groupId]/balances
 *
 * GET → Compute net balances and suggested settlements for a group
 *
 * Layer: Interfaces (Next.js App Router route handler)
 */

import { type NextRequest } from 'next/server';

import { makeGetGroupBalancesUseCase } from '@/infrastructure/container';

import { handleError, ok } from '@/interfaces/http/helpers/apiResponse';

interface RouteParams {
  params: { groupId: string };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const useCase = makeGetGroupBalancesUseCase();
    const result = await useCase.execute({ groupId: params.groupId });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
