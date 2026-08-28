// ============================================
// WHAT THIS FILE DOES (plain English):
// Makes the NotificationsService available to every feature module so inserts
// of in-app alerts can check the person's Settings prefs first.
// ============================================
import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
