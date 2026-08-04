// ============================================
// WHAT THIS FILE DOES (plain English):
// A small shortcut so route handlers can just ask for the logged-in user with
// @CurrentUser(), instead of digging through the raw request. The guard
// (auth.guard.ts) is what actually put the user there after verifying the token.
// ============================================
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest();
    return request.user as AuthUser;
  }
);
