// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10B - "Obsession." The song you're playing nonstop right now. Connect
// Spotify or Apple Music (with the real brand marks) to pull it automatically,
// or just type it. Skippable.
//
// After a successful connect, a search sheet pops up so you can pick the track
// (saves Listening on your profile too). You can reopen search anytime once
// linked. Typing by hand stays as the fallback.
//
// Connecting a music account is an outbound integration. Tapping a box opens
// the real Spotify / Apple Music allow screen (via data/music + Nest). Demo mode
// fakes a connected state so the UI can still be clicked through without keys.
//
// LOOK: two white connect boxes with a hard navy outline and navy text, each
// with its brand mark on its own brand-colored square, then an "Or type it"
// divider and one white typing box for the song.
// ============================================
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep, useOnboardingBodyScroll } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBField } from './onboarding-ui';
import { ObsessionSongSheet } from './ObsessionSongSheet';
import { AppleMusicMark, SpotifyMark } from '../music/BrandMarks';

// BRAND RULE: the two marks are white, so each one keeps its own small brand
// colored square (Spotify green, Apple black) inside the white box. Do not
// recolor the marks and do not put the green mark on another green.
const SPOTIFY_GREEN = '#1DB954';
const APPLE_BLACK = '#000000';

/**
 * One of the two connect boxes. A white box with a hard navy outline, the brand
 * mark on its own colored square, navy text, and a tick once it is connected.
 */
function MusicConnectButton({
  label,
  connected,
  busy,
  disabled,
  brandColor,
  mark,
  analyticsId,
  onPress
}: {
  label: string;
  connected: boolean;
  /** True while the browser sheet is open or Nest is finishing the link. */
  busy?: boolean;
  disabled?: boolean;
  brandColor: string;
  mark: React.ReactNode;
  analyticsId: string;
  onPress: () => void;
}) {
  const inert = !!busy || !!disabled;
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: connected, disabled: inert, busy: !!busy }}
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
        borderColor: OB.navy,
        opacity: inert && !connected ? 0.7 : 1
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
          {busy ? 'Connecting…' : label}
        </Text>
      </View>
      {/* Spinner while OAuth runs; tick once Nest confirms the link. */}
      {busy ? (
        <ActivityIndicator size="small" color={OB.navy} />
      ) : connected ? (
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
  connectBusy,
  songSheetOpen,
  onChangeSong,
  onConnectSpotify,
  onConnectApple,
  onCloseSongSheet,
  onPickSong,
  onOpenSongSheet,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  song: string;
  spotifyConnected: boolean;
  appleConnected: boolean;
  /** Which connect flow is in progress (blocks the other button too). */
  connectBusy?: 'spotify' | 'apple' | null;
  /** Song search sheet after a successful music connect. */
  songSheetOpen?: boolean;
  onChangeSong: (v: string) => void;
  onConnectSpotify: () => void;
  onConnectApple: () => void;
  onCloseSongSheet?: () => void;
  onPickSong?: (label: string) => void;
  /** Re-open search when already connected (change the pick). */
  onOpenSongSheet?: () => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const connected = spotifyConnected || appleConnected;
  const anyBusy = connectBusy != null;
  // "Or type it" sits on the page canvas, so ink follows light/dark.
  const theme = useThemeColors();
  // THIS SECTION DOES: keep the song field above the keyboard when typing.
  const { ensureVisible } = useOnboardingBodyScroll();

  return (
    <>
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
          {/* THIS SECTION DOES: real Connect buttons for Spotify + Apple Music. */}
          <View style={{ gap: 11 }}>
            <MusicConnectButton
              label={spotifyConnected ? 'Spotify connected' : 'Connect Spotify'}
              connected={spotifyConnected}
              busy={connectBusy === 'spotify'}
              disabled={anyBusy || spotifyConnected}
              brandColor={SPOTIFY_GREEN}
              mark={<SpotifyMark size={20} />}
              analyticsId={ONBOARDING.taste.spotify}
              onPress={onConnectSpotify}
            />
            <MusicConnectButton
              label={appleConnected ? 'Apple Music connected' : 'Connect Apple Music'}
              connected={appleConnected}
              busy={connectBusy === 'apple'}
              disabled={anyBusy || appleConnected}
              brandColor={APPLE_BLACK}
              mark={<AppleMusicMark size={19} />}
              analyticsId={ONBOARDING.taste.apple}
              onPress={onConnectApple}
            />
          </View>

          {/* Already linked: offer search again without redoing OAuth. */}
          {connected && onOpenSongSheet ? (
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.taste.song_search, onOpenSongSheet)}
              accessibilityRole="button"
              accessibilityLabel="Search for a song"
              style={{
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                backgroundColor: OB.greenWash,
                borderWidth: OB_BORDER,
                borderColor: OB.navy
              }}
            >
              <Text className="font-sans-b text-[14px]" style={{ color: OB.navy }}>
                {song.trim() ? 'Change song from Spotify' : 'Search Spotify for a song'}
              </Text>
            </Pressable>
          ) : null}

          {/* TYPE: the always-available fallback, no account needed. */}
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text
                className="font-sans-sb text-[12px]"
                style={{ letterSpacing: 1.2, textTransform: 'uppercase', color: theme.ink }}
              >
                {connected ? 'Or type it instead' : 'Or type it'}
              </Text>
              <View
                accessible={false}
                pointerEvents="none"
                style={{ flex: 1, height: 1, backgroundColor: theme.inkLine }}
              />
            </View>
            <OBField
              label="Song and artist"
              value={song}
              onChange={onChangeSong}
              placeholder="Not Strong Enough, boygenius"
              analyticsId={ONBOARDING.taste.song_input}
              onFocusExtra={(anchor) => ensureVisible(anchor)}
            />
          </View>
        </View>
      </OnboardingStep>

      {/* SEARCH SHEET: pops after Agree, or when they tap Search Spotify. */}
      <ObsessionSongSheet
        open={!!songSheetOpen}
        onClose={() => onCloseSongSheet?.()}
        onPick={(label) => onPickSong?.(label)}
      />
    </>
  );
}
