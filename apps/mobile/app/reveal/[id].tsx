// ============================================
// WHAT THIS FILE DOES (plain English):
// The Connection Reveal — a full-screen dark story that plays right after you
// connect with someone. Screen 0 asks how you met (+ optional coarse place),
// then three story screens: strongest link (Venn), "you've also got", and
// "You two should click." Same content lives forever under their In common tab.
//
// Stays dark even when the app is in dark mode (theme tokens flip otherwise).
// Copy is exact from REVEAL.md. Analytics surface = reveal.
// PRIVACY: place is coarse only; analytics never gets place text or names.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { InfoIcon, XIcon } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  REVEAL,
  SECTION_INFO_TOOLTIP,
  openSurface,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  Avatar,
  ButtonPrimary,
  InfoPopover,
  NotFoundScreen,
  Screen,
  ScreenBody,
  withAnalyticsPress
} from '@bridger/ui';
import { CommonalityList } from '../../components/discover/CommonalityList';
import { HowYouMetStep } from '../../components/reveal/HowYouMetStep';
import { QuizMatchList } from '../../components/reveal/QuizMatchList';
import { RevealClose } from '../../components/reveal/RevealClose';
import { RevealOrbs } from '../../components/reveal/RevealOrbs';
import { RevealProgressBars } from '../../components/reveal/RevealProgressBars';
import { useReveal } from '../../hooks/useReveal';
import {
  connectFromReveal,
  setDiscoverable
} from '../../data/discover';
import { personExists } from '../../data/people';
import { avatarPhotoFor } from '../../lib/avatar-photo';
import { reportNotFoundHit } from '../../lib/route-trail';

type Frame = 'met' | 'strongest' | 'others' | 'close';
const STORY_FRAMES: Frame[] = ['strongest', 'others', 'close'];

/** Fixed cream-on-dark labels — REVEAL.md exception; theme tokens flip in dark mode. */
const REVEAL_FG = '#F5F0E6';
const REVEAL_MUTE = 'rgba(245, 240, 230, 0.55)';

