/**
 * /api/users
 *
 * GET  → List all users
 * POST → Create a new user
 *
 * Layer: Interfaces (Next.js App Router route handler)
 */

import { type NextRequest } from 'next/server';

import type { CreateUserDto } from '@/application/dtos/UserDto';
import {
  makeCreateUserUseCase,
  makeListUsersUseCase,
} from '@/infrastructure/container';

import { created, handleError, ok } from '@/interfaces/http/helpers/apiResponse';

export async function GET(): Promise<Response> {
  try {
    const useCase = makeListUsersUseCase();
    const users = await useCase.execute();
    return ok(users);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as CreateUserDto;
    const useCase = makeCreateUserUseCase();
    const user = await useCase.execute(body);
    return created(user);
  } catch (error) {
    return handleError(error);
  }
}
