// ============================================
// WHAT THIS FILE DOES (plain English):
// Makes the server's Supabase admin connection available to every other part of
// the API. Marking it @Global means feature modules can use SupabaseService
// without importing this module each time.
// ============================================
import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService]
})
export class SupabaseModule {}
