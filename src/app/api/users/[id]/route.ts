/**
 * /api/users/[id]
 *
 * GET → Get a single user by ID
 *
 * Layer: Interfaces (Next.js App Router route handler)
 */

import { type NextRequest } from 'next/server';

import { makeGetUserByIdUseCase } from '@/infrastructure/container';

import { handleError, ok } from '@/interfaces/http/helpers/apiResponse';

interface RouteParams {
  params: { id: string };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const useCase = makeGetUserByIdUseCase();
    const user = await useCase.execute({ id: params.id });
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}
