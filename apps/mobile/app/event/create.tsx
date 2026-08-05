// ============================================
// WHAT THIS FILE DOES (plain English):
// The full-screen "Create event" wizard. It holds one draft in memory and walks
// the host through four steps: Details -> Invite -> Photo & sign-ups -> Preview.
// The top bar shows Back, which step you're on, and a close button. When the
// host taps "Create event" on the last step, we save it and jump to the new
// event's page so they can share it.
//
// This screen is its own analytics surface ("create_event", launched from the
// events tab) and drives the named "create_event" flow so we can see how long
// it took and where people drop off.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeftIcon, XIcon } from 'lucide-react-native';
import {
  CREATE_EVENT,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  ButtonPrimary,
  SurfaceHost,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { createEvent, type CreateEventInput } from '../../data/events';
import { DetailsStep } from '../../components/event/create/DetailsStep';
import { InviteStep } from '../../components/event/create/InviteStep';
import { ExtrasStep } from '../../components/event/create/ExtrasStep';
import { PreviewStep } from '../../components/event/create/PreviewStep';
import { STEPS, STEP_TITLES, emptyDraft, type CreateEventDraft } from '../../components/event/create/types';

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  const [draft, setDraft] = useState<CreateEventDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);

  const stepName = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Flow timing: start on mount, mark abandoned if they leave before creating.
  const flowStartedAt = useRef(Date.now());
  const created = useRef(false);
  // Track the current step in a ref so the unmount handler reports the real
  // last step reached (a plain closure would always see step 0).
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    trackFlowStarted('create_event', { surface: 'create_event', parent_screen: 'events' });
    trackFlowStep('create_event', STEPS[0], { surface: 'create_event' });
    return () => {
      if (!created.current) {
        trackFlowAbandoned('create_event', Date.now() - flowStartedAt.current, STEPS[stepRef.current], {
          surface: 'create_event'
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge a small change into the draft (used by every step).
  const patch = (p: Partial<CreateEventDraft>) => setDraft((prev) => ({ ...prev, ...p }));

  function goNext() {
    // Details needs a title before moving on — everything else is optional.
    if (stepName === 'details' && !draft.title.trim()) {
      Alert.alert('Add a title', 'Give your event a name so people know what it is.');
      return;
    }
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    trackFlowStep('create_event', STEPS[next], { surface: 'create_event' });
  }

  function goBack() {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const input: CreateEventInput = {
        title: draft.title,
        bio: draft.bio || undefined,
        day: draft.day,
        time: draft.time,
        place: draft.place || draft.address || 'TBD',
        address: draft.address || undefined,
        invitedIds: draft.invitedIds,
        coHostIds: draft.coHostIds,
        allowFriendsToInvite: draft.allowFriendsToInvite,
        cap: draft.allowFriendsToInvite ? draft.guestCap : 35,
        chipInAmount: draft.chipInEnabled ? draft.chipInAmount || undefined : undefined,
        chipInMethod: draft.chipInEnabled
          ? ((draft.chipInMethod || undefined) as CreateEventInput['chipInMethod'])
          : undefined,
        chipInHandle: draft.chipInEnabled ? draft.chipInHandle || undefined : undefined,
        cover: draft.cover,
        assignments: draft.assignments
      };
      const event = await createEvent(input);

      // PRIVACY: booleans + counts only — never the title, bio, or address text.
      trackProduct('event_created', {
        has_cohost: draft.coHostIds.length > 0,
        has_chip_in: !!(draft.chipInEnabled && (draft.chipInHandle || draft.chipInAmount)),
        has_cover: !!draft.cover,
        assignment_count: draft.assignments.length,
        invited_count: draft.invitedIds.length
      });
      created.current = true;
      trackFlowCompleted('create_event', Date.now() - flowStartedAt.current, {
        surface: 'create_event'
      });

      router.replace(`/event/${event.id}`);
    } catch (e) {
      Alert.alert('Could not create', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <SurfaceHost surface="create_event" parentScreen="events" open>
      <View
        className="flex-1 bg-canvas"
        style={{ paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {/* --- TOP BAR: back, step title (dead-click), close --- */}
        <View className="flex-row items-center justify-between px-4">
          <Pressable
            onPress={withAnalyticsPress(CREATE_EVENT.chrome.back, goBack)}
            accessibilityRole="button"
            accessibilityLabel={step === 0 ? 'Close' : 'Back'}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
          >
            <ChevronLeftIcon size={22} color={c.ink} strokeWidth={2.6} />
          </Pressable>

          <Pressable
            onPress={withAnalyticsPress(CREATE_EVENT.chrome.step_title, undefined, {
              interactive: false
            })}
            accessibilityRole="header"
          >
            <Text className="font-pixel text-[15px] text-ink">{STEP_TITLES[stepName]}</Text>
          </Pressable>

          <Pressable
            onPress={withAnalyticsPress(CREATE_EVENT.chrome.close, () => router.back())}
            accessibilityRole="button"
            accessibilityLabel="Close without creating"
            className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
          >
            <XIcon size={20} color={c.ink} strokeWidth={2.6} />
          </Pressable>
        </View>

        {/* --- PROGRESS DOTS: which of the four steps you're on --- */}
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <View
              key={s}
              className={cn(
                'h-1.5 rounded-full',
                i === step ? 'w-6 bg-ink' : i < step ? 'w-1.5 bg-ink' : 'w-1.5 bg-ink-line'
              )}
            />
          ))}
        </View>

        {/* --- STEP BODY --- */}
        <View className="flex-1 px-4 pt-4">
          {stepName === 'details' ? <DetailsStep draft={draft} onChange={patch} /> : null}
          {stepName === 'invite' ? <InviteStep draft={draft} onChange={patch} /> : null}
          {stepName === 'extras' ? <ExtrasStep draft={draft} onChange={patch} /> : null}
          {stepName === 'preview' ? (
            <PreviewStep draft={draft} creating={creating} onCreate={() => void handleCreate()} />
          ) : null}
        </View>

        {/* --- NEXT: preview has its own Create button, so hide Next there --- */}
        {!isLast ? (
          <View className="px-4 pt-2">
            <ButtonPrimary
              full
              size="lg"
              onPress={goNext}
              analyticsId={CREATE_EVENT.chrome.next}
              accessibilityLabel="Next step"
            >
              Next
            </ButtonPrimary>
          </View>
        ) : null}
      </View>
    </SurfaceHost>
  );
}
