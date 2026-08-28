// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the /photo-filters route with the auth guard it needs, and exports the
// service so the admin health page can check that ImageMagick is installed. Added
// to the app's wiring diagram (app.module.ts) so the route is live.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { PhotoFiltersController } from './photo-filters.controller';
import { PhotoFiltersService } from './photo-filters.service';

@Module({
  controllers: [PhotoFiltersController],
  providers: [PhotoFiltersService, SupabaseAuthGuard],
  exports: [PhotoFiltersService]
})
export class PhotoFiltersModule {}
