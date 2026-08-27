// ============================================
// WHAT THIS FILE DOES (plain English):
// The Settings tab on your profile: appearance, who sees what, storage,
// Discover, page customization, notifications (opens per-group prefs), blocked
// people, account, and Log out. Rows that lead to surfaces we haven't built yet
// show a small note instead of going nowhere silently. Log out is always
// reachable here, which the app stores require.
// Analytics: each row uses PROFILE.settings.* so taps land in PostHog by name.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BillyStatusDto, Person } from '@bridger/shared';
import { PROFILE, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonSecondary,
  Card,
  ListRow,
  Toggle
} from '@bridger/ui';
import { useColorScheme } from '../useColorScheme';
import type { StorageState } from '../../data/profile';
import {
  getAlwaysViewOriginal,
  setAlwaysViewOriginal
} from '../../data/profile-presentation';
import {
  cancelBillyPlus,
  fetchAssistantSettings,
  fetchBillyStatus,
  setAssistantEnabled,
  startBillyPlusStub
} from '../../data/assistant';
import { getMembership } from '../../data/coop';
import {
  EMOJI_BOMB_LIVE,
  __demoQueueTrigger,
  resolveEmojiBombId
} from '../../data/delight';
import {
  disconnectAppleMusic,
  disconnectSpotify,
  fetchMusicStatus,
  syncTopArtists
} from '../../data/music';
import { disableDemoMode, isDemoMode } from '../../lib/demo';
import { useAuth } from '../../providers/auth-provider';
import { connectAppleMusicAccount } from '../../lib/apple-music-connect';
import { connectSpotifyAccount } from '../../lib/spotify-connect';
import { DelightErrorBoundary } from '../../delight/_host/DelightErrorBoundary';
import { EmojiRain } from '../../delight/effects/emoji-rain';
import { BlockedPeopleSheet } from './BlockedPeopleSheet';

