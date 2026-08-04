// ============================================
// WHAT THIS FILE DOES (plain English):
// The Connection Reveal — a full-screen dark story that plays right after you
// connect with someone. Screen 0 asks how you met (+ optional coarse place),
// then three story screens: strongest link (Venn), "you've also got", and
// "You two should click." Same content lives forever under their In common tab.
//
// Copy is exact from REVEAL.md. Analytics surface = reveal.
// PRIVACY: place is coarse only; analytics never gets place text or names.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REVEAL, openSurface, trackFlowCompleted, trackFlowStarted, trackFlowStep } from '@bridger/shared';
import {
  Avatar,
  ButtonPrimary,
  PixelHeading,
  Screen,
  ScreenBody
} from '@bridger/ui';
import { CommonalityList } from '../../components/discover/CommonalityList';
import { HowYouMetStep } from '../../components/reveal/HowYouMetStep';
import { RevealClose } from '../../components/reveal/RevealClose';
import { RevealProgressBars } from '../../components/reveal/RevealProgressBars';
import { VennDiagram } from '../../components/reveal/VennDiagram';
import { useReveal } from '../../hooks/useReveal';

type Frame = 'met' | 'strongest' | 'others' | 'close';
const STORY_FRAMES: Frame[] = ['strongest', 'others', 'close'];

export default function RevealRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; via?: string }>();
  const personId = typeof params.id === 'string' ? params.id : 'nour';
  const viaId = typeof params.via === 'string' ? params.via : undefined;

  const {
    payload,
    loading,
    context,
    setContext,
    recordPlace,
    setRecordPlace,
    commit,
    canContinue
  } = useReveal(personId, viaId);

  const [frame, setFrame] = useState<Frame>('met');
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    openSurface('reveal');
    trackFlowStarted('reveal');
  }, []);

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
  };

  if (loading || !payload) {
    return (
      <Screen tone="plain" className="bg-ink">
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingTop: insets.top }}
        >
          <Text className="font-sans-sb text-[14px] text-white/60">Loading…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen tone="plain" className="bg-ink">
      <View className="flex-1" style={{ paddingTop: insets.top + 8 }}>
        {/* Screens 1–3 get the 3 segmented progress bars; Screen 0 does not */}
        {frame !== 'met' ? (
          <View className="px-5">
            <RevealProgressBars
              active={storyIndex < 0 ? 0 : storyIndex}
            />
          </View>
        ) : null}

        <ScreenBody className="pb-4 pt-6">
          {/* via chip — who connects you */}
          {viaName ? (
            <Text className="mb-3 text-center font-sans-md text-[13px] text-white/50">
              via {viaName}
            </Text>
          ) : null}

          <View className="items-center">
            <Avatar
              name={payload.person.name}
              emoji={payload.person.emoji}
              accent={payload.person.accent}
              personId={payload.person.id}
              size="xl"
            />
            <PixelHeading size="md" className="mt-4 text-canvas">
              {payload.person.name}
            </PixelHeading>
          </View>

          {frame === 'met' ? (
            <View className="mt-8">
              <PixelHeading size="md" className="mb-4 text-center text-canvas">
                How did you two meet?
              </PixelHeading>
              <HowYouMetStep
                context={context}
                onContext={setContext}
                recordPlace={recordPlace}
                onRecordPlace={setRecordPlace}
              />
            </View>
          ) : null}

          {frame === 'strongest' && payload.strongest ? (
            <Pressable
              onPress={() => void advance()}
              accessibilityRole="button"
              accessibilityLabel="Tap to continue"
              className="mt-8 items-center"
            >
              <VennDiagram
                yourAccent={payload.me.accent}
                theirAccent={payload.person.accent}
                label={payload.strongest.label}
              />
              <Text className="mt-5 font-sans-b text-[12px] uppercase tracking-wide text-white/50">
                What connects you most
              </Text>
              <Text className="mt-2 px-2 text-center font-sans-b text-[22px] leading-snug text-canvas">
                {payload.strongest.label}
              </Text>
            </Pressable>
          ) : null}

          {frame === 'others' ? (
            <Pressable
              onPress={() => void advance()}
              accessibilityRole="button"
              accessibilityLabel="Tap to continue"
              className="mt-8"
            >
              <Text className="mb-4 text-center font-sans-b text-[18px] text-canvas">
                You&apos;ve also got…
              </Text>
              <CommonalityList items={payload.others} theirName={first} />
            </Pressable>
          ) : null}

          {frame === 'close' ? (
            <RevealClose firstName={first} onSeeProfile={goSeeProfile} />
          ) : null}
        </ScreenBody>

        {frame !== 'close' ? (
          <View className="px-5" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <ButtonPrimary
              full
              disabled={frame === 'met' && !canContinue}
              analyticsId={REVEAL.flow.continue}
              onPress={() => void advance()}
              accessibilityLabel="Continue"
            >
              Continue
            </ButtonPrimary>
            {frame === 'met' ? (
              <Text className="mt-2 text-center font-sans-md text-[12px] text-white/50">
                next · what you have in common
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={{ paddingBottom: Math.max(insets.bottom, 16) }} />
        )}
      </View>
    </Screen>
  );
}
