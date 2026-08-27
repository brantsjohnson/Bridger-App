// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the music (Spotify + Apple Music connect + picks) routes into the API.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';

@Module({
  controllers: [MusicController],
  providers: [MusicService, SupabaseAuthGuard],
  exports: [MusicService]
})
export class MusicModule {}