export function ProfileSettings({
  blocked,
  storage,
  onUnblock,
  onSignOut
}: {
  blocked: Person[];
  storage: StorageState;
  onUnblock: (id: string) => void;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useColorScheme();
  /** a standing preference for other people's pages — never your own */
  const [preferOriginal, setPreferOriginal] = useState(false);
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [assistantOn, setAssistantOn] = useState(false);
  const [billyStatus, setBillyStatus] = useState<BillyStatusDto | null>(null);
  const [spotifyOn, setSpotifyOn] = useState(false);
  const [spotifyBusy, setSpotifyBusy] = useState(false);
  const [appleOn, setAppleOn] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [rainPreview, setRainPreview] = useState(false);
  // THIS SECTION DOES: stop a slow Settings load from flipping the Billy toggle
  // back off after you already switched it (Settings unmounts when you leave).
  const assistantTouched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void getAlwaysViewOriginal().then((v) => {
      if (!cancelled) setPreferOriginal(v);
    });
    void fetchAssistantSettings().then((s) => {
      if (cancelled) return;
      setAssistantVisible(s.assistantVisible);
      if (!assistantTouched.current) {
        setAssistantOn(s.assistantEnabled);
      }
      if (s.assistantEnabled) {
        void fetchBillyStatus().then((b) => {
          if (!cancelled) setBillyStatus(b);
        });
      }
    });
    void fetchMusicStatus().then((s) => {
      if (!cancelled) {
        setSpotifyOn(s.spotify);
        setAppleOn(s.appleMusic);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // THIS SECTION DOES: link or unlink Spotify (account link, not Bridger login).
  const onSpotifyRow = () => {
    if (spotifyBusy) return;
    if (spotifyOn) {
      Alert.alert(
        'Disconnect Spotify?',
        'Removes the link and synced top artists. Your Bridger login is unchanged.',
        [
          { text: 'Keep linked', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              setSpotifyBusy(true);
              void disconnectSpotify()
                .then(() => {
                  setSpotifyOn(false);
                  trackProduct('music_disconnected', { method: 'spotify' });
                })
                .catch(() => Alert.alert('Could not disconnect', 'Try again in a moment.'))
                .finally(() => setSpotifyBusy(false));
            }
          }
        ]
      );
      return;
    }
    setSpotifyBusy(true);
    void connectSpotifyAccount()
      .then(async (r) => {
        if (r.cancelled) return;
        if (!r.ok) {
          Alert.alert('Could not link Spotify', r.error ?? 'Try again.');
          return;
        }
        setSpotifyOn(true);
        trackProduct('music_connected', { method: 'spotify' });
        try {
          await syncTopArtists();
          trackProduct('music_taste_synced', { method: 'spotify' });
        } catch {
          // connect still succeeded
        }
        Alert.alert('Spotify linked', 'You can set Listening and save songs from friends.');
      })
      .catch(() => Alert.alert('Could not link Spotify', 'Try again in a moment.'))
      .finally(() => setSpotifyBusy(false));
  };

  // THIS SECTION DOES: link or unlink Apple Music (account link, not Bridger login).
  const onAppleRow = () => {
    if (appleBusy) return;
    if (appleOn) {
      Alert.alert(
        'Disconnect Apple Music?',
        'Removes the link and synced top artists. Your Bridger login is unchanged.',
        [
          { text: 'Keep linked', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              setAppleBusy(true);
              void disconnectAppleMusic()
                .then(() => {
                  setAppleOn(false);
                  trackProduct('music_disconnected', { method: 'apple_music' });
                })
                .catch(() => Alert.alert('Could not disconnect', 'Try again in a moment.'))
                .finally(() => setAppleBusy(false));
            }
          }
        ]
      );
      return;
    }
    setAppleBusy(true);
    void connectAppleMusicAccount()
      .then(async (r) => {
        if (r.cancelled) return;
        if (!r.ok) {
          Alert.alert('Could not link Apple Music', r.error ?? 'Try again.');
          return;
        }
        setAppleOn(true);
        trackProduct('music_connected', { method: 'apple_music' });
        try {
          await syncTopArtists();
          trackProduct('music_taste_synced', { method: 'apple_music' });
        } catch {
          // connect still succeeded
        }
        Alert.alert(
          'Apple Music linked',
          'We can use artists you listen to a lot for shared taste with friends.'
        );
      })
      .catch(() => Alert.alert('Could not link Apple Music', 'Try again in a moment.'))
      .finally(() => setAppleBusy(false));
  };
  /** blocking is reversible, and undoing it lives here */
  const [blockedOpen, setBlockedOpen] = useState(false);

  // Surfaces that aren't built yet say so instead of silently doing nothing.
  const notYet = (what: string) => () =>
    Alert.alert(what, 'This screen is coming soon.');

  // Co-op members enter the customize flow. Free accounts get a clear join choice.
  const openCustomize = async () => {
    try {
      const member = storage.plan === 'coop' || (await getMembership()).member;
      if (member) {
        router.push('/profile/customize');
        return;
      }
      Alert.alert('Co-op membership', 'Join the co-op to customize your profile.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'See membership', onPress: () => router.push('/coop') }
      ]);
    } catch {
      Alert.alert('Could not check membership', 'Please try again in a moment.');
    }
  };

  return (
    <View className="gap-2.5">
      <ListRow
        label="Appearance"
        sublabel={`${scheme === 'dark' ? 'Dark' : 'Light'} · follows your device`}
        onPress={notYet('Appearance')}
        trailing="chevron"
        analyticsId={PROFILE.settings.appearance}
      />
      <ListRow
        label="Spotify"
        sublabel={
          spotifyBusy
            ? 'Working…'
            : spotifyOn
              ? 'Connected · tap to disconnect'
              : 'Connect to pick songs and find shared artists'
        }
        onPress={onSpotifyRow}
        trailing="chevron"
        analyticsId={
          spotifyOn ? PROFILE.settings.disconnect_spotify : PROFILE.settings.connect_spotify
        }
      />
      <ListRow
        label="Apple Music"
        sublabel={
          appleBusy
            ? 'Working…'
            : appleOn
              ? 'Connected · tap to disconnect'
              : 'Connect to find shared artists from your listening'
        }
        onPress={onAppleRow}
        trailing="chevron"
        analyticsId={
          appleOn
            ? PROFILE.settings.disconnect_apple_music
            : PROFILE.settings.connect_apple_music
        }
      />
      <ListRow
        label="Listening track"
        sublabel="Song of the moment (search Spotify catalog)"
        onPress={() => router.push('/music/listening')}
        trailing="chevron"
        analyticsId={PROFILE.music.pick_save}
      />
      <ListRow
        label="Who sees what"
        sublabel="Close · Friends · Everyone"
        trailing="chevron"
        onPress={notYet('Who sees what')}
        analyticsId={PROFILE.settings.who_sees_what}
      />
      {/* STORAGE METER STUB: used vs included; overage price shown, no charge. */}
      <ListRow
        label="Storage & plan"
        sublabel={
          storage.plan === 'coop'
            ? storage.label || `Co-op · ${storage.usedPct}% used`
            : `Free month · ${storage.usedPct}% used`
        }
        trailing="chevron"
        onPress={() => {
          if (storage.plan === 'coop') {
            Alert.alert(
              'Storage & plan',
              [
                storage.label,
                storage.overageBytes > 0
                  ? 'You are over the included allotment.'
                  : 'You are within your included allotment.',
                storage.overagePriceLabel ??
                  'Overage is opt-in. Price shown before any charge (stub: not charged yet).'
              ].join('\n\n'),
              [{ text: 'OK' }]
            );
            return;
          }
          Alert.alert(
            'Storage & plan',
            storage.label ||
              'Free accounts keep about a month of story media. Join the co-op for an included allotment.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'See membership', onPress: () => router.push('/coop') }
            ]
          );
        }}
        analyticsId={PROFILE.settings.storage_plan}
      />
      <ListRow
        label="Discover"
        sublabel="Discoverable · match sources"
        trailing="chevron"
        onPress={() => router.push('/discover')}
        analyticsId={PROFILE.settings.discover_toggle}
      />
      <ListRow
        label="Customize your page"
        sublabel="Members only · make it yours"
        trailing="chevron"
        onPress={() => void openCustomize()}
        analyticsId={PROFILE.settings.customize_profile}
      />
      <ListRow
        label="Always show plain pages"
        sublabel="Skip other people's customization when you visit"
        action={
          <Toggle
            checked={preferOriginal}
            onChange={(v) => {
              setPreferOriginal(v);
              void setAlwaysViewOriginal(v);
            }}
            label="Always show plain pages"
            analyticsId={PROFILE.settings.always_original}
          />
        }
      />
      <ListRow
        label="Co-op"
        sublabel="Membership · what you get"
        trailing="chevron"
        onPress={() => router.push('/coop')}
        analyticsId={PROFILE.settings.coop}
      />
      <ListRow
        label="Notifications"
        sublabel="Choose what we nudge you about"
        trailing="chevron"
        onPress={() => router.push('/settings/notifications')}
        analyticsId={PROFILE.settings.notifications}
      />
      {assistantVisible ? (
        <>
          <ListRow
            label="Billy"
            sublabel="Help manage friendships from what you've saved. Off by default."
            action={
              <Toggle
                checked={assistantOn}
                onChange={(v) => {
                  assistantTouched.current = true;
                  setAssistantOn(v);
                  void setAssistantEnabled(v)
                    .then(() => {
                      if (v) {
                        return fetchBillyStatus().then(setBillyStatus);
                      }
                      setBillyStatus(null);
                      return undefined;
                    })
                    .catch(() => {
                      setAssistantOn(!v);
                      Alert.alert(
                        'Could not update Billy',
                        'Please try again in a moment.'
                      );
                    });
                }}
                label="Billy"
                analyticsId={PROFILE.settings.assistant_toggle}
              />
            }
          />
          {assistantOn ? (
            <>
              <ListRow
                label="Open Billy"
                sublabel="Ask about notes, dates, and reconnects"
                trailing="chevron"
                onPress={() =>
                  router.push({
                    pathname: '/assistant',
                    params: { entry: 'settings' }
                  })
                }
                analyticsId={PROFILE.settings.assistant_open}
              />
              {/* THIS SECTION DOES: show Billy time left and Billy+ controls. */}
              <AnalyticsRegion
                analyticsId={PROFILE.settings.billy_status}
                interactive={false}
              >
                <View className="mx-1 mb-2 rounded-card border border-ink-line bg-canvas-raised px-3 py-3">
                  <Text className="font-pixel text-[12px] text-ink">
                    {billyStatus?.plan === 'plus' ? 'Billy+' : 'Trying Billy'}
                  </Text>
                  <Text className="mt-1 text-[13px] font-semibold text-ink-soft">
                    About $
                    {(billyStatus?.balanceUsd ?? 0).toFixed(2)} of Billy time
                    left this period
                  </Text>
                  {billyStatus?.periodEnd ? (
                    <Text className="mt-1 text-[12px] font-semibold text-ink-mute">
                      Refreshes{' '}
                      {new Date(billyStatus.periodEnd).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              </AnalyticsRegion>
              {billyStatus?.plan !== 'plus' ? (
                <ListRow
                  label={`Get Billy+ · $${(billyStatus?.plusPriceUsd ?? 5).toFixed(0)}/mo`}
                  sublabel="More Billy time each month (soft stub in dev)"
                  trailing="chevron"
                  onPress={() => {
                    void startBillyPlusStub()
                      .then((s) => {
                        if (s) setBillyStatus(s);
                        else {
                          Alert.alert(
                            'Billy+',
                            'Checkout is not available yet. Ask an admin to grant Billy+.'
                          );
                        }
                      })
                      .catch(() =>
                        Alert.alert(
                          'Billy+',
                          'Could not start Billy+ right now.'
                        )
                      );
                  }}
                  analyticsId={PROFILE.settings.billy_plus_cta}
                />
              ) : (
                <ListRow
                  label="Cancel Billy+"
                  sublabel="Keeps working until this period ends"
                  trailing="chevron"
                  onPress={() => {
                    void cancelBillyPlus().then((s) => {
                      if (s) setBillyStatus(s);
                      Alert.alert(
                        'Billy+',
                        'Canceled at period end. You can keep using remaining time until then.'
                      );
                    });
                  }}
                  analyticsId={PROFILE.settings.billy_plus_cancel}
                />
              )}
            </>
          ) : null}
        </>
      ) : null}
      <ListRow
        label="Blocked people"
        sublabel={
          blocked.length > 0 ? `${blocked.length} blocked · nobody is ever told` : 'Nobody blocked'
        }
        trailing="chevron"
        onPress={() => setBlockedOpen(true)}
        analyticsId={PROFILE.settings.blocked_people}
      />

      {/* Surprises stay in code; emoji-bomb is parked so these rows stay hidden. */}
      {EMOJI_BOMB_LIVE ? (
        <>
          <AnalyticsRegion
            analyticsId={PROFILE.settings.surprises_header}
            interactive={false}
          >
            <Text className="mt-2 px-1 font-pixel text-[12px] text-ink">
              Surprises
            </Text>
          </AnalyticsRegion>
          <ListRow
            label="Preview emoji rain"
            sublabel="Reusable delighter effect (safe to tap)"
            trailing="chevron"
            onPress={() => setRainPreview(true)}
            analyticsId={PROFILE.settings.preview_emoji_rain}
          />
          {isDemoMode() ? (
            <ListRow
              label="Play emoji bomb"
              sublabel="Queues a gift for you on next Home paint"
              trailing="chevron"
              onPress={() => {
                void resolveEmojiBombId().then((id) => {
                  __demoQueueTrigger({
                    id: `dt-demo-${Date.now()}`,
                    delightId: id ?? 'delight-emoji-bomb',
                    delightSlug: 'emoji-bomb',
                    fromUserId: 'demo-friend',
                    toUserId: 'me',
                    played: false,
                    fromName: 'Priya'
                  });
                  Alert.alert(
                    'Queued',
                    'The emoji bomb should play over the app in a moment.'
                  );
                });
              }}
              analyticsId={PROFILE.settings.play_emoji_bomb}
            />
          ) : null}
        </>
      ) : null}
      {isDemoMode() ? (
        <ListRow
          label="Leave demo"
          sublabel="Exit fake data and return to Sign in"
          trailing="chevron"
          onPress={() => {
            Alert.alert(
              'Leave demo?',
              'You will go back to Sign in. Fake friends and posts stay on this device until you clear app data.',
              [
                { text: 'Stay', style: 'cancel' },
                {
                  text: 'Leave demo',
                  style: 'destructive',
                  onPress: () => {
                    void (async () => {
                      await disableDemoMode();
                      trackProduct('demo_mode_left', { method: 'settings' });
                      router.replace('/(auth)/sign-in');
                    })();
                  }
                }
              ]
            );
          }}
          analyticsId={PROFILE.settings.leave_demo}
        />
      ) : null}

      {/* Account leads to in-app account deletion when it ships — an app-store requirement */}
      <ListRow
        label="Account"
        trailing="chevron"
        onPress={notYet('Account')}
        analyticsId={PROFILE.settings.account}
      />

      <Card>
        <ButtonSecondary
          full
          tone="ghost"
          onPress={onSignOut}
          analyticsId={PROFILE.settings.log_out}
        >
          Log out
        </ButtonSecondary>
      </Card>

      <Text className="px-1 font-sans-md text-[11px] text-ink-mute">
        Anything you delete is removed from Bridger for good.
      </Text>

      <BlockedPeopleSheet
        open={blockedOpen}
        people={blocked}
        onClose={() => setBlockedOpen(false)}
        onUnblock={onUnblock}
      />

      {rainPreview ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50
          }}
        >
          <DelightErrorBoundary onSkip={() => setRainPreview(false)}>
            <EmojiRain active onDone={() => setRainPreview(false)} />
          </DelightErrorBoundary>
        </View>
      ) : null}
    </View>
  );
}
