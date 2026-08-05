// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the /content routes. Reuses AdminService for the shared
// home_defaults / themed_prompts reads so we do not duplicate that logic.
// ============================================
import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ContentController } from './content.controller';

@Module({
  imports: [AdminModule],
  controllers: [ContentController],
  providers: [SupabaseAuthGuard]
})
export class ContentModule {}
