// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles DemoWeekService so /me, connections, and admin can share the same
// demo-week invite rules.
// ============================================
import { Global, Module } from '@nestjs/common';
import { DemoWeekService } from './demo-week.service';

@Global()
@Module({
  providers: [DemoWeekService],
  exports: [DemoWeekService]
})
export class DemoWeekModule {}
