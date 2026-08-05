// ============================================
// WHAT THIS FILE DOES (plain English):
// Blocks portal *writes* unless the signed-in person is an active co-op member
// (including period-end-cancelled until dues_paid_through). Reads stay public.
// ============================================
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.guard';
import { CoopService } from './coop.service';

@Injectable()
export class RequireCoopMemberGuard implements CanActivate {
  constructor(private readonly coop: CoopService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user?.id) {
      throw new ForbiddenException('Join the co-op to participate');
    }
    const ok = await this.coop.isMember(user.id);
    if (!ok) {
      throw new ForbiddenException('Join the co-op to participate');
    }
    return true;
  }
}
