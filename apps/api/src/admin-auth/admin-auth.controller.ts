// ============================================
// WHAT THIS FILE DOES (plain English):
// SECURITY: the only credential to the back office. POST /admin/login takes a
// password, compares it in constant time to ADMIN_PASSWORD, and returns a
// short-lived JWT. GET /admin/session lets the console check its stored token.
// The password never leaves the server.
// ============================================
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { SignJWT } from 'jose';
import { AdminGuard } from './admin.guard';

/** Simple in-memory throttle so brute-force attempts get slowed down. */
const failures = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILURES = 8;
const LOCK_MS = 60_000;

@Controller('admin')
export class AdminAuthController {
  private readonly password: string;
  private readonly jwtSecret: Uint8Array;

  constructor(private readonly config: ConfigService) {
    this.password = this.config.getOrThrow<string>('ADMIN_PASSWORD');
    this.jwtSecret = new TextEncoder().encode(
      this.config.getOrThrow<string>('ADMIN_JWT_SECRET')
    );
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { password?: string }) {
    const key = 'global';
    const now = Date.now();
    const state = failures.get(key);
    if (state && state.lockedUntil > now) {
      throw new UnauthorizedException('Too many attempts. Try again shortly.');
    }

    const candidate = typeof body?.password === 'string' ? body.password : '';
    if (!this.passwordsMatch(candidate, this.password)) {
      const next = {
        count: (state?.count ?? 0) + 1,
        lockedUntil: 0
      };
      if (next.count >= MAX_FAILURES) {
        next.lockedUntil = now + LOCK_MS;
        next.count = 0;
      }
      failures.set(key, next);
      throw new UnauthorizedException('Wrong password');
    }

    failures.delete(key);

    // --- Issue a 12-hour admin session token ---
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(this.jwtSecret);

    return { token };
  }

  @Get('session')
  @UseGuards(AdminGuard)
  session() {
    return { ok: true };
  }

  /** Constant-time compare so timing cannot leak the password length. */
  private passwordsMatch(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) {
      // Still do a compare against itself so the timing stays similar.
      timingSafeEqual(aBuf, aBuf);
      return false;
    }
    return timingSafeEqual(aBuf, bBuf);
  }
}
