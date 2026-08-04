// ============================================
// WHAT THIS FILE DOES (plain English):
// The onboarding "room" — one container that walks a new person through the
// screens in order, holding all their answers in one place. It's the front
// door: the root gate sends new accounts here and won't let them into the app
// until "welcome-in" marks onboarding done.
//
// Order: privacy promise → name (first ask) → photo → notifications → explain
// the friend circles + invite a friend → meet people (city) → birthday →
// who-sees-what → join the co-op → you're in. Each screen saves its own slice;
// the last screen flips the "complete" flag and drops you on Home.
// ============================================
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { openSurface, trackFlowStarted } from '@bridger/shared';
import { useOnboarding } from '../../hooks/useOnboarding';
import { PrivacyStep } from '../../components/onboarding/PrivacyStep';
import { NameStep } from '../../components/onboarding/NameStep';
import { PhotoStep } from '../../components/onboarding/PhotoStep';
import { NotificationsStep } from '../../components/onboarding/NotificationsStep';
import { GroupsStep } from '../../components/onboarding/GroupsStep';
import { MeetStep } from '../../components/onboarding/MeetStep';
import { BirthdayStep } from '../../components/onboarding/BirthdayStep';
import { ReviewStep } from '../../components/onboarding/ReviewStep';
import { CoopStep } from '../../components/onboarding/CoopStep';
import { WelcomeInStep } from '../../components/onboarding/WelcomeInStep';
import { joinCoop, sendInvite, type PhotoSource } from '../../data/onboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const flow = useOnboarding(() => router.replace('/home'));
  const [invited, setInvited] = React.useState(false);

  // Open the surface + start the flow once, when the room first appears.
  useEffect(() => {
    openSurface('onboarding');
    trackFlowStarted('onboarding');
  }, []);

  const { step, index, total, draft, patch, goNext, goSkip, goBack } = flow;
  // The very first screen has nothing to go back to.
  const back = index > 0 ? goBack : undefined;
  const stepNo = index + 1;

  const toggleNotif = (id: string) =>
    patch({
      notifPrefs: draft.notifPrefs.includes(id)
        ? draft.notifPrefs.filter((x) => x !== id)
        : [...draft.notifPrefs, id]
    });

  switch (step) {
    case 'privacy':
      return <PrivacyStep step={stepNo} total={total} onNext={goNext} />;

    case 'name':
      return (
        <NameStep
          step={stepNo}
          total={total}
          first={draft.firstName}
          last={draft.lastName}
          onChangeFirst={(v) => patch({ firstName: v })}
          onChangeLast={(v) => patch({ lastName: v })}
          onNext={goNext}
          onBack={back ?? (() => {})}
        />
      );

    case 'photo':
      return (
        <PhotoStep
          step={stepNo}
          total={total}
          source={draft.photoSource}
          onPick={(s: PhotoSource) => patch({ photoSource: s })}
          onNext={goNext}
          onSkip={goSkip}
          onBack={back ?? (() => {})}
        />
      );

    case 'notifications':
      return (
        <NotificationsStep
          step={stepNo}
          total={total}
          picked={draft.notifPrefs}
          onToggle={toggleNotif}
          onNext={goNext}
          onSkip={goSkip}
          onBack={back ?? (() => {})}
        />
      );

    case 'groups':
      return (
        <GroupsStep
          step={stepNo}
          total={total}
          invited={invited}
          onInvite={() => {
            setInvited(true);
            void sendInvite();
          }}
          onNext={goNext}
          onBack={back ?? (() => {})}
        />
      );

    case 'meet':
      return (
        <MeetStep
          step={stepNo}
          total={total}
          scope={draft.meetScope}
          city={draft.meetCity}
          onScope={(s) => patch({ meetScope: s })}
          onCity={(v) => patch({ meetCity: v })}
          onNext={goNext}
          onSkip={goSkip}
          onBack={back ?? (() => {})}
        />
      );

    case 'birthday':
      return (
        <BirthdayStep
          step={stepNo}
          total={total}
          value={draft.birthday}
          onChange={(v) => patch({ birthday: v })}
          onNext={goNext}
          onSkip={goSkip}
          onBack={back ?? (() => {})}
        />
      );

    case 'visibility':
      return (
        <ReviewStep
          step={stepNo}
          total={total}
          rows={draft.visibility}
          birthday={draft.birthday}
          city={draft.meetCity}
          onInit={(rows) => patch({ visibility: rows })}
          onSetTier={flow.setVisibilityTier}
          onSetAll={flow.setAllVisibility}
          onNext={goNext}
          onBack={back ?? (() => {})}
        />
      );

    case 'coop':
      return (
        <CoopStep
          step={stepNo}
          total={total}
          onJoin={() => {
            patch({ coopJoined: true });
            void joinCoop(true);
            goNext();
          }}
          onUseFree={() => {
            patch({ coopJoined: false });
            void joinCoop(false);
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
}
