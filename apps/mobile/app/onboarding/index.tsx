// ============================================
// WHAT THIS FILE DOES (plain English):
// The onboarding "room" — one container that walks a new person through the new
// flow in order, holding all their answers in one place. The root gate sends
// new accounts here and won't let them into the app until Co-op (the last step)
// marks onboarding done.
//
// Order: confirm profile → birthday → [feed stat] → contacts → [isolation stat]
// → friends of friends → [retention stat] → notifications → taste intro → right
// now → obsession → social battery → color → places → privacy circles →
// privacy & control → [screentime stat] → co-op. Each screen saves its own
// slice; finishing Co-op flips the "complete" flag, flags the welcome party, and
// drops you on Home where the fireworks play (the old "You're in" screen was
// removed 2026-08-28).
// (Recap voice step archived; Friend Pod still records weekly recaps.)
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { openSurface, trackFlowStarted, trackProduct } from '@bridger/shared';
import { useGridColor } from '@bridger/ui';
import { useOnboarding } from '../../hooks/useOnboarding';
import { ConfirmProfileStep } from '../../components/onboarding/ConfirmProfileStep';
import { BirthdayStep } from '../../components/onboarding/BirthdayStep';
import { StatScreen } from '../../components/onboarding/StatScreen';
import { ContactsStep, type InviteSlot } from '../../components/onboarding/ContactsStep';
import { FriendsOfFriendsStep } from '../../components/onboarding/FriendsOfFriendsStep';
import { NotificationsStep } from '../../components/onboarding/NotificationsStep';
import { TasteIntroStep } from '../../components/onboarding/TasteIntroStep';
import { RightNowStep } from '../../components/onboarding/RightNowStep';
import { ObsessionStep } from '../../components/onboarding/ObsessionStep';
import { SocialBatteryStep } from '../../components/onboarding/SocialBatteryStep';
import { ColorStep } from '../../components/onboarding/ColorStep';
import { PlacesStep } from '../../components/onboarding/PlacesStep';
import { PrivacyCirclesStep } from '../../components/onboarding/PrivacyCirclesStep';
import { PrivacyControlStep } from '../../components/onboarding/PrivacyControlStep';
import { CoopIntroStep } from '../../components/onboarding/CoopIntroStep';
import { CoopStep } from '../../components/onboarding/CoopStep';
import { StepTransition } from '../../components/onboarding/StepTransition';
import { joinCoop, type PhotoSource } from '../../data/onboarding';
import { redeemPromoCode } from '../../data/coop';
import { fetchMusicStatus, syncTopArtists } from '../../data/music';
import { connectAppleMusicAccount } from '../../lib/apple-music-connect';
import { connectSpotifyAccount } from '../../lib/spotify-connect';
import { pickProfilePhoto } from '../../lib/pick-image';
import { requestNotificationPermission } from '../../lib/notifications';
import { markWelcomeCelebration } from '../../lib/welcome-celebration';
import { loadPeople } from '../../lib/people-cache';

// Where the legal links point until an in-app legal screen ships.
const TERMS_URL = 'https://d2bvufsvqvy4vz.cloudfront.net/terms.html';
const PRIVACY_URL = 'https://d2bvufsvqvy4vz.cloudfront.net/privacy.html';

