// ============================================
// WHAT THIS FILE DOES (plain English):
// One place that writes in-app notification rows AND respects the person's
// Settings prefs. Callers pass the kind + payload; we look up notif_prefs and
// skip the insert when that kind (or circle) is turned off. In-app Alerts can
// still be forced with `forceInApp` for things that should always land in the
// list even when push is off — today we gate the row itself so a turned-off
// kind stays quiet end to end.
// Spec: NOTIFICATIONS.md.
// ============================================
import { Injectable } from '@nestjs/common';
import type {
  Json,
  NotificationCircleId,
  NotificationKind,
  NotificationPrefsState
} from '@bridger/shared';
import {
  isPushAllowedForKind,
  normalizeStoredNotificationPrefs
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Load the person's prefs (defaults filled in). */
  async getPrefs(userId: string): Promise<NotificationPrefsState> {
    const { data } = await this.supabase.admin
      .from('user_settings')
      .select('notif_prefs')
      .eq('user_id', userId)
      .maybeSingle();
    return normalizeStoredNotificationPrefs(data?.notif_prefs);
  }

  /**
   * Insert a notification row only when prefs allow it.
   * Returns whether a row was written.
   */
  async notifyIfAllowed(input: {
    userId: string;
    kind: NotificationKind;
    payload?: Json;
    /** Sender's circle (close/friend/acquaintance) when the kind is circle-gated. */
    actorCircle?: NotificationCircleId;
  }): Promise<boolean> {
    const prefs = await this.getPrefs(input.userId);
    if (!isPushAllowedForKind(input.kind, prefs, input.actorCircle)) {
      return false;
    }
    const { error } = await this.supabase.admin.from('notifications').insert({
      user_id: input.userId,
      kind: input.kind,
      payload: (input.payload ?? {}) as Json,
      read: false
    });
    if (error) throw error;
    return true;
  }
}
