// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10B — "Obsession." The song you're playing nonstop right now. Connect
// Spotify or Apple Music (with the real brand marks) to pull it automatically,
// or just type it. Skippable.
//
// Connecting a music account is an outbound integration; the actual OAuth link
// runs through data/music (demo mode fakes a connected state). This screen only
// shows the choice and the typed fallback.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { TextField, cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_MUTED } from './onboarding-wash';
import { AppleMusicMark, SpotifyMark } from '../music/BrandMarks';

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
      accent="purple"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-4">
        {/* THIS SECTION DOES: brand-correct Connect buttons for Spotify + Apple Music. */}
        <View className="gap-2.5">
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.taste.spotify, onConnectSpotify)}
            accessibilityRole="button"
            accessibilityState={{ selected: spotifyConnected }}
            accessibilityLabel={spotifyConnected ? 'Spotify connected' : 'Connect Spotify'}
            className={cn(
              'min-h-[52px] flex-row items-center justify-between rounded-card px-4',
              spotifyConnected ? 'bg-teal' : 'bg-[#1DB954]'
            )}
          >
            <View className="flex-row items-center gap-3">
              <SpotifyMark size={24} />
              <Text className="font-sans-b text-[16px] text-white">
                {spotifyConnected ? 'Spotify connected' : 'Connect Spotify'}
              </Text>
            </View>
            {spotifyConnected ? (
              <CheckIcon size={18} color="#FFFFFF" strokeWidth={3} />
            ) : null}
          </Pressable>

          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.taste.apple, onConnectApple)}
            accessibilityRole="button"
            accessibilityState={{ selected: appleConnected }}
            accessibilityLabel={appleConnected ? 'Apple Music connected' : 'Connect Apple Music'}
            className={cn(
              'min-h-[52px] flex-row items-center justify-between rounded-card px-4',
              appleConnected ? 'bg-teal' : 'bg-ink'
            )}
          >
            <View className="flex-row items-center gap-3">
              <AppleMusicMark size={22} />
              <Text className="font-sans-b text-[16px] text-white">
                {appleConnected ? 'Apple Music connected' : 'Connect Apple Music'}
              </Text>
            </View>
            {appleConnected ? (
              <CheckIcon size={18} color="#FFFFFF" strokeWidth={3} />
            ) : null}
          </Pressable>
        </View>

        {/* TYPE: the always-available fallback, no account needed. */}
        <View className="gap-1.5">
          <Text className={cn('px-1 font-sans-sb text-[12px]', WASH_MUTED)}>
            {connected ? 'Or type it instead' : 'Or just type it'}
          </Text>
          <TextField
            labelTone="onaccent"
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
