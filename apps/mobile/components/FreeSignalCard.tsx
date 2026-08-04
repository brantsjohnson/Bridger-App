// ============================================
// WHAT THIS FILE DOES (plain English):
// A friend's "touched grass" card — who wants to hang, WHEN (with a clock),
// and WHAT they want to do (the short title they typed). No "how many people
// are in" count. Saying yes plays a grass burst, then opens the plan.
// Analytics: Home uses announcements.card / touch_grass_im_in / dismiss;
// Events can pass featured_signal or signal_row for the card body.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ClockIcon, XIcon } from 'lucide-react-native';
import { HOME, trackProduct, type GrassSignal } from '@bridger/shared';
import { Avatar, ButtonSecondary, withAnalyticsPress } from '@bridger/ui';
import { getProfilePhoto } from '../data/fixtures/demo-media';
import { personById } from '../data/people';
import { GrassBurst } from './GrassBurst';

/** Prefer the short title they typed; fall back to the longer plan line. */
function activityLine(signal: GrassSignal): string {
  const title = (signal.note ?? signal.what ?? '').trim();
  return title || 'wants to hang';
}

export type FreeSignalAnalyticsIds = {
  /** Tap on the card body (open detail). */
  card?: string;
  /** "I'm in" button. */
  imIn?: string;
  /** "Details" button (opens the detail sheet, same as tapping the card). */
  details?: string;
  /** Dismiss X. */
  dismiss?: string;
};

export function FreeSignalCard({
  signal,
  onDismiss,
  onOpen,
  onJoined,
  burstOnMount = true,
  /** Shortcut for Events list: sets the card-body id only. */
  analyticsId,
  /** Full override set (Home passes all three announcement ids). */
  analyticsIds
}: {
  signal: GrassSignal;
  onDismiss?: () => void;
  onOpen?: () => void;
  onJoined?: () => void;
  /** only the pinned one on Home earns the confetti on load */
  burstOnMount?: boolean;
  analyticsId?: string;
  analyticsIds?: FreeSignalAnalyticsIds;
}) {
  const person = personById(signal.personId);
  const first = person.name.split(' ')[0];
  const [joined, setJoined] = useState(false);
  const [burst, setBurst] = useState(burstOnMount);
  const activity = activityLine(signal);

  // Default to Home announcement ids; Events overrides via props.
  const cardId = analyticsIds?.card ?? analyticsId ?? HOME.announcements.card;
  const imInId = analyticsIds?.imIn ?? HOME.announcements.touch_grass_im_in;
  const detailsId = analyticsIds?.details ?? HOME.announcements.touch_grass_details;
  const dismissId = analyticsIds?.dismiss ?? HOME.announcements.touch_grass_dismiss;

  function join() {
    if (joined) return;
    setJoined(true);
    setBurst(true);
    // Product outcome: they answered a touch-grass signal (no content logged).
    trackProduct('touch_grass_answered');
    setTimeout(() => onJoined?.(), 850);
  }

  return (
    <View className="relative min-h-[124px] overflow-visible rounded-card border-2 border-green bg-[#EEF8E3] px-4 py-3.5">
      <GrassBurst play={burst} onDone={() => setBurst(false)} />

      <Pressable
        onPress={withAnalyticsPress(cardId, onOpen)}
        disabled={!onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${first} touched grass. ${signal.when}. ${activity}`}
        className="flex-row items-center gap-3 pr-8"
      >
        <Avatar
          name={person.name}
          emoji={person.emoji}
          accent={person.accent}
          photo={getProfilePhoto(person.id)}
          size="sm"
        />
        <View className="min-w-0 flex-1">
          <Text className="font-sans-b text-[14px] tracking-tight text-onaccent" numberOfLines={1}>
            🌱 {first} touched grass
          </Text>
          {/* when + what — clock makes timing glanceable; activity is the title */}
          <View className="mt-1 flex-row items-center gap-1.5">
            <ClockIcon size={13} color="#4A483F" strokeWidth={2.6} />
            <Text className="min-w-0 flex-1 font-sans-sb text-[12px] text-onaccent/75" numberOfLines={1}>
              {signal.when} · {activity}
            </Text>
          </View>
        </View>
      </Pressable>

      {onDismiss ? (
        <Pressable
          onPress={withAnalyticsPress(dismissId, onDismiss)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="absolute right-2.5 top-2.5 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-surface"
        >
          <XIcon size={16} color="#4A483F" strokeWidth={2.6} />
        </Pressable>
      ) : null}

      {/*
        Split action row: "I'm in" says yes right here, "Details" opens the
        full sheet (same as tapping the whole card). If there's no detail sheet
        wired (rare), "I'm in" just fills the row on its own.
      */}
      <View className="mt-3 flex-row gap-2.5">
        <View className="flex-1">
          <ButtonSecondary
            full
            size="sm"
            tone="positive"
            onPress={join}
            disabled={joined}
            analyticsId={imInId}
          >
            {joined ? "You're in ✓" : "I'm in"}
          </ButtonSecondary>
        </View>
        {onOpen ? (
          <View className="flex-1">
            <ButtonSecondary
              full
              size="sm"
              tone="outline"
              onPress={onOpen}
              analyticsId={detailsId}
            >
              Details
            </ButtonSecondary>
          </View>
        ) : null}
      </View>
    </View>
  );
}