export default function OnboardingScreen() {
  const router = useRouter();
  // When onboarding finishes: flag the one-time welcome party, kick off a
  // people-cache refresh (so the header gets your real photo), then land on
  // Home. The header re-renders when loadPeople finishes.
  const flow = useOnboarding(() => {
    markWelcomeCelebration();
    void loadPeople();
    router.replace('/home');
  });
  const { setGridColorHex } = useGridColor();
  // Which music connect browser sheet is open (null = idle).
  const [musicBusy, setMusicBusy] = useState<'spotify' | 'apple' | null>(null);
  // Song search sheet after Spotify / Apple Agree (or when they reopen search).
  const [songSheetOpen, setSongSheetOpen] = useState(false);

  // Open the surface + start the flow once, when the room first appears.
  useEffect(() => {
    openSurface('onboarding');
    trackFlowStarted('onboarding');
  }, []);

  const { step, index, draft, hydrated, patch, goNext, goSkip, goBack, formStep, formTotal, dir } = flow;
  // The very first screen has nothing to go back to.
  const back = index > 0 ? goBack : undefined;

  // THIS SECTION DOES: when you land on the song step, ask Nest which music
  // accounts are already linked so the buttons match the real server state.
  useEffect(() => {
    if (step !== 'obsession') return;
    let cancelled = false;
    void fetchMusicStatus()
      .then((s) => {
        if (cancelled) return;
        patch({
          spotifyConnected: s.spotify,
          appleConnected: s.appleMusic
        });
      })
      .catch(() => {
        // Stay on the draft flags if status cannot load (offline / unsigned).
      });
    return () => {
      cancelled = true;
    };
  }, [step, patch]);

  // THIS SECTION DOES: open Spotify's allow screen, then mark connected + sync
  // taste, then pop the song search sheet so they can pick the track on repeat.
  const onConnectSpotify = () => {
    if (musicBusy || draft.spotifyConnected) return;
    setMusicBusy('spotify');
    void connectSpotifyAccount()
      .then(async (r) => {
        if (r.cancelled) return;
        if (!r.ok) {
          Alert.alert(
            'Could not link Spotify',
            r.error ? `Something went wrong (${r.error}). Try again.` : 'Try again in a moment.'
          );
          return;
        }
        patch({ spotifyConnected: true });
        trackProduct('music_connected', { method: 'spotify' });
        try {
          await syncTopArtists();
          trackProduct('music_taste_synced', { method: 'spotify' });
        } catch {
          // Link still succeeded; taste sync can retry later from Settings.
        }
        setSongSheetOpen(true);
      })
      .catch(() => {
        Alert.alert('Could not link Spotify', 'Try again in a moment.');
      })
      .finally(() => setMusicBusy(null));
  };

  // THIS SECTION DOES: open Apple Music's allow screen, then mark connected +
  // sync taste, then pop the same song search sheet.
  const onConnectApple = () => {
    if (musicBusy || draft.appleConnected) return;
    setMusicBusy('apple');
    void connectAppleMusicAccount()
      .then(async (r) => {
        if (r.cancelled) return;
        if (!r.ok) {
          Alert.alert(
            'Could not link Apple Music',
            r.error
              ? `Something went wrong (${r.error}). Try again.`
              : 'Try again in a moment.'
          );
          return;
        }
        patch({ appleConnected: true });
        trackProduct('music_connected', { method: 'apple_music' });
        try {
          await syncTopArtists();
          trackProduct('music_taste_synced', { method: 'apple_music' });
        } catch {
          // Link still succeeded; taste sync can retry later from Settings.
        }
        setSongSheetOpen(true);
      })
      .catch(() => {
        Alert.alert('Could not link Apple Music', 'Try again in a moment.');
      })
      .finally(() => setMusicBusy(null));
  };

  // THIS SECTION DOES: save the color step, then tint the live app grid right away.
  const onColorNext = () => {
    if (draft.color) setGridColorHex(draft.color);
    void goNext();
  };

  // THIS SECTION DOES: flip one item in a multi-select list (on/off).
  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  const toggleNotif = (id: string) => patch({ notifPrefs: toggleIn(draft.notifPrefs, id) });
  // "All of the above" on notifications replaces the whole list in one write.
  const setNotifs = (ids: string[]) => patch({ notifPrefs: ids });
  const toggleStyle = (id: string) => patch({ connectStyles: toggleIn(draft.connectStyles, id) });
  // "All of the above" replaces the whole list in one write.
  const setStyles = (ids: string[]) => patch({ connectStyles: ids });

  // THIS SECTION DOES: open the camera or library, then remember the real file
  // path so it previews now and uploads when the step is saved.
  const onPickPhoto = (source: PhotoSource) => {
    void (async () => {
      const picked = await pickProfilePhoto(source);
      // Cancelled or permission denied: leave the current choice untouched.
      if (!picked) return;
      patch({ photoSource: source, photoUri: picked.uri });
    })();
  };

  // THIS SECTION DOES: save the notification choices, then show the OS
  // permission dialog once (only if they asked for at least one nudge), and move
  // on either way so a "no" never dead-ends the run.
  const onNotificationsNext = () => {
    void (async () => {
      await requestNotificationPermission(draft.notifPrefs.length > 0);
      await goNext();
    })();
  };

  // THIS SECTION DOES: pick which step component to show for the current key.
  const renderStep = () => {
    switch (step) {
      case 'confirm-profile':
        return (
          <ConfirmProfileStep
            step={formStep}
            total={formTotal}
            first={draft.firstName}
            last={draft.lastName}
            photoSource={draft.photoSource}
            photoUri={draft.photoUri}
            photoEmoji={draft.photoEmoji}
            photoFilter={draft.photoFilter}
            onChangePhotoFilter={(f) => patch({ photoFilter: f })}
            onFilteredMediaIdChange={(id) => patch({ filteredMediaId: id })}
            onChangeFirst={(v) => patch({ firstName: v })}
            onChangeLast={(v) => patch({ lastName: v })}
            onPickPhoto={onPickPhoto}
            onNext={goNext}
            onBack={back ?? (() => {})}
          />
        );

      case 'birthday':
        return (
          <BirthdayStep
            step={formStep}
            total={formTotal}
            value={draft.birthday}
            onChange={(v) => patch({ birthday: v })}
            onNext={goNext}
            onBack={back ?? (() => {})}
          />
        );

      case 'stat-feed':
        return <StatScreen variant="feed" onBridge={goNext} onBack={back} />;

      case 'contacts':
        return (
          <ContactsStep
            step={formStep}
            total={formTotal}
            synced={draft.contactsSynced}
            slots={draft.inviteSlots}
            onSynced={() => patch({ contactsSynced: true })}
            onFillSlot={(index, slot) => {
              const next = draft.inviteSlots.map((s, i) => (i === index ? slot : s));
              const sentCount = next.filter((s) => s.sent).length;
              patch({
                inviteSlots: next,
                invited: sentCount > 0
              });
            }}
            onNext={goNext}
            onSkip={goSkip}
            onBack={back ?? (() => {})}
          />
        );

      case 'stat-isolation':
        return <StatScreen variant="isolation" onBridge={goNext} onBack={back} />;

      case 'friends-of-friends':
        return (
          <FriendsOfFriendsStep
            step={formStep}
            total={formTotal}
            picked={draft.connectStyles}
            onToggle={toggleStyle}
            onSetAll={setStyles}
            onNext={goNext}
            onSkip={goSkip}
            onBack={back ?? (() => {})}
          />
        );

      case 'stat-retention':
        return <StatScreen variant="retention" onBridge={goNext} onBack={back} />;

      case 'notifications':
        return (
          <NotificationsStep
            step={formStep}
            total={formTotal}
            picked={draft.notifPrefs}
            onToggle={toggleNotif}
            onSetAll={setNotifs}
            onNext={onNotificationsNext}
            onSkip={goSkip}
            onBack={back ?? (() => {})}
          />
        );

      case 'taste-intro':
        return (
          <TasteIntroStep
            step={formStep}
            total={formTotal}
            onNext={goNext}
            onBack={back ?? (() => {})}
          />
        );

      case 'right-now':
        return (
          <RightNowStep
            step={formStep}
            total={formTotal}
            currentJob={draft.currentJob}
            dreamJob={draft.dreamJob}
            onChangeCurrent={(v) => patch({ currentJob: v })}
            onChangeDream={(v) => patch({ dreamJob: v })}
            onNext={goNext}
            onSkip={goSkip}
            onBack={back ?? (() => {})}
          />
        );

      case 'obsession':
        return (
          <ObsessionStep
            step={formStep}
            total={formTotal}
            song={draft.song}
            spotifyConnected={draft.spotifyConnected}
            appleConnected={draft.appleConnected}
            connectBusy={musicBusy}
            songSheetOpen={songSheetOpen}
            onChangeSong={(v) => patch({ song: v })}
            onConnectSpotify={onConnectSpotify}
            onConnectApple={onConnectApple}
            onCloseSongSheet={() => setSongSheetOpen(false)}
            onPickSong={(label) => patch({ song: label })}
            onOpenSongSheet={() => setSongSheetOpen(true)}
            onNext={goNext}
            onSkip={goSkip}
            onBack={back ?? (() => {})}
          />
        );

      case 'social-battery':
        return (
          <SocialBatteryStep
            step={formStep}
            total={formTotal}
            nights={draft.nights}
            onPick={(n) => patch({ nights: n })}
            onNext={goNext}
            onSkip={goSkip}
            onBack={back ?? (() => {})}
          />
        );

      case 'color':
        return (
          <ColorStep
            step={formStep}
            total={formTotal}
            color={draft.color}
            onPick={(hex) => patch({ color: hex })}
            onNext={onColorNext}
            onSkip={goSkip}
            onBack={back ?? (() => {})}
          />
        );

      case 'places':
        return (
          <PlacesStep
            step={formStep}
            total={formTotal}
            hometown={draft.hometown}
            currentTown={draft.currentTown}
            favoritePlaceHit={draft.favoritePlaceHit}
            onChangeHometown={(v) => patch({ hometown: v })}
            onChangeCurrent={(v) => patch({ currentTown: v })}
            onChangeFavoriteHit={(hit) =>
              patch({
                favoritePlaceHit: hit,
                favoritePlace: hit?.label ?? ''
              })
            }
            onNext={goNext}
            onBack={back ?? (() => {})}
          />
        );

      case 'privacy-circles':
        return (
          <PrivacyCirclesStep
            step={formStep}
            total={formTotal}
            onNext={goNext}
            onBack={back ?? (() => {})}
          />
        );

      case 'privacy-control':
        return (
          <PrivacyControlStep
            step={formStep}
            total={formTotal}
            rows={draft.visibility}
            onInit={flow.initVisibility}
            onSetTier={flow.setVisibilityTier}
            onSetAll={flow.setAllVisibility}
            onEditValue={flow.updateVisibilityValue}
            onNext={goNext}
            onBack={back ?? (() => {})}
            onOpenTerms={() => void Linking.openURL(TERMS_URL)}
            onOpenPrivacy={() => void Linking.openURL(PRIVACY_URL)}
          />
        );

      case 'stat-screentime':
        return <StatScreen variant="screentime" onBridge={goNext} onBack={back} />;

      case 'coop-intro':
        // Blue splash that explains what a co-op is, right before the join page.
        return <CoopIntroStep onNext={goNext} onBack={back ?? (() => {})} />;

      case 'coop':
        return (
          <CoopStep
            step={formStep}
            total={formTotal}
            invitesSent={draft.inviteSlots.filter((s) => s.sent).length}
            onInviteRecorded={(label) => {
              // CoopStep already opened share / SMS; mark the next empty slot filled.
              const nextIndex = draft.inviteSlots.findIndex((s) => !s.sent);
              if (nextIndex < 0) {
                patch({ invited: true });
                return;
              }
              const next = draft.inviteSlots.map((s, i) =>
                i === nextIndex ? ({ sent: true, label } satisfies InviteSlot) : s
              );
              patch({
                inviteSlots: next,
                invited: true
              });
              // Third invite done: finish onboarding and go straight to Home.
              if (next.every((s) => s.sent)) {
                void joinCoop(false);
                void flow.complete();
              }
            }}
            onJoin={async (method, plan) => {
              // Buys the chosen plan via the store / card (or soft join in
              // demo). Only finish onboarding after a confirmed purchase.
              try {
                await joinCoop(true, method, plan);
                void flow.complete();
              } catch (err) {
                // User closed the sheet: stay on this step. Real errors show an alert.
                const { PurchaseCancelledError } = await import('../../data/coop');
                if (err instanceof PurchaseCancelledError) return;
                Alert.alert(
                  'Could not join',
                  err instanceof Error ? err.message : 'Try again in a moment.'
                );
              }
            }}
            onInvitesComplete={() => {
              // Already had 3 invites (e.g. from Contacts): Continue finishes.
              void joinCoop(false);
              void flow.complete();
            }}
            onRedeem={async (redeemCode) => {
              // Throws on a bad code so CoopStep can show the error. On success we
              // finish onboarding. redeemPromoCode records who used it.
              await redeemPromoCode(redeemCode);
              void flow.complete();
            }}
            onBack={back ?? (() => {})}
          />
        );

      default:
        return null;
    }
  };

  // THIS SECTION DOES: hold on a plain canvas for the split second it takes to
  // check for a saved resume point, so we never flash the first screen before
  // jumping to where the person actually left off.
  if (!hydrated) {
    return <View className="flex-1 bg-canvas" />;
  }

  // THIS SECTION DOES: wrap the step in a slide so forward/back feels animated.
  return (
    <StepTransition stepKey={step} direction={dir}>
      {renderStep()}
    </StepTransition>
  );
}
