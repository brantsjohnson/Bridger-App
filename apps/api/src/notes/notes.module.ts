// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the private friend-notes routes into the API.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, SupabaseAuthGuard],
  exports: [NotesService]
})
export class NotesModule {}
