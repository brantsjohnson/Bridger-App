// ============================================
// WHAT THIS FILE DOES (plain English):
// One full-width pick row for New onboarding. Rounded, no outline (same as
// the birthday-audience cards). Tapping a row with an emoji sprays that
// emoji over the page so you can still scroll. A picked row fills with color.
// ============================================
import React, { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { AnalyticsRegion, useReduceMotion, withAnalyticsPress } from '@bridger/ui';
import { emojisInText } from '../../lib/emojis-in-text';
import { useOnboardingBurst } from './onboarding-chrome';
import { OB, OB_RADIUS } from './onboarding-theme';

export function OnboardingPickRow({
  label,
  sublabel,
  emoji,
  selected,
  fillColor,
  analyticsId,
  analyticsProps,
  onPress
}: {
  label: string;
  sublabel?: string;
  emoji?: string;
  selected: boolean;
  /** Concept color when this row is on (purple for picks, teal for co-op). */
  fillColor: string;
  analyticsId: string;
  analyticsProps?: Record<string, string | number | boolean | undefined>;
  onPress: () => void;
}) {
  const reduce = useReduceMotion();
  const burstHost = useOnboardingBurst();
  const rowRef = useRef<View>(null);
  const shower = emoji ? [emoji, ...emojisInText(label)] : emojisInText(label);

  const run = () => {
    // Paint emojis over the page so the list can still scroll while they fall.
    if (!reduce && shower.length > 0) {
      rowRef.current?.measureInWindow((x, y, _width, height) => {
        burstHost?.playBurst({
          origin: { x: x + 28, y: y + height / 2 },
          emoji: shower
        });
      });
    }
    onPress();
  };

  const onInk = selected ? '#FFFFFF' : OB.navy;

  return (
    <View>
      <Pressable
        ref={rowRef}
        onPress={withAnalyticsPress(analyticsId, run, { analyticsProps })}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={sublabel ? `${label}. ${sublabel}` : label}
        style={{
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: selected ? fillColor : OB.paper,
          borderWidth: 0,
          borderRadius: OB_RADIUS
        }}
      >
        <View
          accessible={false}
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: selected ? '#FFFFFF' : 'rgba(28,27,22,0.25)',
            backgroundColor: selected ? '#FFFFFF' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {selected ? <CheckIcon size={10} color={fillColor} strokeWidth={4} /> : null}
        </View>
        {emoji ? (
          <Text accessible={false} style={{ fontSize: 18 }}>
            {emoji}
          </Text>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            className="font-sans-b text-[15px]"
            style={{ color: onInk }}
            numberOfLines={2}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text
              className="font-sans-sb text-[12px]"
              style={{ color: selected ? 'rgba(255,255,255,0.8)' : OB.inkSoft }}
              numberOfLines={2}
            >
              {sublabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

/** Dead-click label above a pick group (decade, etc.). */
export function OnboardingPickGroupLabel({
  label,
  analyticsId
}: {
  label: string;
  analyticsId: string;
}) {
  return (
    <AnalyticsRegion analyticsId={analyticsId} interactive={false}>
      <Text
        className="font-sans-b text-[12px]"
        style={{ color: OB.inkSoft, letterSpacing: 0.4, marginBottom: 8 }}
      >
        {label}
      </Text>
    </AnalyticsRegion>
  );
}
