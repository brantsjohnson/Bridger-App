// ============================================
// WHAT THIS FILE DOES (plain English):
// The event page you land on right after creating an event (and when you tap an
// event card). It shows the cover, the basics, and the "who's bringing what"
// list, plus two ways to share: the phone's native share sheet, or copy a link
// to paste anywhere. This is the light version; the full host dashboard comes
// later (see EVENTS.md).
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarIcon, ChevronLeftIcon, LinkIcon, MapPinIcon, Share2Icon, UsersIcon } from 'lucide-react-native';
import type { EventItem } from '@bridger/shared';
import { EVENTS, trackProduct } from '@bridger/shared';
import { ButtonPrimary, ButtonSecondary, CoverArt, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { getEvent } from '../../data/events';
import { personById } from '../../data/people';

// Demo share link. Live: a real deep link / web URL for the event.
function shareLink(id: string): string {
  return `https://bridger.app/e/${id}`;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void getEvent(String(id)).then((e) => {
      if (!alive) return;
      setEvent(e);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  async function onShare() {
    if (!event) return;
    const url = shareLink(event.id);
    try {
      // Open the phone's native share sheet (Messages, etc.).
      await Share.share({ message: `${event.title} — ${event.day} ${event.time}\n${url}`, url });
      trackProduct('event_shared', { method: 'share_sheet' });
    } catch {
      // User cancelled or share unavailable — nothing to do.
    }
  }

  async function onCopy() {
    if (!event) return;
    const url = shareLink(event.id);
    // Web has a clipboard API; on native we show the link so it can be copied.
    // TODO: add expo-clipboard for one-tap copy on iOS / Android.
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      Alert.alert('Link copied', url);
    } else {
      Alert.alert('Event link', url);
    }
    trackProduct('event_shared', { method: 'copy_link' });
  }

  return (
    <View
      className="flex-1 bg-canvas"
      style={{ paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <View className="flex-row items-center px-4 pb-2">
        <Pressable
          onPress={withAnalyticsPress(EVENTS.detail.back, () => router.back())}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
        >
          <ChevronLeftIcon size={22} color={c.ink} strokeWidth={2.6} />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="font-sans-sb text-[13px] text-ink-mute">Loading…</Text>
        </View>
      ) : !event ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-sans-sb text-[14px] text-ink-mute">
            This event could not be found.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="gap-4 pb-8">
            <View className="overflow-hidden rounded-card border border-ink-line" style={{ aspectRatio: 16 / 9 }}>
              <CoverArt cover={event.cover} accent={event.accent} rounded />
            </View>

            <View>
              <Text className="font-pixel text-[22px] text-ink">{event.title}</Text>
              {event.bio ? (
                <Text className="mt-1 font-sans-sb text-[14px] leading-snug text-ink-soft">
                  {event.bio}
                </Text>
              ) : null}
            </View>

            <View className="gap-2.5 rounded-card border border-ink-line bg-surface p-4">
              <DetailRow icon={<CalendarIcon size={16} color={c.inkMute} strokeWidth={2.4} />}>
                {event.day} · {event.time}
              </DetailRow>
              {event.place ? (
                <DetailRow icon={<MapPinIcon size={16} color={c.inkMute} strokeWidth={2.4} />}>
                  {event.place}
                </DetailRow>
              ) : null}
              <DetailRow icon={<UsersIcon size={16} color={c.inkMute} strokeWidth={2.4} />}>
                {event.goingIds.length} going · {(event.invitedIds ?? []).length} invited
              </DetailRow>
            </View>

            {event.assignments && event.assignments.length > 0 ? (
              <View className="gap-2 rounded-card border border-ink-line bg-surface p-4">
                <Text className="font-sans-b text-[13px] text-ink">Who's bringing what</Text>
                {event.assignments.map((a) => {
                  const who = a.assigneeId ? personById(a.assigneeId) : null;
                  return (
                    <View key={a.id} className="flex-row items-center justify-between">
                      <Text
                        className={cn(
                          'min-w-0 flex-1 font-sans-sb text-[13px]',
                          who ? 'text-ink-mute line-through' : 'text-ink'
                        )}
                      >
                        {a.label}
                      </Text>
                      <Text className="font-sans-b text-[13px] text-ink-mute">
                        {who ? who.name.split(' ')[0] : 'Open'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* --- SHARE: native sheet + copy link --- */}
            <View className="gap-2 pt-2">
              <ButtonPrimary
                full
                size="lg"
                onPress={() => void onShare()}
                analyticsId={EVENTS.detail.share}
                icon={<Share2Icon size={18} color={c.ink} strokeWidth={2.4} />}
                accessibilityLabel="Share event"
              >
                Share
              </ButtonPrimary>
              <ButtonSecondary
                full
                tone="outline"
                onPress={() => void onCopy()}
                analyticsId={EVENTS.detail.copy_link}
                icon={<LinkIcon size={16} color={c.ink} strokeWidth={2.4} />}
                accessibilityLabel="Copy event link"
              >
                Copy link
              </ButtonSecondary>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function DetailRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-2.5">
      {icon}
      <Text className="min-w-0 flex-1 font-sans-sb text-[13px] text-ink">{children}</Text>
    </View>
  );
}
