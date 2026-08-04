// ============================================
// WHAT THIS FILE DOES (plain English):
// The bouncer for protected API routes. When a request comes in, it reads the
// "Authorization: Bearer <token>" header (the user's login token from the app)
// and checks it is genuine.
//
// HOW IT CHECKS (the secure, modern way): it fetches your project's PUBLIC keys
// from Supabase's JWKS URL and verifies the token's signature against them. The
// private signing key never leaves Supabase, so the server never holds a secret.
// It also confirms the token was issued by your project and is for a logged-in
// user. If anything is off, the request is rejected with 401 Unauthorized.
// ============================================
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

// What we attach to the request after a successful check.
export interface AuthUser {
  id: string;
  email?: string;
  claims: JWTPayload;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    // Supabase issues tokens as "<url>/auth/v1" and publishes its public keys here.
    this.issuer = `${url}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();

    try {
      // Verify signature + issuer + that it's a logged-in ("authenticated") user.
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated'
      });

      const user: AuthUser = {
        id: String(payload.sub),
        email: typeof payload.email === 'string' ? payload.email : undefined,
        claims: payload
      };
      // Hand the verified user to the route (see the CurrentUser decorator).
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
