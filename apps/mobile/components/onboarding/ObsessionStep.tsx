// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10B - "Obsession." The song you're playing nonstop right now. Connect
// Spotify or Apple Music (with the real brand marks) to pull it automatically,
// or just type it. Skippable.
//
// Connecting a music account is an outbound integration; the actual OAuth link
// runs through data/music (demo mode fakes a connected state). This screen only
// shows the choice and the typed fallback.
//
// LOOK: two white connect boxes with a hard navy outline and navy text, each
// with its brand mark on its own brand-colored square, then an "Or type it"
// divider and one white typing box for the song.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBField } from './onboarding-ui';
import { AppleMusicMark, SpotifyMark } from '../music/BrandMarks';

// BRAND RULE: the two marks are white, so each one keeps its own small brand
// colored square (Spotify green, Apple black) inside the white box. Do not
// recolor the marks and do not put the green mark on another green.
const SPOTIFY_GREEN = '#1DB954';
const APPLE_BLACK = '#000000';

/** The hairline that trails off after the "Or type it" label. */
const DIVIDER_LINE = 'rgba(39,64,135,0.35)';

/**
 * One of the two connect boxes. A white box with a hard navy outline, the brand
 * mark on its own colored square, navy text, and a tick once it is connected.
 */
function MusicConnectButton({
  label,
  connected,
  brandColor,
  mark,
  analyticsId,
  onPress
}: {
  label: string;
  connected: boolean;
  brandColor: string;
  mark: React.ReactNode;
  analyticsId: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: connected }}
      style={{
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: connected ? OB.periwinkle : OB.paper,
        borderWidth: OB_BORDER,
        borderColor: OB.navy
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        {/* The brand square: the only place a non-onboarding color is allowed. */}
        <View
          accessible={false}
          pointerEvents="none"
          style={{
            width: 30,
            height: 30,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: brandColor
          }}
        >
          {mark}
        </View>
        <Text className="font-sans-sb text-[16px]" style={{ color: OB.navy, flexShrink: 1 }}>
          {label}
        </Text>
      </View>
      {/* A tick, so "connected" never depends on the fill color alone. */}
      {connected ? (
        <Text className="font-sans-b text-[15px]" style={{ color: OB.navy }} accessible={false}>
          ✓
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ObsessionStep({
  step,
  total,
  song,
  spotifyConnected,
  appleConnected,
  onChangeSong,
  onConnectSpotify,
  onConnectApple,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  song: string;
  spotifyConnected: boolean;
  appleConnected: boolean;
  onChangeSong: (v: string) => void;
  onConnectSpotify: () => void;
  onConnectApple: () => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const connected = spotifyConnected || appleConnected;

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Everyone has one right now."
      ask="What song is on repeat?"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View style={{ gap: 26, paddingTop: 12 }}>
        {/* THIS SECTION DOES: brand-correct Connect buttons for Spotify + Apple Music. */}
        <View style={{ gap: 11 }}>
          <MusicConnectButton
            label={spotifyConnected ? 'Spotify connected' : 'Connect Spotify'}
            connected={spotifyConnected}
            brandColor={SPOTIFY_GREEN}
            mark={<SpotifyMark size={20} />}
            analyticsId={ONBOARDING.taste.spotify}
            onPress={onConnectSpotify}
          />
          <MusicConnectButton
            label={appleConnected ? 'Apple Music connected' : 'Connect Apple Music'}
            connected={appleConnected}
            brandColor={APPLE_BLACK}
            mark={<AppleMusicMark size={19} />}
            analyticsId={ONBOARDING.taste.apple}
            onPress={onConnectApple}
          />
        </View>

        {/* TYPE: the always-available fallback, no account needed. */}
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text
              className="font-sans-sb text-[12px]"
              style={{ letterSpacing: 1.2, textTransform: 'uppercase', color: OB.navy }}
            >
              {connected ? 'Or type it instead' : 'Or type it'}
            </Text>
            <View
              accessible={false}
              pointerEvents="none"
              style={{ flex: 1, height: 1, backgroundColor: DIVIDER_LINE }}
            />
          </View>
          <OBField
            label="Song and artist"
            value={song}
            onChange={onChangeSong}
            placeholder="Not Strong Enough, boygenius"
            analyticsId={ONBOARDING.taste.song_input}
          />
        </View>
      </View>
    </OnboardingStep>
  );
}