export default function RevealRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowW } = useWindowDimensions();
  // Meet screen: a large real photo, sized to the window so it stays big on phone and web.
  const meetFace = Math.round(Math.min(200, Math.max(156, windowW * 0.46)));
  const params = useLocalSearchParams<{ id: string; via?: string }>();
  const personId = typeof params.id === 'string' ? params.id : 'nour';
  const viaId = typeof params.via === 'string' ? params.via : undefined;

  const {
    payload,
    loading,
    context,
    setContext,
    tier,
    setTier,
    recordPlace,
    setRecordPlace,
    meetNote,
    setMeetNote,
    commit,
    canContinue,
    reloadBridges
  } = useReveal(personId, viaId);

  const [frame, setFrame] = useState<Frame>('met');
  const [startedAt] = useState(() => Date.now());
  const reportedMissing = useRef(false);

  useEffect(() => {
    openSurface('reveal');
    trackFlowStarted('reveal');
  }, []);

  useEffect(() => {
    if (personExists(personId) || reportedMissing.current) return;
    reportedMissing.current = true;
    void reportNotFoundHit({
      missingPath: `/reveal/${personId}`,
      reason: 'connection_error'
    });
  }, [personId]);

  const first = payload?.person.name.split(' ')[0] ?? 'them';
  const viaName = payload?.via?.name.split(' ')[0];
  const storyIndex = STORY_FRAMES.indexOf(frame as (typeof STORY_FRAMES)[number]);

  const goSeeProfile = () => {
    trackFlowCompleted('reveal', Date.now() - startedAt);
    router.replace(`/person/${personId}`);
  };

  const advance = async () => {
    if (frame === 'met') {
      if (!canContinue) return;
      await commit();
      trackFlowStep('reveal', 'strongest');
      setFrame('strongest');
      return;
    }
    if (frame === 'strongest') {
      // Thin overlap: skip "others" when there is nothing else to show
      if ((payload?.others.length ?? 0) === 0) {
        trackFlowStep('reveal', 'close');
        setFrame('close');
        return;
      }
      trackFlowStep('reveal', 'others');
      setFrame('others');
      return;
    }
    if (frame === 'others') {
      trackFlowStep('reveal', 'close');
      setFrame('close');
    }
    // On 'close' a right-tap does nothing — it holds until "See profile".
  };

  // Tap the left half to step back through the story. You can never tap back
  // past the first story card (that would feel like closing) — use the X.
  const goBack = () => {
    if (frame === 'close') {
      if ((payload?.others.length ?? 0) === 0) {
        setFrame('strongest');
      } else {
        setFrame('others');
      }
      return;
    }
    if (frame === 'others') {
      setFrame('strongest');
    }
    // On 'strongest' a left-tap does nothing.
  };

  if (!personExists(personId)) {
    return (
      <NotFoundScreen
        onDismiss={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/discover');
        }}
      />
    );
  }

  if (loading || !payload) {
    return (
      <Screen tone="plain" className="bg-[#0E0E0E]">
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingTop: insets.top }}
        >
          <Text className="font-sans-sb text-[14px]" style={{ color: REVEAL_MUTE }}>
            Loading…
          </Text>
        </View>
      </Screen>
    );
  }

  const isStory = frame !== 'met';
  // Progress: full-and-held on the closing card, otherwise the current step.
  const progressActive = frame === 'close' ? 3 : storyIndex < 0 ? 0 : storyIndex;

  return (
    <Screen tone="plain" className="bg-[#0E0E0E]">
      <View className="flex-1" style={{ paddingTop: insets.top + 8 }}>
        {/* Screens 1–3 get the 3 segmented progress bars + an X to leave early */}
        {isStory ? (
          <View className="flex-row items-center gap-3 px-5">
            <View className="flex-1">
              <RevealProgressBars
                active={progressActive}
                onComplete={() => {
                  if (frame === 'close') return;
                  void advance();
                }}
              />
            </View>
            <Pressable
              onPress={withAnalyticsPress(REVEAL.flow.close, goSeeProfile)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Close and open ${first}'s profile`}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(245, 240, 230, 0.1)' }}
            >
              <XIcon size={18} color={REVEAL_FG} strokeWidth={2.4} />
            </Pressable>
          </View>
        ) : null}

        <ScreenBody className="pb-4 pt-6">
          {/* THIS SECTION DOES: How-you-met keeps via + a large real photo +
              their name. The Venn screen hides all of this so the circles lead. */}
          {frame !== 'strongest' && viaName ? (
            <Text
              className="mb-3 text-center font-sans-md text-[13px]"
              style={{ color: REVEAL_MUTE }}
            >
              via {viaName}
            </Text>
          ) : null}

          {frame === 'met' ? (
            <View className="items-center">
              <Avatar
                name={payload.person.name}
                emoji={payload.person.emoji}
                accent={payload.person.accent}
                personId={payload.person.id}
                photo={avatarPhotoFor(payload.person.id, payload.person.avatarUrl)}
                diameter={meetFace}
              />
              <Text
                className="mt-4 text-center font-pixel text-[21px] leading-[25px]"
                style={{ color: REVEAL_FG }}
              >
                {payload.person.name}
              </Text>
            </View>
          ) : frame !== 'strongest' ? (
            <View className="items-center">
              <Avatar
                name={payload.person.name}
                emoji={payload.person.emoji}
                accent={payload.person.accent}
                personId={payload.person.id}
                photo={avatarPhotoFor(payload.person.id, payload.person.avatarUrl)}
                size="xl"
              />
              <Text
                className="mt-4 text-center font-pixel text-[21px] leading-[25px]"
                style={{ color: REVEAL_FG }}
              >
                {payload.person.name}
              </Text>
            </View>
          ) : null}

          {frame === 'met' ? (
            <View className="mt-7">
              <Text
                className="mb-5 text-center font-pixel text-[32px] leading-[36px]"
                style={{ color: REVEAL_FG }}
              >
                How did you two meet?
              </Text>
              <HowYouMetStep
                context={context}
                onContext={setContext}
                tier={tier}
                onTier={setTier}
                recordPlace={recordPlace}
                onRecordPlace={setRecordPlace}
                meetNote={meetNote}
                onMeetNote={setMeetNote}
                viaDiscover={Boolean(payload.via)}
              />
            </View>
          ) : null}

          {frame === 'strongest' && payload.strongest ? (
            <View className="mt-8 items-center">
              <RevealOrbs
                me={payload.me}
                them={payload.person}
                label={payload.strongest.label}
              />
              <Text
                className="mt-5 font-sans-b text-[12px] uppercase tracking-wide"
                style={{ color: REVEAL_MUTE }}
              >
                What connects you most
              </Text>
              <Text
                className="mt-2 px-2 text-center font-sans-b text-[22px] leading-snug"
                style={{ color: REVEAL_FG }}
              >
                {payload.strongest.label}
              </Text>
            </View>
          ) : null}

          {frame === 'others' ? (
            <View className="mt-8 gap-6">
              {payload.quizMatches.length > 0 ? (
                <View>
                  {/* Title + i-icon: the tip explains these scores come from quizzes. */}
                  <View className="mb-3 flex-row items-center justify-center gap-1.5">
                    <Text
                      className="font-sans-b text-[18px]"
                      style={{ color: REVEAL_FG }}
                    >
                      How you line up
                    </Text>
                    <InfoPopover
                      description="From the quizzes you both took"
                      title="How you line up"
                      infoAnalyticsId={REVEAL.quiz_matches.info}
                      dismissAnalyticsId={SECTION_INFO_TOOLTIP.chrome.dismiss}
                      bodyAnalyticsId={SECTION_INFO_TOOLTIP.body.body}
                      parentScreen="reveal"
                      section="quiz_matches"
                    >
                      <InfoIcon size={16} color={REVEAL_MUTE} strokeWidth={2.4} />
                    </InfoPopover>
                  </View>
                  <QuizMatchList items={payload.quizMatches} />
                </View>
              ) : null}
              <View>
                <Text
                  className="mb-4 text-center font-sans-b text-[18px]"
                  style={{ color: REVEAL_FG }}
                >
                  You&apos;ve also got…
                </Text>
                <CommonalityList items={payload.others} theirName={first} />
              </View>
            </View>
          ) : null}

          {frame === 'close' ? (
            <RevealClose
              suggestions={payload.bridgeSuggestions}
              discoverable={payload.discoverable}
              theirName={first}
              onAdd={(bridgePersonId, bridgeViaId) => {
                void (async () => {
                  await connectFromReveal(bridgePersonId, bridgeViaId);
                  trackProduct('connect_requested', {
                    surface: 'reveal',
                    method: 'bridge',
                    via_present: Boolean(bridgeViaId)
                  });
                })();
              }}
              onEnableDiscover={() => {
                void (async () => {
                  await setDiscoverable(true);
                  await reloadBridges();
                })();
              }}
            />
          ) : null}
        </ScreenBody>

        {/* Story tap zones: left half = back, right half = forward. They sit on
            the side edges so the middle stays scrollable for long lists. */}
        {isStory ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={withAnalyticsPress(REVEAL.flow.tap_prev, () => void goBack())}
              style={{ position: 'absolute', left: 0, top: insets.top + 52, bottom: 96, width: '28%' }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              onPress={withAnalyticsPress(REVEAL.flow.tap_next, () => void advance())}
              style={{ position: 'absolute', right: 0, top: insets.top + 52, bottom: 96, width: '28%' }}
            />
          </>
        ) : null}

        <View className="px-5" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          {frame === 'met' ? (
            <ButtonPrimary
              full
              disabled={!canContinue}
              analyticsId={REVEAL.flow.continue}
              onPress={() => void advance()}
              accessibilityLabel="Continue"
            >
              Continue
            </ButtonPrimary>
          ) : frame === 'close' ? (
            <ButtonPrimary
              full
              size="lg"
              analyticsId={REVEAL.flow.see_profile}
              onPress={goSeeProfile}
              accessibilityLabel={`See ${first}'s profile`}
            >
              {`See ${first}'s profile`}
            </ButtonPrimary>
          ) : (
            // Story cards move on left/right tap zones — no bottom hint copy.
            null
          )}
        </View>
      </View>
    </Screen>
  );
}
