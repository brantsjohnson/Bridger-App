// ============================================
// WHAT THIS FILE DOES (plain English):
// The one-time "what is this section?" card at the top of Home when there are
// not yet any live announcements. Explains that co-op notes and app news land
// here. Tap the green card or the X to dismiss (not "anywhere" on the screen,
// which used to open Stories by mistake).
//
// Analytics: tap card → intro_card; X → intro_dismiss.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { XIcon } from 'lucide-react-native';
import { HOME } from '@bridger/shared';
import { ORGANIC, withAnalyticsPress } from '@bridger/ui';

export function IntroAnnouncementCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Pressable
      onPress={withAnalyticsPress(HOME.announcements.intro_card, onDismiss)}
      accessibilityRole="button"
      accessibilityLabel="Announcements intro. Tap to dismiss."
      style={ORGANIC.soft}
      className="relative min-h-[124px] bg-green px-5 py-4 active:opacity-90"
    >
      {/* THIS SECTION DOES: X closes the card (same outcome, own analytics id). */}
      <Pressable
        onPress={withAnalyticsPress(HOME.announcements.intro_dismiss, onDismiss)}
        accessibilityRole="button"
        accessibilityLabel="Close announcements intro"
        hitSlop={8}
        className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-white/25"
      >
        <XIcon size={16} color="#1C1B16" strokeWidth={2.6} />
      </Pressable>

      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        className="font-sans-b text-[11px] uppercase tracking-wide text-onaccent/70"
      >
        Announcements
      </Text>
      <Text className="mt-1 pr-8 font-sans-b text-[16px] leading-snug tracking-tight text-onaccent">
        This is where notes from the co-op and exciting things about the app show up.
      </Text>
      <Text className="mt-2 pr-8 font-sans-sb text-[13px] leading-snug text-onaccent/80">
        Tap this card or the X to dismiss.
      </Text>
    </Pressable>
  );
}
