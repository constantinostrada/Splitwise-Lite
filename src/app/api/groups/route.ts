/**
 * /api/groups
 *
 * GET  → (future) List all groups for the current user
 * POST → Create a new group
 *
 * Layer: Interfaces (Next.js App Router route handler)
 */

import { type NextRequest } from 'next/server';

import type { CreateGroupDto } from '@/application/dtos/GroupDto';
import {
  makeCreateGroupUseCase,
} from '@/infrastructure/container';

import { created, handleError } from '@/interfaces/http/helpers/apiResponse';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as CreateGroupDto;
    const useCase = makeCreateGroupUseCase();
    const group = await useCase.execute(body);
    return created(group);
  } catch (error) {
    return handleError(error);
  }
}
