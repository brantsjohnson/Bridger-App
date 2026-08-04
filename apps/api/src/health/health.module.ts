// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the health-check route together so the app can include it.
// ============================================
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController]
})
export class HealthModule {}
