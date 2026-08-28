// ============================================
// WHAT THIS FILE DOES (plain English):
// The onboarding "room" — one container that walks a new person through the new
// flow in order, holding all their answers in one place. The root gate sends
// new accounts here and won't let them into the app until "welcome-in" marks
// onboarding done.
//
// Order: confirm profile → birthday → [feed stat] → contacts → [isolation stat]
// → friends of friends → [retention stat] → notifications → taste intro → right
// now → obsession → social battery → color → places → recap → privacy & control
// → [screentime stat] → co-op → welcome in. Each screen saves its own slice;
// the last screen flips the "complete" flag and drops you on Home.
// ============================================
import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { openSurface, trackFlowStarted } from '@bridger/shared';
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
import { RecapStep } from '../../components/onboarding/RecapStep';
import { PrivacyControlStep } from '../../components/onboarding/PrivacyControlStep';
import { CoopStep } from '../../components/onboarding/CoopStep';
import { WelcomeInStep } from '../../components/onboarding/WelcomeInStep';
import { StepTransition } from '../../components/onboarding/StepTransition';
import { joinCoop, type PhotoSource } from '../../data/onboarding';
import { redeemPromoCode } from '../../data/coop';
import { connectAppleMusicAccount } from '../../lib/apple-music-connect';
import { connectSpotifyAccount } from '../../lib/spotify-connect';
import { shareInviteForAccess } from '../../lib/invite-from-contacts';
import { pickProfilePhoto } from '../../lib/pick-image';
import { requestNotificationPermission } from '../../lib/notifications';

// Where the legal links point until an in-app legal screen ships.
const TERMS_URL = 'https://d2bvufsvqvy4vz.cloudfront.net/terms.html';
const PRIVACY_URL = 'https://d2bvufsvqvy4vz.cloudfront.net/privacy.html';

export default function OnboardingScreen() {
  const router = useRouter();
  const flow = useOnboarding(() => router.replace('/home'));
  const { setGridColorHex } = useGridColor();

  // Open the surface + start the flow once, when the room first appears.
  useEffect(() => {
    openSurface('onboarding');
    trackFlowStarted('onboarding');
  }, []);

  const { step, index, draft, patch, goNext, goSkip, goBack, formStep, formTotal, dir } = flow;
  // The very first screen has nothing to go back to.
  const back = index > 0 ? goBack : undefined;

  // THIS SECTION DOES: save the color step, then tint the live app grid right away.
  const onColorNext = () => {
    if (draft.color) setGridColorHex(draft.color);
    void goNext();
  };

  // THIS SECTION DOES: flip one item in a multi-select list (on/off).
  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  const toggleNotif = (id: string) => patch({ notifPrefs: toggleIn(draft.notifPrefs, id) });
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
            onChangeSong={(v) => patch({ song: v })}
          onConnectSpotify={() => {
            void connectSpotifyAccount().then((r) => {
              if (r.ok) patch({ spotifyConnected: true });
            });
          }}
          onConnectApple={() => {
            void connectAppleMusicAccount().then((r) => {
              if (r.ok) patch({ appleConnected: true });
            });
          }}
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
            favoritePlace={draft.favoritePlace}
            onChangeHometown={(v) => patch({ hometown: v })}
            onChangeCurrent={(v) => patch({ currentTown: v })}
            onChangeFavorite={(v) => patch({ favoritePlace: v })}
            onNext={goNext}
            onSkip={goSkip}
            onBack={back ?? (() => {})}
          />
        );

      case 'recap':
        return (
          <RecapStep
            step={formStep}
            total={formTotal}
            initialUri={draft.recapUri}
            onRecorded={(uri) =>
              patch({
                recapRecorded: Boolean(uri),
                recapUri: uri,
                recapMode: 'voice'
              })
            }
            onNext={goNext}
            onSkip={goSkip}
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
            onNext={goNext}
            onBack={back ?? (() => {})}
            onOpenTerms={() => void Linking.openURL(TERMS_URL)}
            onOpenPrivacy={() => void Linking.openURL(PRIVACY_URL)}
          />
        );

      case 'stat-screentime':
        return <StatScreen variant="screentime" onBridge={goNext} onBack={back} />;

      case 'coop':
        return (
          <CoopStep
            step={formStep}
            total={formTotal}
            invitesSent={draft.inviteSlots.filter((s) => s.sent).length}
            onInviteFree={async () => {
              // Fill the next empty slot when the OS share actually completes.
              const nextIndex = draft.inviteSlots.findIndex((s) => !s.sent);
              const result = await shareInviteForAccess('onboarding', {
                slot: nextIndex >= 0 ? nextIndex + 1 : undefined
              });
              if (!result.ok) return;
              if (nextIndex >= 0) {
                const next = draft.inviteSlots.map((s, i) =>
                  i === nextIndex ? ({ sent: true, label: 'Shared link' } satisfies InviteSlot) : s
                );
                patch({
                  inviteSlots: next,
                  invited: true
                });
              } else {
                patch({ invited: true });
              }
            }}
            onJoin={(method) => {
              // coop_joined is tracked inside the data layer when the join lands.
              void joinCoop(true, method);
              goNext();
            }}
            onInvitesComplete={() => {
              // Free access only after invite 3 friends (no separate free-tier skip).
              void joinCoop(false);
              goNext();
            }}
            onRedeem={async (redeemCode) => {
              // Throws on a bad code so CoopStep can show the error. On success we
              // move on. redeemPromoCode records who used it.
              await redeemPromoCode(redeemCode);
              goNext();
            }}
            onBack={back ?? (() => {})}
          />
        );

      case 'welcome-in':
        return <WelcomeInStep onDone={flow.complete} />;

      default:
        return null;
    }
  };

  // THIS SECTION DOES: wrap the step in a slide so forward/back feels animated.
  return (
    <StepTransition stepKey={step} direction={dir}>
      {renderStep()}
    </StepTransition>
  );
}
