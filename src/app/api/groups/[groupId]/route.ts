/**
 * /api/groups/[groupId]
 *
 * GET → Get a single group by ID
 *
 * Layer: Interfaces (Next.js App Router route handler)
 */

import { type NextRequest } from 'next/server';

import { makeGetGroupByIdUseCase } from '@/infrastructure/container';

import { handleError, ok } from '@/interfaces/http/helpers/apiResponse';

interface RouteParams {
  params: { groupId: string };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const useCase = makeGetGroupByIdUseCase();
    const group = await useCase.execute({ groupId: params.groupId });
    return ok(group);
  } catch (error) {
    return handleError(error);
  }
}
