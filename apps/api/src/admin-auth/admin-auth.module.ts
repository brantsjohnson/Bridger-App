// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the admin login route and the AdminGuard so other modules can reuse
// the guard without redefining it.
// ============================================
import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [AdminAuthController],
  providers: [AdminGuard],
  exports: [AdminGuard]
})
export class AdminAuthModule {}
