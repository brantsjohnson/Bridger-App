// ============================================
// WHAT THIS FILE DOES (plain English):
// One-question-at-a-time flow for Profile fill modules and Discover's private
// match modules. Private mode: opens with a privacy promise and never asks who
// can see answers. Share mode (Profile): ends with a real audience picker —
// "Set all" plus per-answered-item Close / Friends / All chips — so every
// answer carries its own visibility before it's saved.
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, LockIcon, XIcon } from 'lucide-react-native';
import type { Accent, Tier } from '@bridger/shared';
import { ButtonPrimary } from './Button';
import { ACCENTS, useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { withAnalyticsPress } from '../lib/analytics';

export type HobbyOption = { id: string; label: string; emoji?: string };

export type ModuleQuestion =
  | { id: string; ask: string; type: 'single'; options: string[]; emoji?: string }
  | { id: string; ask: string; type: 'multi'; options: string[]; emoji?: string }
  | { id: string; ask: string; type: 'text'; placeholder?: string; emoji?: string }
  | {
      id: string;
      ask: string;
      type: 'thisOrThat';
      a: string;
      b: string;
      /** when true, a third "Both" choice is offered (Profile this-or-that) */
      allowBoth?: boolean;
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
  onClose,
  onDone,
  audienceSetAllAnalyticsId,
  audienceRowAnalyticsId
}: {
  open: boolean;
  title: string;
  questions: ModuleQuestion[];
  /** 'private' = matching only; 'share' = profile with audience picker */
  mode?: 'share' | 'private';
  intro?: string;
  /** default visibility for every answered item in share mode */
  defaultTier?: Tier;
  onClose: () => void;
  onDone?: (answers: Record<string, ModuleAnswer>, visibility?: ModuleVisibility) => void;
  audienceSetAllAnalyticsId?: string;
  audienceRowAnalyticsId?: string;
}) {
  const isPrivate = mode === 'private';
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const [started, setStarted] = useState(!isPrivate);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ModuleAnswer>>({});
  const [visibility, setVisibility] = useState<ModuleVisibility>({});

  useEffect(() => {
    if (!open) {
      setStep(0);
      setStarted(!isPrivate);
      setAnswers({});
      setVisibility({});
    }
  }, [open, isPrivate]);

  // Hobby select expands into one follow-up text screen per picked hobby.
  const hobbySelectQ = questions.find((q) => q.type === 'hobbySelect');
  const followups: FollowupQuestion[] = useMemo(() => {
    if (!hobbySelectQ || hobbySelectQ.type !== 'hobbySelect') return [];
    const picked = (answers[hobbySelectQ.id] as string[]) ?? [];
    return picked.map((id) => {
      const opt = hobbySelectQ.options.find((o) => o.id === id);
      const ask =
        hobbySelectQ.followups[id] ??
        (opt ? `Tell me more about ${opt.label}` : 'Tell me more');
      return {
        id: `followup:${id}`,
        ask,
        type: 'text' as const,
        placeholder: 'Optional',
        emoji: opt?.emoji,
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

  const total = flowQuestions.length + 1; // +1 for the review step
  const q = flowQuestions[step];
  const reviewing = step === flowQuestions.length;

  const next = () => setStep((s) => Math.min(flowQuestions.length, s + 1));
  const set = (id: string, v: ModuleAnswer) => setAnswers((a) => ({ ...a, [id]: v }));

  const answered = (id: string) => {
    const v = answers[id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  };

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

  const setAllVisibility = (tier: Tier) => {
    setVisibility((prev) => {
      const nextVis: ModuleVisibility = { ...prev };
      for (const item of flowQuestions) {
        if (answered(item.id)) nextVis[item.id] = tier;
      }
      return nextVis;
    });
  };

  const finish = () => {
    if (isPrivate) {
      onDone?.(answers);
    } else {
      onDone?.(answers, visibility);
    }
    onClose();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
        className="flex-1 bg-canvas"
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
              <Text className="shrink-0 font-sans-b text-[11px] text-ink-mute">
                {step + 1}/{total}
              </Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-7" contentContainerStyle={{ paddingBottom: 24 }}>
              {reviewing ? (
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
                <QuestionBody q={q} answers={answers} set={set} next={next} />
              ) : null}
            </ScrollView>

            <View className="gap-2 px-5 pb-2">
              {reviewing ? (
                <ButtonPrimary full size="lg" onPress={finish}>
                  Done
                </ButtonPrimary>
              ) : q &&
                (q.type === 'multi' ||
                  q.type === 'text' ||
                  q.type === 'hobbySelect' ||
                  q.type === 'yesNo') ? (
                <ButtonPrimary
                  full
                  size="lg"
                  disabled={q.type === 'hobbySelect' ? !answered(q.id) : false}
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
    </Modal>
  );
}

function QuestionBody({
  q,
  answers,
  set,
  next
}: {
  q: ModuleQuestion | FollowupQuestion;
  answers: Record<string, ModuleAnswer>;
  set: (id: string, v: ModuleAnswer) => void;
  next: () => void;
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
          <View className="flex-row flex-wrap gap-2">
            {q.options.map((o) => {
              const picked = ((answers[q.id] as string[]) ?? []).includes(o.id);
              return (
                <Pressable
                  key={o.id}
                  onPress={() => {
                    const cur = (answers[q.id] as string[]) ?? [];
                    set(q.id, picked ? cur.filter((x) => x !== o.id) : [...cur, o.id]);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: picked }}
                  accessibilityLabel={o.label}
                  className={cn(
                    'min-h-[40px] flex-row items-center gap-1.5 rounded-full border px-3.5 py-2.5',
                    picked ? 'border-ink bg-green' : 'border-ink-line bg-surface'
                  )}
                >
                  {o.emoji ? (
                    <Text accessible={false} className="text-[14px]">
                      {o.emoji}
                    </Text>
                  ) : null}
                  <Text
                    className={cn(
                      'font-sans-b text-[14px]',
                      picked ? 'text-ink' : 'text-ink-soft'
                    )}
                  >
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
        <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl bg-[#D7F0E8] px-4 py-3.5">
          <LockIcon size={16} color="#1C1B16" strokeWidth={2.5} />
          <Text className="flex-1 font-sans-sb text-[13px] leading-snug text-ink">
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
              {Array.isArray(answers[x.id])
                ? (answers[x.id] as string[]).join(' · ')
                : (answers[x.id] as string)}
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
