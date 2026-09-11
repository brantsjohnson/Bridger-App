// ============================================
// WHAT THIS FILE DOES (plain English):
// The row of four photo looks under the profile photo on Confirm your details.
// Pop art leads with an instant on-device Warhol preview; all four looks
// (Pop art, Comic, Sepia, X-ray) bake on Bridger servers so the filtered face
// is the saved avatar everywhere. Tap one and the pink pill highlight moves.
// Under the row a badge says the look ran on the phone (not AI). It stays
// up for Pop art, Comic, Sepia, and X-ray.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LaptopIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import { OB, OB_BORDER } from './onboarding-theme';

/** The four profile-photo looks a person can pick from. */
export type PhotoFilterKey = 'pop_art' | 'x_ray' | 'comic' | 'sepia';

/** Human labels shown in the row (order matches FILTER_OPTIONS). */
const FILTER_OPTIONS: Array<{ key: PhotoFilterKey; label: string; analyticsId: string }> = [
  {
    key: 'pop_art',
    label: 'Pop art',
    analyticsId: ONBOARDING.confirm_profile.filter_pop_art
  },
  {
    key: 'comic',
    label: 'Comic',
    analyticsId: ONBOARDING.confirm_profile.filter_comic
  },
  {
    key: 'sepia',
    label: 'Sepia',
    analyticsId: ONBOARDING.confirm_profile.filter_sepia
  },
  {
    key: 'x_ray',
    label: 'X-ray',
    analyticsId: ONBOARDING.confirm_profile.filter_x_ray
  }
];

/** Solid light blue behind the local-processing badge (opaque so text stays readable on dark canvases). */
const LOCAL_BADGE_BG = '#AEBCFB';
/** Dark ink on that light blue: stays readable in light and dark surroundings. */
const LOCAL_BADGE_INK = OB.navy;
/** Forced white track + dark labels so dark mode never swallows the filter row. */
const FILTER_TRACK_BG = '#FFFFFF';
const FILTER_LABEL_INK = '#1C1B16';

export function PhotoFilterPicker({
  value,
  onChange,
  analyticsIds
}: {
  value: PhotoFilterKey;
  onChange: (filter: PhotoFilterKey) => void;
  /**
   * Optional overrides when this row is reused outside onboarding (e.g. Profile
   * Edit). Defaults to the Confirm-your-details ids.
   */
  analyticsIds?: Partial<Record<PhotoFilterKey, string>>;
}) {
  // All four looks paint on the phone first. The badge stays on whichever
  // pill is picked so Comic / Sepia / X-ray never look like they went to AI.

  return (
    <View style={{ gap: 8 }}>
      {/* THIS SECTION DOES: the four filter labels in one white capsule.
          Hex colors stay fixed so a dark page canvas cannot hide the row. */}
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Photo filter"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 999,
          borderWidth: OB_BORDER,
          borderColor: FILTER_LABEL_INK,
          backgroundColor: FILTER_TRACK_BG,
          padding: 4
        }}
      >
        {FILTER_OPTIONS.map(({ key, label, analyticsId }) => {
          const active = key === value;
          const id = analyticsIds?.[key] ?? analyticsId;
          return (
            <Pressable
              key={key}
              onPress={withAnalyticsPress(id, () => onChange(key))}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              style={{
                minHeight: 40,
                minWidth: 44,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                paddingHorizontal: 6,
                paddingVertical: 8,
                backgroundColor: active ? OB.pink : 'transparent'
              }}
            >
              <Text
                numberOfLines={1}
                className={active ? 'font-sans-b' : 'font-sans-sb'}
                style={{
                  fontSize: 11,
                  letterSpacing: -0.2,
                  color: active ? OB.onColor : FILTER_LABEL_INK
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* THIS SECTION DOES: says the look ran on the phone, not AI. */}
      {value ? (
        <AnalyticsRegion
          analyticsId={ONBOARDING.confirm_profile.local_processing_badge}
          interactive={false}
          accessibilityLabel="Ran 100 percent locally. Not AI."
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              alignSelf: 'stretch',
              borderRadius: 999,
              backgroundColor: LOCAL_BADGE_BG,
              paddingHorizontal: 14,
              paddingVertical: 10
            }}
          >
            <View style={{ width: 22, height: 16, alignItems: 'center', justifyContent: 'center' }}>
              <LaptopIcon size={18} color={LOCAL_BADGE_INK} strokeWidth={2.2} />
              <Text
                accessible={false}
                style={{
                  position: 'absolute',
                  fontSize: 7,
                  lineHeight: 8,
                  fontWeight: '700',
                  color: LOCAL_BADGE_INK,
                  marginTop: 2
                }}
              >
                {'<>'}
              </Text>
            </View>
            <Text
              className="font-sans-m"
              style={{ fontSize: 13, letterSpacing: -0.2, color: LOCAL_BADGE_INK }}
            >
              Ran 100% locally - not AI
            </Text>
          </View>
        </AnalyticsRegion>
      ) : null}
    </View>
  );
}
