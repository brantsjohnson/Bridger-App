// ============================================
// WHAT THIS FILE DOES (plain English):
// One-question-at-a-time flow for Profile fill modules and Discover's private
// match modules. Private mode: opens with a privacy promise and never asks who
// can see answers. Share mode (Profile): ends with a real audience picker —
// "Set all" plus per-answered-item Close / Friends / All chips — so every
// answer carries its own visibility before it's saved.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, LockIcon, XIcon } from 'lucide-react-native';
import { trackClick, type Accent, type Tier } from '@bridger/shared';
import { ButtonPrimary } from './Button';
import { HobbyEmojiBurst, type HobbyBurstOrigin } from './HobbyEmojiBurst';
import { HobbySelect, type HobbyOption } from './HobbySelect';
import { ACCENTS, useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { withAnalyticsPress } from '../lib/analytics';

/** Minimal hit shape for placeSearch (caller supplies the geocoder). */
export type GeocodeHit = {
  label: string;
  displayName: string;
  lat: number;
  lng: number;
  countryCode: string;
  countryName?: string;
};

export type ModuleQuestion =
  | { id: string; ask: string; type: 'single'; options: string[]; emoji?: string }
  | { id: string; ask: string; type: 'multi'; options: string[]; emoji?: string }
  | { id: string; ask: string; type: 'text'; placeholder?: string; emoji?: string }
  | {
      id: string;
      ask: string;
      type: 'placeSearch';
      placeholder?: string;
      emoji?: string;
    }
  | {
      id: string;
      ask: string;
      type: 'thisOrThat';
      a: string;
      b: string;
      /** when true, a third "Both" choice is offered (Profile this-or-that) */
      allowBoth?: boolean;
      /** when true, "Neither" and Skip are offered (PROFILE-MODULES.md Module 8) */
      allowNeither?: boolean;
      emoji?: string;
    }
  | { id: string; ask: string; type: 'yesNo'; emoji?: string }
  | {
      id: string;
      ask: string;
      type: 'hobbySelect';
      options: HobbyOption[];
      /** follow-up ask keyed by hobby id — one screen per picked hobby */
      followups: Record<string, string>;
      emoji?: string;
    };

export type ModuleAnswer = string | string[];

/** Who can see each answered question. Only filled in share mode. */
export type ModuleVisibility = Record<string, Tier>;

/** Whether Discover matching may use each answer. Independent from visibility. */
export type ModuleMatchable = Record<string, boolean>;

const TIER_CHIPS: { id: Tier; short: string; accent: Accent }[] = [
  { id: 'close', short: 'Close', accent: 'pink' },
  { id: 'friend', short: 'Friends', accent: 'blue' },
  { id: 'acquaintance', short: 'All', accent: 'teal' }
];

/** Follow-up screens generated from a hobbySelect answer. */
type FollowupQuestion = {
  id: string;
  ask: string;
  type: 'text';
  placeholder?: string;
  emoji?: string;
  /** the hobby this follow-up belongs to */
  hobbyId: string;
};

export function ModuleFlow({
  open,
  title,
  questions,
  mode = 'share',
  intro,
  defaultTier = 'friend',
  /** Keys that must never be bulk-matchable (Module 2 identity/beliefs). */
  sensitiveKeys = [],
  onClose,
  onDone,
  audienceSetAllAnalyticsId,
  audienceRowAnalyticsId,
  matchableToggleAnalyticsId,
  matchableRowAnalyticsId,
  searchPlaces,
  placeSearchAnalyticsId,
  placeResultAnalyticsId,
  onBurstStart,
  /** Prefill answers when reopening a module (e.g. birthday already saved). */
  initialAnswers
}: {
  open: boolean;
  title: string;
  questions: ModuleQuestion[];
  /** 'private' = matching only; 'share' = profile with audience + matchable ask */
  mode?: 'share' | 'private';
  intro?: string;
  /** default visibility for every answered item in share mode */
  defaultTier?: Tier;
  sensitiveKeys?: string[];
  onClose: () => void;
  onDone?: (
    answers: Record<string, ModuleAnswer>,
    visibility?: ModuleVisibility,
    matchable?: ModuleMatchable
  ) => void;
  audienceSetAllAnalyticsId?: string;
  audienceRowAnalyticsId?: string;
  matchableToggleAnalyticsId?: string;
  matchableRowAnalyticsId?: string;
  /** Injected geocoder for placeSearch questions (app supplies Photon). */
  searchPlaces?: (query: string, signal?: AbortSignal) => Promise<GeocodeHit[]>;
  placeSearchAnalyticsId?: string;
  placeResultAnalyticsId?: string;
  /** Optional buzz when a hobby chip sprays emoji (mobile wires fireworks haptics). */
  onBurstStart?: () => void;
  initialAnswers?: Record<string, ModuleAnswer>;
}) {
  const isPrivate = mode === 'private';
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const [started, setStarted] = useState(!isPrivate);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ModuleAnswer>>(
    () => initialAnswers ?? {}
  );
  const [visibility, setVisibility] = useState<ModuleVisibility>({});
  const [matchable, setMatchable] = useState<ModuleMatchable>({});
  const [hobbyBursts, setHobbyBursts] = useState<
    Array<{ key: number; emoji: string; origin: HobbyBurstOrigin }>
  >([]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setStarted(!isPrivate);
      setAnswers({});
      setVisibility({});
      setMatchable({});
      setHobbyBursts([]);
      return;
    }
    // Seed once per open so typing is not wiped if about refreshes mid-flow.
    setAnswers((prev) =>
      Object.keys(prev).length > 0 ? prev : (initialAnswers ?? {})
    );
  }, [open, isPrivate, initialAnswers]);

  // Hobby select expands into one follow-up text screen per picked hobby.
  const hobbySelectQ = questions.find((q) => q.type === 'hobbySelect');
  const followups: FollowupQuestion[] = useMemo(() => {
    if (!hobbySelectQ || hobbySelectQ.type !== 'hobbySelect') return [];
    const picked = (answers[hobbySelectQ.id] as string[]) ?? [];
    return picked.map((id) => {
      const opt = hobbySelectQ.options.find((o) => o.id === id);
      const customLabel = answers[`customLabel:${id}`];
      const customEmoji = answers[`customEmoji:${id}`];
      const label =
        opt?.label ??
        (typeof customLabel === 'string' ? customLabel : undefined);
      const ask =
        hobbySelectQ.followups[id] ??
        (label ? `Tell me more about ${label}` : 'Tell me more');
      return {
        id: `followup:${id}`,
        ask,
        type: 'text' as const,
        placeholder: 'Optional',
        emoji:
          opt?.emoji ??
          (typeof customEmoji === 'string' ? customEmoji : undefined),
        hobbyId: id
      };
    });
  }, [hobbySelectQ, answers]);

  // The navigable list: original questions, with hobby follow-ups inserted
  // right after the hobbySelect step.
  const flowQuestions = useMemo(() => {
    const out: Array<ModuleQuestion | FollowupQuestion> = [];
    for (const q of questions) {
      out.push(q);
      if (q.type === 'hobbySelect') {
        for (const f of followups) out.push(f);
      }
    }
    return out;
  }, [questions, followups]);

  // Share mode: questions → who-sees review → matchable ask. Private: questions → privacy review.
  const closingSteps = isPrivate ? 1 : 2;
  const lastStep = flowQuestions.length + closingSteps - 1;
  const total = flowQuestions.length + closingSteps;
  const q = flowQuestions[step];
  const reviewing = step === flowQuestions.length;
  const matching = !isPrivate && step === flowQuestions.length + 1;

  const next = () => setStep((s) => Math.min(lastStep, s + 1));
  const set = (id: string, v: ModuleAnswer) => setAnswers((a) => ({ ...a, [id]: v }));

  const answered = (id: string) => {
    const v = answers[id];
    if (v === 'skip') return false;
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  };

  const sensitiveSet = useMemo(() => new Set(sensitiveKeys), [sensitiveKeys]);

  // Seed visibility for every answered item the first time we hit review.
  useEffect(() => {
    if (!reviewing || isPrivate) return;
    setVisibility((prev) => {
      const nextVis: ModuleVisibility = { ...prev };
      for (const item of flowQuestions) {
        if (answered(item.id) && nextVis[item.id] == null) {
          nextVis[item.id] = defaultTier;
        }
      }
      return nextVis;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewing, isPrivate, defaultTier, flowQuestions.length]);

  // Seed matchable defaults when entering the Discover consent step.
  useEffect(() => {
    if (!matching) return;
    setMatchable((prev) => {
      const nextM: ModuleMatchable = { ...prev };
      for (const item of flowQuestions) {
        if (!answered(item.id) || nextM[item.id] != null) continue;
        // Sensitive fields default off and are never bulk-included.
        nextM[item.id] = !sensitiveSet.has(item.id);
      }
      return nextM;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matching, flowQuestions.length, sensitiveSet]);

  const setAllVisibility = (tier: Tier) => {
    setVisibility((prev) => {
      const nextVis: ModuleVisibility = { ...prev };
      for (const item of flowQuestions) {
        if (answered(item.id)) nextVis[item.id] = tier;
      }
      return nextVis;
    });
  };

  const setAllMatchable = (value: boolean) => {
    setMatchable((prev) => {
      const nextM: ModuleMatchable = { ...prev };
      for (const item of flowQuestions) {
        if (!answered(item.id)) continue;
        if (sensitiveSet.has(item.id)) {
          // Sensitive keys stay individual; bulk Yes never turns them on.
          if (value === false) nextM[item.id] = false;
          continue;
        }
        nextM[item.id] = value;
      }
      return nextM;
    });
  };

  const finish = () => {
    if (isPrivate) {
      onDone?.(answers);
    } else {
      onDone?.(answers, visibility, matchable);
    }
    onClose();
  };

  /** From who-sees, Continue goes to matchable; from matchable, Done saves. */
  const onClosingPrimary = () => {
    if (reviewing && !isPrivate) {
      next();
      return;
    }
    finish();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-canvas">
        {/* THIS SECTION DOES: spray hobby emojis over the whole screen so they
            line up with the tap (window coordinates), not the padded card. */}
        {hobbyBursts.map((b) => (
          <HobbyEmojiBurst
            key={b.key}
            play
            emoji={b.emoji}
            origin={b.origin}
            onPlayStart={onBurstStart}
            onDone={() =>
              setHobbyBursts((prev) => prev.filter((x) => x.key !== b.key))
            }
          />
        ))}
        <View
          style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
          className="flex-1"
        >
        {!started ? (
          <PrivacyGate
            title={title}
            intro={intro}
            count={questions.length}
            onClose={onClose}
            onStart={() => setStarted(true)}
          />
        ) : (
          <>
            <View className="flex-row items-center gap-3 px-4">
              <Pressable
                onPress={step === 0 ? onClose : () => setStep((s) => s - 1)}
                accessibilityRole="button"
                accessibilityLabel={step === 0 ? 'Close' : 'Back'}
                className="h-8 w-8 items-center justify-center rounded-full border border-ink-line bg-surface"
              >
                {step === 0 ? (
                  <XIcon size={16} color={c.ink} strokeWidth={2.6} />
                ) : (
                  <ArrowLeftIcon size={16} color={c.ink} strokeWidth={2.6} />
                )}
              </Pressable>
              <View className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/10">
                <View
                  className="h-full rounded-full bg-ink"
                  style={{ width: `${((step + 1) / total) * 100}%` }}
                />
              </View>
              {/* Bar only: showing "1/14" made people quit before answering. */}
              <Text
                className="shrink-0 font-sans-b text-[11px] text-ink-mute"
                accessibilityLabel={`Step ${step + 1} of ${total}`}
              >
                {matching || reviewing ? 'Almost done' : 'Optional'}
              </Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-7" contentContainerStyle={{ paddingBottom: 24 }}>
              {matching ? (
                <MatchableStep
                  title={title}
                  questions={flowQuestions}
                  answers={answers}
                  matchable={matchable}
                  sensitiveKeys={sensitiveSet}
                  answered={answered}
                  onSet={(id, value) => setMatchable((m) => ({ ...m, [id]: value }))}
                  onSetAll={setAllMatchable}
                  matchableToggleAnalyticsId={matchableToggleAnalyticsId}
                  matchableRowAnalyticsId={matchableRowAnalyticsId}
                />
              ) : reviewing ? (
                <ReviewStep
                  title={title}
                  isPrivate={isPrivate}
                  questions={flowQuestions}
                  answers={answers}
                  visibility={visibility}
                  onSetTier={(id, tier) =>
                    setVisibility((v) => ({ ...v, [id]: tier }))
                  }
                  onSetAll={setAllVisibility}
                  answered={answered}
                  audienceSetAllAnalyticsId={audienceSetAllAnalyticsId}
                  audienceRowAnalyticsId={audienceRowAnalyticsId}
                />
              ) : q ? (
                <QuestionBody
                  q={q}
                  answers={answers}
                  set={set}
                  next={next}
                  searchPlaces={searchPlaces}
                  placeSearchAnalyticsId={placeSearchAnalyticsId}
                  placeResultAnalyticsId={placeResultAnalyticsId}
                  onHobbyBurst={(emoji, origin) => {
                    setHobbyBursts((prev) => [
                      ...prev,
                      { key: Date.now() + Math.random(), emoji, origin }
                    ]);
                  }}
                />
              ) : null}
            </ScrollView>

            <View className="gap-2 px-5 pb-2">
              {reviewing || matching ? (
                <ButtonPrimary full size="lg" onPress={onClosingPrimary}>
                  {matching || isPrivate ? 'Done' : 'Continue'}
                </ButtonPrimary>
              ) : q &&
                (q.type === 'multi' ||
                  q.type === 'text' ||
                  q.type === 'placeSearch' ||
                  q.type === 'hobbySelect' ||
                  q.type === 'yesNo') ? (
                <ButtonPrimary
                  full
                  size="lg"
                  disabled={
                    q.type === 'hobbySelect' || q.type === 'placeSearch'
                      ? !answered(q.id)
                      : false
                  }
                  onPress={next}
                >
                  Continue
                </ButtonPrimary>
              ) : (
                <Pressable onPress={next} accessibilityRole="button" accessibilityLabel="Skip">
                  <Text className="py-2 text-center font-sans-sb text-[13px] text-ink-mute">
                    Skip
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        )}
        </View>
      </View>
    </Modal>
  );
}

function QuestionBody({
  q,
  answers,
  set,
  next,
  searchPlaces,
  placeSearchAnalyticsId,
  placeResultAnalyticsId,
  onHobbyBurst
}: {
  q: ModuleQuestion | FollowupQuestion;
  answers: Record<string, ModuleAnswer>;
  set: (id: string, v: ModuleAnswer) => void;
  next: () => void;
  searchPlaces?: (query: string, signal?: AbortSignal) => Promise<GeocodeHit[]>;
  placeSearchAnalyticsId?: string;
  placeResultAnalyticsId?: string;
  onHobbyBurst: (emoji: string, origin: HobbyBurstOrigin) => void;
}) {
  const c = useThemeColors();

  return (
    <View>
      {'emoji' in q && q.emoji ? (
        <Text accessible={false} className="text-[34px]">
          {q.emoji}
        </Text>
      ) : null}
      <Text className="mt-2 font-sans-b text-[24px] leading-tight tracking-tight text-ink">
        {q.ask}
      </Text>
      {/* Birthday: Google / Apple do not hand this over, so people fill it once. */}
      {q.id === 'about-birthday' ? (
        <Text className="mt-2 font-sans-sb text-[13px] leading-snug text-ink-mute">
          Sign-in does not share your birthday with Bridger. Add it here (you can skip).
        </Text>
      ) : null}
      <View className="mt-6">
        {q.type === 'text' ? (
          <TextInput
            value={(answers[q.id] as string) ?? ''}
            onChangeText={(t) => set(q.id, t)}
            placeholder={'placeholder' in q ? q.placeholder : undefined}
            accessibilityLabel={q.ask}
            placeholderTextColor={c.inkMute}
            className="rounded-2xl border border-ink-line bg-surface px-4 py-3.5 font-sans-sb text-[16px] text-ink"
          />
        ) : null}

        {q.type === 'placeSearch' ? (
          <PlaceSearchBody
            questionId={q.id}
            ask={q.ask}
            placeholder={q.placeholder}
            value={(answers[q.id] as string) ?? ''}
            onPick={(payload) => set(q.id, payload)}
            searchPlaces={searchPlaces}
            placeSearchAnalyticsId={placeSearchAnalyticsId}
            placeResultAnalyticsId={placeResultAnalyticsId}
          />
        ) : null}

        {q.type === 'yesNo' ? (
          <View className="flex-row gap-2.5">
            {['Yes', 'No'].map((o) => (
              <Pressable
                key={o}
                onPress={() => {
                  set(q.id, o);
                  setTimeout(next, 180);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: answers[q.id] === o }}
                className={cn(
                  'min-h-[88px] flex-1 items-center justify-center rounded-2xl border px-3 py-4',
                  answers[q.id] === o
                    ? 'border-ink bg-green'
                    : 'border-ink-line bg-surface'
                )}
              >
                <Text className="text-center font-sans-b text-[15px] text-ink">{o}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {q.type === 'single' ? (
          <View className="gap-2">
            {q.options.map((o) => (
              <Pressable
                key={o}
                onPress={() => {
                  set(q.id, o);
                  setTimeout(next, 180);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: answers[q.id] === o }}
                className={cn(
                  'min-h-[44px] w-full rounded-2xl border px-4 py-3.5',
                  answers[q.id] === o
                    ? 'border-ink bg-green'
                    : 'border-ink-line bg-surface active:border-purple/40'
                )}
              >
                <Text className="font-sans-b text-[15px] text-ink">{o}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {q.type === 'multi' ? (
          <View className="flex-row flex-wrap gap-2">
            {q.options.map((o) => {
              const picked = ((answers[q.id] as string[]) ?? []).includes(o);
              return (
                <Pressable
                  key={o}
                  onPress={() => {
                    const cur = (answers[q.id] as string[]) ?? [];
                    set(q.id, picked ? cur.filter((x) => x !== o) : [...cur, o]);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: picked }}
                  className={cn(
                    'min-h-[40px] rounded-full border px-4 py-2.5',
                    picked ? 'border-ink bg-green' : 'border-ink-line bg-surface'
                  )}
                >
                  <Text
                    className={cn(
                      'font-sans-b text-[14px]',
                      picked ? 'text-ink' : 'text-ink-soft'
                    )}
                  >
                    {o}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {q.type === 'hobbySelect' ? (
          <HobbySelect
            questionId={q.id}
            options={q.options}
            selected={(answers[q.id] as string[]) ?? []}
            onChange={set}
            onBurst={onHobbyBurst}
          />
        ) : null}

        {q.type === 'thisOrThat' ? (
          <View className="gap-2.5">
            <View className="flex-row gap-2.5">
              {[q.a, q.b].map((o) => (
                <Pressable
                  key={o}
                  onPress={() => {
                    set(q.id, o);
                    setTimeout(next, 180);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: answers[q.id] === o }}
                  className={cn(
                    'min-h-[88px] flex-1 items-center justify-center rounded-2xl border px-3 py-4',
                    answers[q.id] === o
                      ? 'border-ink bg-green'
                      : 'border-ink-line bg-surface'
                  )}
                >
                  <Text className="text-center font-sans-b text-[15px] text-ink">{o}</Text>
                </Pressable>
              ))}
            </View>
            {q.allowBoth ? (
              <Pressable
                onPress={() => {
                  set(q.id, 'Both');
                  setTimeout(next, 180);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: answers[q.id] === 'Both' }}
                accessibilityLabel="Both"
                className={cn(
                  'min-h-[44px] items-center justify-center rounded-2xl border px-3 py-3',
                  answers[q.id] === 'Both'
                    ? 'border-ink bg-green'
                    : 'border-ink-line bg-surface'
                )}
              >
                <Text className="font-sans-b text-[14px] text-ink">Honestly, both</Text>
              </Pressable>
            ) : null}
            {q.allowNeither ? (
              <Pressable
                onPress={() => {
                  set(q.id, 'Neither');
                  setTimeout(next, 180);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: answers[q.id] === 'Neither' }}
                accessibilityLabel="Neither"
                className={cn(
                  'min-h-[44px] items-center justify-center rounded-2xl border px-3 py-3',
                  answers[q.id] === 'Neither'
                    ? 'border-ink bg-amber'
                    : 'border-ink-line bg-surface'
                )}
              >
                <Text className="font-sans-b text-[14px] text-ink">Neither</Text>
              </Pressable>
            ) : null}
            {q.allowNeither ? (
              <Pressable
                onPress={() => {
                  set(q.id, 'skip');
                  setTimeout(next, 180);
                }}
                accessibilityRole="button"
                accessibilityLabel="Skip this one"
              >
                <Text className="py-2 text-center font-sans-sb text-[13px] text-ink-mute">
                  Skip
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ReviewStep({
  title,
  isPrivate,
  questions,
  answers,
  visibility,
  onSetTier,
  onSetAll,
  answered,
  audienceSetAllAnalyticsId,
  audienceRowAnalyticsId
}: {
  title: string;
  isPrivate: boolean;
  questions: Array<ModuleQuestion | FollowupQuestion>;
  answers: Record<string, ModuleAnswer>;
  visibility: ModuleVisibility;
  onSetTier: (id: string, tier: Tier) => void;
  onSetAll: (tier: Tier) => void;
  answered: (id: string) => boolean;
  audienceSetAllAnalyticsId?: string;
  audienceRowAnalyticsId?: string;
}) {
  const answeredQs = questions.filter((x) => answered(x.id));

  return (
    <View>
      <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
        {title}
      </Text>
      <Text className="mt-1 font-sans-b text-[24px] leading-tight tracking-tight text-ink">
        {isPrivate ? 'That stays between us.' : 'Who sees this?'}
      </Text>
      {isPrivate ? (
        // Mint stays pale in dark mode; text-onaccent keeps near-black type readable.
        <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl bg-[#D7F0E8] px-4 py-3.5">
          <LockIcon size={16} color="#1C1B16" strokeWidth={2.5} />
          <Text className="flex-1 font-sans-sb text-[13px] leading-snug text-onaccent">
            Used only to find people worth knowing. Never shown on your profile.
          </Text>
        </View>
      ) : (
        <View className="mt-4 gap-2">
          <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
            Set all
          </Text>
          <View className="flex-row gap-1.5">
            {TIER_CHIPS.map((l) => (
              <Pressable
                key={l.id}
                onPress={withAnalyticsPress(audienceSetAllAnalyticsId, () => onSetAll(l.id))}
                accessibilityRole="button"
                accessibilityLabel={`Set all to ${l.short}`}
                className={cn('rounded-full px-3 py-1.5', ACCENTS[l.accent].bg)}
              >
                <Text className={cn('font-sans-b text-[12px]', ACCENTS[l.accent].text)}>
                  {l.short}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View className="mt-5 gap-1.5">
        {answeredQs.map((x) => (
          <View
            key={x.id}
            className="rounded-2xl border border-ink-line bg-surface px-3.5 py-2.5"
          >
            <Text numberOfLines={1} className="font-sans-sb text-[11px] text-ink-mute">
              {x.ask}
            </Text>
            <Text numberOfLines={2} className="font-sans-b text-[14px] text-ink">
              {formatAnswerPreview(answers[x.id])}
            </Text>
            {!isPrivate ? (
              <View
                className="mt-2 flex-row gap-1.5"
                accessibilityRole="radiogroup"
                accessibilityLabel={`Who sees ${x.ask}`}
              >
                {TIER_CHIPS.map((l) => {
                  const on = (visibility[x.id] ?? 'friend') === l.id;
                  return (
                    <View key={l.id} className="flex-1">
                      <Pressable
                        onPress={withAnalyticsPress(audienceRowAnalyticsId, () =>
                          onSetTier(x.id, l.id)
                        )}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${x.ask}: ${l.short}`}
                        className={cn(
                          'items-center rounded-full px-2 py-1.5',
                          on ? ACCENTS[l.accent].bg : 'border border-ink-line bg-surface'
                        )}
                      >
                        <Text
                          className={cn(
                            'font-sans-b text-[12px]',
                            on ? ACCENTS[l.accent].text : 'text-ink-soft'
                          )}
                        >
                          {l.short}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * THIS SECTION DOES: ask whether Discover may use these answers to connect
 * you with friends of friends. Separate from who can see them on your profile.
 */
function MatchableStep({
  title,
  questions,
  answers,
  matchable,
  sensitiveKeys,
  answered,
  onSet,
  onSetAll,
  matchableToggleAnalyticsId,
  matchableRowAnalyticsId
}: {
  title: string;
  questions: Array<ModuleQuestion | FollowupQuestion>;
  answers: Record<string, ModuleAnswer>;
  matchable: ModuleMatchable;
  sensitiveKeys: Set<string>;
  answered: (id: string) => boolean;
  onSet: (id: string, value: boolean) => void;
  onSetAll: (value: boolean) => void;
  matchableToggleAnalyticsId?: string;
  matchableRowAnalyticsId?: string;
}) {
  const answeredQs = questions.filter((x) => answered(x.id));
  const bulkQs = answeredQs.filter((x) => !sensitiveKeys.has(x.id));
  const sensitiveQs = answeredQs.filter((x) => sensitiveKeys.has(x.id));

  return (
    <View>
      <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
        {title}
      </Text>
      <Text className="mt-1 font-sans-b text-[24px] leading-tight tracking-tight text-ink">
        Use this to connect me?
      </Text>
      <Text className="mt-2 font-sans-sb text-[14px] leading-snug text-ink-soft">
        Can these answers help connect you with friends of friends in Discover? This is
        separate from who can see them on your profile.
      </Text>

      <View className="mt-4 flex-row gap-2">
        <Pressable
          onPress={withAnalyticsPress(matchableToggleAnalyticsId, () => onSetAll(true))}
          accessibilityRole="button"
          accessibilityLabel="Yes, use for Discover"
          className="min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-ink bg-green px-3 py-3"
        >
          <Text className="font-sans-b text-[14px] text-ink">Yes</Text>
        </Pressable>
        <Pressable
          onPress={withAnalyticsPress(matchableToggleAnalyticsId, () => onSetAll(false))}
          accessibilityRole="button"
          accessibilityLabel="No, do not use for Discover"
          className="min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-ink-line bg-surface px-3 py-3"
        >
          <Text className="font-sans-b text-[14px] text-ink">No</Text>
        </Pressable>
      </View>

      {bulkQs.length > 0 ? (
        <View className="mt-5 gap-1.5">
          {bulkQs.map((x) => {
            const on = matchable[x.id] !== false;
            return (
              <Pressable
                key={x.id}
                onPress={withAnalyticsPress(matchableRowAnalyticsId, () => onSet(x.id, !on))}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${x.ask}: ${on ? 'matchable' : 'not matchable'}`}
                className="flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-3.5 py-2.5"
              >
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="font-sans-sb text-[11px] text-ink-mute">
                    {x.ask}
                  </Text>
                  <Text numberOfLines={1} className="font-sans-b text-[14px] text-ink">
                    {formatAnswerPreview(answers[x.id])}
                  </Text>
                </View>
                <Text className="font-sans-b text-[12px] text-ink-mute">{on ? 'Yes' : 'No'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {sensitiveQs.length > 0 ? (
        <View className="mt-5 gap-1.5">
          <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
            Sensitive (choose one by one)
          </Text>
          {sensitiveQs.map((x) => {
            const on = matchable[x.id] === true;
            return (
              <Pressable
                key={x.id}
                onPress={withAnalyticsPress(matchableRowAnalyticsId, () => onSet(x.id, !on))}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${x.ask}: ${on ? 'matchable' : 'not matchable'}`}
                className="flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-3.5 py-2.5"
              >
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="font-sans-sb text-[11px] text-ink-mute">
                    {x.ask}
                  </Text>
                  <Text numberOfLines={1} className="font-sans-b text-[14px] text-ink">
                    {formatAnswerPreview(answers[x.id])}
                  </Text>
                </View>
                <Text className="font-sans-b text-[12px] text-ink-mute">{on ? 'Yes' : 'No'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** Show a friendly preview — unwrap placeSearch JSON to just the label. */
function formatAnswerPreview(raw: ModuleAnswer | undefined): string {
  if (raw == null) return '';
  if (Array.isArray(raw)) return raw.join(' · ');
  try {
    const o = JSON.parse(raw) as { label?: string; lat?: number };
    if (typeof o.label === 'string' && typeof o.lat === 'number') return o.label;
  } catch {
    // plain text answer
  }
  return raw;
}

/**
 * Place search step — type a city/country, pick a Photon result.
 * Stores a JSON string { label, lat, lng, countryCode } as the answer.
 * PRIVACY: never logs the query text; only that a result was picked.
 */
function PlaceSearchBody({
  questionId,
  ask,
  placeholder,
  value,
  onPick,
  searchPlaces,
  placeSearchAnalyticsId,
  placeResultAnalyticsId
}: {
  questionId: string;
  ask: string;
  placeholder?: string;
  value: string;
  onPick: (payload: string) => void;
  searchPlaces?: (query: string, signal?: AbortSignal) => Promise<GeocodeHit[]>;
  placeSearchAnalyticsId?: string;
  placeResultAnalyticsId?: string;
}) {
  const c = useThemeColors();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Show the picked label if we already have a JSON answer.
  let pickedLabel = '';
  try {
    if (value) {
      const o = JSON.parse(value) as { label?: string };
      if (typeof o.label === 'string') pickedLabel = o.label;
    }
  } catch {
    pickedLabel = '';
  }

  useEffect(() => {
    if (!searchPlaces) return;
    if (debounce.current) clearTimeout(debounce.current);
    abort.current?.abort();
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setError(false);
      return;
    }
    debounce.current = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(false);
        abort.current?.abort();
        const controller = new AbortController();
        abort.current = controller;
        try {
          const results = await searchPlaces(q, controller.signal);
          if (controller.signal.aborted) return;
          // Prefer hits that carry a country code (needed for the map fill).
          setHits(results.filter((r) => r.countryCode.length === 2));
        } catch {
          if (!controller.signal.aborted) {
            setHits([]);
            setError(true);
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      abort.current?.abort();
    };
  }, [query, searchPlaces]);

  function pick(hit: GeocodeHit) {
    onPick(
      JSON.stringify({
        label: hit.label,
        lat: hit.lat,
        lng: hit.lng,
        countryCode: hit.countryCode.toUpperCase()
      })
    );
    setQuery('');
    setHits([]);
  }

  if (!searchPlaces) {
    return (
      <Text className="font-sans-sb text-[13px] text-ink-mute">
        Place search is unavailable right now.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {pickedLabel ? (
        <View className="rounded-2xl border border-green/40 bg-green/10 px-4 py-3">
          <Text className="font-sans-b text-[14px] text-ink">{pickedLabel}</Text>
          <Text className="mt-0.5 font-sans-sb text-[12px] text-ink-mute">
            Selected · search again to change
          </Text>
        </View>
      ) : null}
      <View className="flex-row items-center gap-2 rounded-2xl border border-ink-line bg-surface px-4 py-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            if (placeSearchAnalyticsId) trackClick(placeSearchAnalyticsId);
          }}
          placeholder={placeholder ?? 'Search a city or country'}
          placeholderTextColor={c.inkMute}
          accessibilityLabel={ask}
          accessibilityHint="Searches for a place to pin on your map"
          className="min-w-0 flex-1 font-sans-sb text-[16px] text-ink"
          style={{ padding: 0 }}
        />
        {loading ? <ActivityIndicator size="small" color={c.inkMute} /> : null}
      </View>

      {error ? (
        <Text className="font-sans-sb text-[13px] text-ink-mute">
          Couldn't look that up. Check your connection and try again.
        </Text>
      ) : null}

      {hits.length > 0 ? (
        <View className="overflow-hidden rounded-2xl border border-ink-line bg-surface">
          {hits.map((hit, i) => (
            <Pressable
              key={`${hit.lat}-${hit.lng}-${i}`}
              onPress={withAnalyticsPress(placeResultAnalyticsId, () => pick(hit), {
                analyticsProps: { question_id: questionId }
              })}
              accessibilityRole="button"
              accessibilityLabel={`${hit.label}${hit.countryName ? `, ${hit.countryName}` : ''}`}
              className="border-b border-ink-line px-4 py-3 last:border-b-0 active:opacity-80"
            >
              <Text className="font-sans-b text-[14px] text-ink">{hit.label}</Text>
              {hit.countryName || hit.displayName ? (
                <Text numberOfLines={1} className="mt-0.5 font-sans-sb text-[12px] text-ink-mute">
                  {hit.countryName ?? hit.displayName}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PrivacyGate({
  title,
  intro,
  count,
  onClose,
  onStart
}: {
  title: string;
  intro?: string;
  count: number;
  onClose: () => void;
  onStart: () => void;
}) {
  const c = useThemeColors();
  return (
    <View className="flex-1 px-6">
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="mt-2 h-8 w-8 items-center justify-center self-start rounded-full border border-ink-line bg-surface"
      >
        <XIcon size={16} color={c.ink} strokeWidth={2.6} />
      </Pressable>
      <View className="flex-1 items-center justify-center">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-[#D7F0E8]">
          <LockIcon size={24} color={c.ink} strokeWidth={2.4} />
        </View>
        <Text className="mt-5 text-center font-sans-b text-[24px] leading-tight text-ink">
          {title}
        </Text>
        <Text className="mt-3 max-w-[280px] text-center font-sans-sb text-[15px] leading-snug text-ink-soft">
          {intro ?? 'Answers are never shared. They only connect you to more relevant friends.'}
        </Text>
        <Text className="mt-2 font-sans-sb text-[12px] text-ink-mute">
          {count} {count === 1 ? 'question' : 'questions'} · private
        </Text>
      </View>
      <ButtonPrimary full size="lg" onPress={onStart}>
        Start
      </ButtonPrimary>
      <Text className="mt-3 mb-2 text-center font-sans-sb text-[12px] text-ink-mute">
        Never shown on your profile.
      </Text>
    </View>
  );
}
