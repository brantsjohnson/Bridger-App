// ============================================
// WHAT THIS FILE DOES (plain English):
// The server's admin connection to Supabase. It uses the SECRET key, which has
// full rights and bypasses row-level security. That's on purpose: the API is
// trusted code that enforces its own rules, so it can read/write anything it
// needs to. This client must NEVER be exposed to the app.
// ============================================
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@bridger/shared';

@Injectable()
export class SupabaseService {
  // The typed admin client. `Database` gives column/enum safety across the API.
  public readonly admin: SupabaseClient<Database>;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const secretKey = this.config.getOrThrow<string>('SUPABASE_SECRET_KEY');

    this.admin = createClient<Database>(url, secretKey, {
      // The server has no user session; it authenticates purely with the key.
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
}
