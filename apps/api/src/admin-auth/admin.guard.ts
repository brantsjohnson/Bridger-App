// ============================================
// WHAT THIS FILE DOES (plain English):
// SECURITY: the bouncer for every /admin/* route. It reads the admin JWT from
// the Authorization header, checks the signature with ADMIN_JWT_SECRET, and
// requires role === "admin". Wrong or missing token = 401.
// ============================================
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly secret: Uint8Array;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.getOrThrow<string>('ADMIN_JWT_SECRET');
    this.secret = new TextEncoder().encode(raw);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin token');
    }
    const token = header.slice('Bearer '.length).trim();

    try {
      const { payload } = await jwtVerify(token, this.secret);
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Not an admin session');
      }
      request.admin = { role: 'admin' };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }
}
