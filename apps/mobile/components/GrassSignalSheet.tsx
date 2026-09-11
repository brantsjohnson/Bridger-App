// ============================================
// WHAT THIS FILE DOES (plain English):
// Detail sheet when you tap a friend's touch-grass card — what, when, roughly
// where, who's already in — then "I'm in" or "Quietly decline" (declining
// tells nobody; it just clears the card for you). Enough to decide without
// messaging.
// PRIVACY: we only ever surface Close / Friends as the circle it went to. We
// never reveal "Everyone", so a broadcast never feels less personal than a
// close-circle invite.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react-native';
import { GRASS_SIGNAL_SHEET, trackProduct, type GrassSignal } from '@bridger/shared';
import {
  Avatar,
  ButtonSecondary,
  Sheet,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { personById } from '../data/people';

/**
 * Which circle to show. Only Close or Friends are ever named — "Everyone" (and
 * anything unknown) returns null so it's hidden entirely.
 */
function circleLabel(audience?: string): string | null {
  const a = (audience ?? '').toLowerCase();
  if (a === 'close') return 'close friends';
  if (a === 'friends' || a === 'friend') return 'friends';
  return null;
}

export function GrassSignalSheet({
  signal,
  onClose,
  onJoin,
  onDecline,
  parentScreen = 'events'
}: {
  signal: GrassSignal | null;
  onClose: () => void;
  onJoin?: (id: string) => void;
  /** Quietly clear this signal for me — the poster is never notified. */
  onDecline?: (id: string) => void;
  /** Screen that opened this sheet (events or home) for surface analytics. */
  parentScreen?: string;
}) {
  const c = useThemeColors();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (signal) setJoined(false);
  }, [signal]);

  if (!signal) return null;

  const person = personById(signal.personId);
  const first = person.name.split(' ')[0];
  // Who's in: after "I'm in", show You right away even before the parent refreshes.
  const inPeople = (signal.inIds ?? []).map(personById);
  const circle = circleLabel(signal.audience);
  const showYouIn = joined || (signal.inIds ?? []).includes('me');

  function join() {
    if (joined || !signal) return;
    const id = signal.id;
    setJoined(true);
    trackProduct('touch_grass_answered', { parent_screen: parentScreen });
    setTimeout(() => onJoin?.(id), 400);
  }

  // Quietly decline: no message, no notification — just remove the card for me.
  function decline() {
    if (!signal) return;
    const id = signal.id;
    trackProduct('touch_grass_declined', { parent_screen: parentScreen });
    onDecline?.(id);
    onClose();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${first} touched grass`}
      surface="grass_signal_sheet"
      parentScreen={parentScreen}
      dismissAnalyticsId={GRASS_SIGNAL_SHEET.actions.dismiss}
      footer={
        <View className="gap-2.5">
          <ButtonSecondary
            full
            size="lg"
            tone="positive"
            disabled={joined}
            onPress={join}
            analyticsId={GRASS_SIGNAL_SHEET.actions.im_in}
          >
            {joined ? "You're in ✓" : "I'm in"}
          </ButtonSecondary>
          {/* Quietly decline — subtle on purpose; declining is never announced. */}
          <Pressable
            onPress={withAnalyticsPress(GRASS_SIGNAL_SHEET.actions.quietly_decline, decline)}
            accessibilityRole="button"
            accessibilityLabel="Quietly decline"
            className="min-h-[44px] items-center justify-center rounded-full py-2 active:opacity-70"
          >
            <Text className="font-sans-b text-[14px] text-ink-mute">Quietly decline</Text>
          </Pressable>
        </View>
      }
    >
      <View className="gap-4">
        <View className="flex-row items-center gap-3">
          <Avatar name={person.name} emoji={person.emoji} accent={person.accent} personId={person.id} size="lg" />
          <View className="min-w-0 flex-1">
            <Text className="font-sans-b text-[16px] tracking-tight text-ink">{person.name}</Text>
            <Text className="font-sans-sb text-[12px] text-ink-mute">
              {[signal.postedAt, circle ? `told ${circle}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>

        {signal.what ? (
          <View className="rounded-card bg-[#EEF8E3] p-3.5">
            {/* Light mint bubble — keep type near-black so dark mode stays readable. */}
            <Text className="font-sans-sb text-[14px] leading-snug text-[#1C1B16]">
              {signal.what}
            </Text>
          </View>
        ) : null}

        <View className="gap-2.5">
          <Detail
            icon={<ClockIcon size={16} color={c.inkSoft} strokeWidth={2.4} />}
            label="When"
            value={signal.when}
          />
          {signal.where ? (
            <Detail
              icon={<MapPinIcon size={16} color={c.inkSoft} strokeWidth={2.4} />}
              label="Where"
              value={signal.where}
            />
          ) : null}
          <View className="flex-row items-start gap-3">
            <UsersIcon size={16} color={c.inkSoft} strokeWidth={2.4} />
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[12px] text-ink-mute">{"Who's in"}</Text>
              {!showYouIn && inPeople.length === 0 ? (
                <Text className="mt-0.5 font-sans-sb text-[14px] text-ink-mute">
                  Nobody yet — you would be first.
                </Text>
              ) : (
                <View className="mt-1 flex-row items-center gap-2">
                  {showYouIn ? (
                    <Avatar name="You" emoji="🙂" accent="green" personId="me" size="xs" />
                  ) : null}
                  {inPeople
                    .filter((p) => p.id !== 'me')
                    .map((p) => (
                      <Avatar
                        key={p.id}
                        name={p.name}
                        emoji={p.emoji}
                        accent={p.accent}
                        personId={p.id}
                        size="xs"
                      />
                    ))}
                  <Text className="font-sans-sb text-[14px] text-ink">
                    {[
                      showYouIn ? 'You' : null,
                      ...inPeople
                        .filter((p) => p.id !== 'me')
                        .map((p) => p.name.split(' ')[0])
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Sheet>
  );
}

function Detail({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      {icon}
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[12px] text-ink-mute">{label}</Text>
        <Text className="mt-0.5 font-sans-sb text-[14px] text-ink">{value}</Text>
      </View>
    </View>
  );
}
