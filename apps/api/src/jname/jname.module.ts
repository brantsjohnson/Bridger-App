// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the J-name quiz sharing routes (save result, share link, public view,
// referral resolve) into the API.
// ============================================
import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { OptionalSupabaseAuthGuard } from '../auth/optional-auth.guard';
import { JnameController } from './jname.controller';
import { JnameService } from './jname.service';

@Module({
  imports: [ConnectionsModule],
  controllers: [JnameController],
  providers: [JnameService, SupabaseAuthGuard, OptionalSupabaseAuthGuard],
  exports: [JnameService]
})
export class JnameModule {}
