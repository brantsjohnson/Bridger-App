// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the Touch Grass routes so Home and Events can show "who's free".
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { TouchGrassController } from './touchgrass.controller';
import { TouchGrassService } from './touchgrass.service';

@Module({
  controllers: [TouchGrassController],
  providers: [TouchGrassService, SupabaseAuthGuard]
})
export class TouchGrassModule {}
