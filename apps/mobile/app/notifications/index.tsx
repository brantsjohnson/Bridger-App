// ============================================
// WHAT THIS FILE DOES (plain English):
// The full Notifications page — every alert in one list (not Messages — those
// stay on the Messages tab). Filter by Home / Friends / Events / Discover so
// you can see why a nav-bar dot is lit. Mark all as read clears unread on the
// filter you're viewing (All = everything; Home = Home only; etc.) and matching
// Home reply chips when Home is included. Opened from Home "See all".
// Design: Magic Patterns NotificationsScreen. Spec: NOTIFICATIONS.md.
// ============================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import {
  NOTIFICATIONS,
  NOTIFICATION_PAGE_FILTERS,
  matchesNotificationPageFilter,
  trackClick,
  trackProduct,
  type AppNotification,
  type NotificationPageFilter
} from '@bridger/shared';
import {
  Card,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenHeader,
  TAB_COLOR,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import { NotificationRow } from '../../components/NotificationRow';
import {
  clearStoryReplyNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../../data/feed';
import { notifyTabAttentionChanged } from '../../data/tab-badges';
import { pathForNotification } from '../../lib/notification-routes';

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<NotificationPageFilter>('all');

  const reload = useCallback(() => {
    return listNotifications().then((rows) => {
      setItems(rows);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    reload().then(() => {
      if (!alive) return;
    });
    return () => {
      alive = false;
    };
  }, [reload]);

  const visible = useMemo(
    () => items.filter((n) => matchesNotificationPageFilter(n.kind, filter)),
    [items, filter]
  );

  const hasUnread = useMemo(
    () => visible.some((n) => n.unread !== false),
    [visible]
  );

  const openRow = useCallback(
    (n: AppNotification) => {
      trackProduct('notification_opened', { kind: n.kind, source: 'list' });
      if (n.kind === 'story_reply') {
        clearStoryReplyNotifications({ personId: n.personId });
      } else {
        markNotificationRead(n.id);
      }
      notifyTabAttentionChanged();
      setItems((prev) =>
        prev.map((row) => (row.id === n.id ? { ...row, unread: false } : row))
      );
      router.push(pathForNotification(n) as Href);
    },
    [router]
  );

  const markAll = useCallback(() => {
    trackClick(NOTIFICATIONS.list.mark_all_read, { filter });
    markAllNotificationsRead(filter);
    notifyTabAttentionChanged();
    trackProduct('notifications_marked_read', { filter });
    void reload();
  }, [filter, reload]);

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        onBack={() => router.back()}
        hideProfile
        backAnalyticsId={NOTIFICATIONS.top_nav.back}
        titleAnalyticsId={NOTIFICATIONS.top_nav.page_title}
        analyticsSurface="notifications"
      />
      <ScreenBody tabBarInset={false}>
        {/* Filter chips — same pages as the floating nav (no Messages). */}
        <View className="mb-3 flex-row flex-wrap gap-2">
          {NOTIFICATION_PAGE_FILTERS.map((f) => {
            const on = filter === f.id;
            const accent =
              f.id === 'all' ? undefined : TAB_COLOR[f.id as keyof typeof TAB_COLOR];
            return (
              <Pressable
                key={f.id}
                onPress={withAnalyticsPress(NOTIFICATIONS.list.filter, () => setFilter(f.id), {
                  analyticsProps: { filter: f.id }
                })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Filter ${f.label}`}
                style={on && accent ? { backgroundColor: accent } : undefined}
                className={cn(
                  'rounded-full px-3.5 py-2',
                  on && !accent ? 'bg-ink' : null,
                  !on ? 'border border-ink-line bg-surface' : null
                )}
              >
                <Text
                  className={cn(
                    'font-sans-b text-[13px]',
                    on ? (accent ? 'text-white' : 'text-canvas') : 'text-ink-soft'
                  )}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {hasUnread ? (
          <Pressable
            onPress={withAnalyticsPress(NOTIFICATIONS.list.mark_all_read, markAll)}
            accessibilityRole="button"
            accessibilityLabel={
              filter === 'all'
                ? 'Mark all notifications as read'
                : `Mark all ${filter} notifications as read`
            }
            className="mb-3 self-start active:opacity-80"
          >
            <Text className="font-sans-b text-[13px] text-purple">Mark all as read</Text>
          </Pressable>
        ) : null}

        {!loaded ? null : visible.length === 0 ? (
          <EmptyState
            emoji="🔔"
            line={
              filter === 'all'
                ? 'All caught up! When your people post or reply, it shows up here.'
                : `Nothing for ${filter} right now.`
            }
            analyticsId={NOTIFICATIONS.list.empty_body}
          />
        ) : (
          <Card className="gap-1 p-1.5">
            {visible.map((n) => (
              <NotificationRow key={n.id} item={n} onPress={() => openRow(n)} />
            ))}
          </Card>
        )}
        <View className="h-6" />
      </ScreenBody>
    </Screen>
  );
}
