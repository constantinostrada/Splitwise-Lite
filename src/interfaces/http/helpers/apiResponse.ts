/**
 * API response helper utilities
 *
 * Thin wrappers that standardise the JSON envelope shape and HTTP status codes
 * used across all API route handlers.
 *
 * Layer: Interfaces
 */

import { NextResponse } from 'next/server';

import {
  DomainException,
  DuplicateEntityException,
  EntityNotFoundException,
} from '@/application/../domain/exceptions/DomainException';

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccessEnvelope<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccessEnvelope<T>> {
  return ok(data, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function handleError(error: unknown): NextResponse<ApiErrorEnvelope> {
  if (error instanceof EntityNotFoundException) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: error.message } },
      { status: 404 },
    );
  }
  if (error instanceof DuplicateEntityException) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: error.message } },
      { status: 409 },
    );
  }
  if (error instanceof DomainException) {
    return NextResponse.json(
      { success: false, error: { code: 'DOMAIN_ERROR', message: error.message } },
      { status: 422 },
    );
  }
  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: error.message } },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
    { status: 500 },
  );
}
