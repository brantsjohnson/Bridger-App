// ============================================
// WHAT THIS FILE DOES (plain English):
// The event page you land on after creating an event (and when you tap an
// event card). Shows a vibrant cover, the basics, Assignments (public list —
// snag open items, remove yourself, check off only your own), and share.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  LinkIcon,
  MapPinIcon,
  Share2Icon,
  UsersIcon
} from 'lucide-react-native';
import type { EventAssignment, EventItem } from '@bridger/shared';
import { EVENTS, trackProduct } from '@bridger/shared';
import {
  ACCENTS,
  ButtonPrimary,
  ButtonSecondary,
  CoverArt,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import {
  assignItem,
  getEvent,
  notifyHostAssignmentChange,
  setAssignmentDone
} from '../../data/events';
import { personById } from '../../data/people';

const ME_ID = 'me';

// Demo share link. Live: a real deep link / web URL for the event.
function shareLink(id: string): string {
  return `https://bridger.app/e/${id}`;
}

function coverTint(event: EventItem): string | undefined {
  const cover = event.cover;
  if (!cover) return ACCENTS[event.accent]?.hex;
  if (cover.kind === 'color' || cover.kind === 'text') return cover.bg;
  if (cover.kind === 'emoji' && cover.bg) return cover.bg;
  return ACCENTS[event.accent]?.hex;
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

  async function refresh() {
    const e = await getEvent(String(id));
    setEvent(e);
  }

  async function onShare() {
    if (!event) return;
    const url = shareLink(event.id);
    try {
      await Share.share({ message: `${event.title} — ${event.day} ${event.time}\n${url}`, url });
      trackProduct('event_shared', { method: 'share_sheet' });
    } catch {
      // User cancelled — nothing to do.
    }
  }

  async function onCopy() {
    if (!event) return;
    const url = shareLink(event.id);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      Alert.alert('Link copied', url);
    } else {
      Alert.alert('Event link', url);
    }
    trackProduct('event_shared', { method: 'copy_link' });
  }

  async function onSnag(item: EventAssignment) {
    if (!event) return;
    await assignItem(event.id, item.id, ME_ID);
    await notifyHostAssignmentChange(event.id, item.id, 'snagged');
    trackProduct('event_assignment_taken');
    await refresh();
  }

  async function onRemoveMe(item: EventAssignment) {
    if (!event) return;
    await assignItem(event.id, item.id, undefined);
    await notifyHostAssignmentChange(event.id, item.id, 'released');
    trackProduct('event_assignment_released');
    await refresh();
  }

  async function onToggleDone(item: EventAssignment) {
    if (!event || item.assigneeId !== ME_ID) return;
    await setAssignmentDone(event.id, item.id, !item.done);
    trackProduct('event_assignment_done');
    await refresh();
  }

  const tint = event ? coverTint(event) : undefined;

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
            <View
              className="overflow-hidden rounded-card border border-ink-line"
              style={{ aspectRatio: 16 / 9 }}
            >
              <CoverArt cover={event.cover} accent={event.accent} rounded />
            </View>

            {/* Accent band under the title — keeps the page colorful */}
            <View
              className="rounded-card border border-ink-line p-4"
              style={tint ? { backgroundColor: `${tint}28` } : undefined}
            >
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
              {event.place || event.address ? (
                <DetailRow icon={<MapPinIcon size={16} color={c.inkMute} strokeWidth={2.4} />}>
                  {event.place || event.address}
                </DetailRow>
              ) : null}
              <DetailRow icon={<UsersIcon size={16} color={c.inkMute} strokeWidth={2.4} />}>
                {event.goingIds.length} going · {(event.invitedIds ?? []).length} invited
                {event.cap ? ` · cap ${event.cap}` : ''}
              </DetailRow>
            </View>

            {event.chipInAmount || event.chipInHandle ? (
              <View className="rounded-card border border-ink-line bg-surface p-4">
                <Text className="font-sans-b text-[12px] text-ink-mute">Chip in</Text>
                <Text className="mt-0.5 font-sans-sb text-[14px] text-ink">
                  {[event.chipInAmount, event.chipInMethod, event.chipInHandle]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            ) : null}

            {event.assignments && event.assignments.length > 0 ? (
              <View className="gap-2.5 rounded-card border border-ink-line bg-surface p-4">
                <Text className="font-sans-b text-[13px] text-ink">Assignments</Text>
                <Text className="font-sans-sb text-[12px] text-ink-mute">
                  Everyone can see these. Only you can check off your own.
                </Text>
                {event.assignments.map((a) => {
                  const who = a.assigneeId ? personById(a.assigneeId) : null;
                  const mine = a.assigneeId === ME_ID;
                  const open = !a.assigneeId;
                  return (
                    <View
                      key={a.id}
                      className="gap-2 rounded-2xl border border-ink-line bg-canvas px-3 py-2.5"
                    >
                      <View className="flex-row items-center gap-2">
                        {mine ? (
                          <Pressable
                            onPress={withAnalyticsPress(EVENTS.detail.assignment_row, () =>
                              void onToggleDone(a)
                            )}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: !!a.done }}
                            accessibilityLabel={a.done ? 'Mark not done' : 'Check off'}
                            className={cn(
                              'h-7 w-7 items-center justify-center rounded-full border',
                              a.done ? 'border-green bg-green' : 'border-ink-line'
                            )}
                          >
                            {a.done ? <CheckIcon size={14} color="#fff" strokeWidth={3} /> : null}
                          </Pressable>
                        ) : (
                          <View className="h-7 w-7 rounded-full border border-ink-line" />
                        )}
                        <Text
                          className={cn(
                            'min-w-0 flex-1 font-sans-sb text-[13px] text-ink',
                            a.done && 'text-ink-mute line-through'
                          )}
                        >
                          {a.label}
                        </Text>
                        <Text className="font-sans-b text-[13px] text-ink-mute">
                          {who ? who.name.split(' ')[0] : 'Open'}
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        {open ? (
                          <Pressable
                            onPress={withAnalyticsPress(EVENTS.detail.assignment_row, () =>
                              void onSnag(a)
                            )}
                            accessibilityRole="button"
                            accessibilityLabel={`Snag ${a.label}`}
                            className="rounded-full border border-green bg-green/15 px-3 py-1.5"
                          >
                            <Text className="font-sans-b text-[12px] text-ink">Snag</Text>
                          </Pressable>
                        ) : null}
                        {mine ? (
                          <Pressable
                            onPress={withAnalyticsPress(EVENTS.detail.assignment_row, () =>
                              void onRemoveMe(a)
                            )}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove me from ${a.label}`}
                            className="rounded-full border border-ink-line px-3 py-1.5"
                          >
                            <Text className="font-sans-b text-[12px] text-ink-mute">Remove me</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* --- SHARE --- */}
            <View className="gap-2 pt-2">
              {event.allowFriendsToInvite ? (
                <Text className="mb-1 font-sans-sb text-[12px] leading-snug text-ink-mute">
                  Friends can invite friends (up to {event.cap ?? 35} guests). Share the link below.
                </Text>
              ) : null}
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
