/**
 * /api/groups/[groupId]/members
 *
 * POST → Add a user as a member of the group.
 *
 * Layer: Interfaces (Next.js App Router route handler)
 */

import { type NextRequest } from 'next/server';

import { makeAddMemberToGroupUseCase } from '@/infrastructure/container';

import { created, handleError } from '@/interfaces/http/helpers/apiResponse';

interface RouteParams {
  params: { groupId: string };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const body = (await request.json()) as { user_id: string };
    const useCase = makeAddMemberToGroupUseCase();
    const group = await useCase.execute({
      groupId: params.groupId,
      user_id: body.user_id,
    });
    return created(group);
  } catch (error) {
    return handleError(error);
  }
}
