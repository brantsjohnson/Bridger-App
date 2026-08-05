// ============================================
// WHAT THIS FILE DOES (plain English):
// Like the normal login guard, but optional. If a Bearer token is present and
// valid, we attach the user. If missing or bad, the request still goes through
// as anonymous (used for public co-op portal reads).
// ============================================
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthUser } from './auth.guard';

@Injectable()
export class OptionalSupabaseAuthGuard implements CanActivate {
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    this.issuer = `${url}/auth/v1`;
    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/.well-known/jwks.json`)
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return true;
    }
    const token = header.slice('Bearer '.length).trim();
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated'
      });
      const user: AuthUser = {
        id: String(payload.sub),
        email: typeof payload.email === 'string' ? payload.email : undefined,
        claims: payload
      };
      request.user = user;
    } catch {
      // Public read still allowed; treat as anonymous.
    }
    return true;
  }
}
