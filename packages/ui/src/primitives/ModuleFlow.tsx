// ============================================
// WHAT THIS FILE DOES (plain English):
// One-question-at-a-time flow for Discover match modules (and later Profile).
// Private mode: opens with a privacy promise, never asks who can see answers,
// and never puts results on a profile. Share mode is stubbed for Profile later.
// ============================================
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, LockIcon, XIcon } from 'lucide-react-native';
import { ButtonPrimary } from './Button';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';

export type ModuleQuestion =
  | { id: string; ask: string; type: 'single'; options: string[]; emoji?: string }
  | { id: string; ask: string; type: 'multi'; options: string[]; emoji?: string }
  | { id: string; ask: string; type: 'text'; placeholder?: string; emoji?: string }
  | { id: string; ask: string; type: 'thisOrThat'; a: string; b: string; emoji?: string };

export type ModuleAnswer = string | string[];

export function ModuleFlow({
  open,
  title,
  questions,
  mode = 'share',
  intro,
  onClose,
  onDone
}: {
  open: boolean;
  title: string;
  questions: ModuleQuestion[];
  /** 'private' = matching only; 'share' = profile (audience picker later) */
  mode?: 'share' | 'private';
  intro?: string;
  onClose: () => void;
  onDone?: (answers: Record<string, ModuleAnswer>) => void;
}) {
  const isPrivate = mode === 'private';
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const total = questions.length + 1;
  const [started, setStarted] = useState(!isPrivate);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ModuleAnswer>>({});

  useEffect(() => {
    if (!open) {
      setStep(0);
      setStarted(!isPrivate);
      setAnswers({});
    }
  }, [open, isPrivate]);

  const q = questions[step];
  const reviewing = step === questions.length;
  const next = () => setStep((s) => Math.min(questions.length, s + 1));
  const set = (id: string, v: ModuleAnswer) => setAnswers((a) => ({ ...a, [id]: v }));

  const answered = (id: string) => {
    const v = answers[id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  };

  const finish = () => {
    onDone?.(answers);
    onClose();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }} className="flex-1 bg-canvas">
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
                <View>
                  <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                    {title}
                  </Text>
                  <Text className="mt-1 font-sans-b text-[24px] leading-tight tracking-tight text-ink">
                    {isPrivate ? 'That stays between us.' : 'Who sees this?'}
                  </Text>
                  {isPrivate ? (
                    <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl bg-[#D7F0E8] px-4 py-3.5">
                      <LockIcon size={16} color={c.ink} strokeWidth={2.5} />
                      <Text className="flex-1 font-sans-sb text-[13px] leading-snug text-ink">
                        Used only to find people worth knowing. Never shown on your profile.
                      </Text>
                    </View>
                  ) : null}
                  <View className="mt-5 gap-1.5">
                    {questions
                      .filter((x) => answered(x.id))
                      .map((x) => (
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
                        </View>
                      ))}
                  </View>
                </View>
              ) : q ? (
                <View>
                  {q.emoji ? (
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
                        placeholder={q.placeholder}
                        accessibilityLabel={q.ask}
                        placeholderTextColor={c.inkMute}
                        className="rounded-2xl border border-ink-line bg-surface px-4 py-3.5 font-sans-sb text-[16px] text-ink"
                      />
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
                                picked
                                  ? 'border-ink bg-green'
                                  : 'border-ink-line bg-surface'
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

                    {q.type === 'thisOrThat' ? (
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
                    ) : null}
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View className="gap-2 px-5 pb-2">
              {reviewing ? (
                <ButtonPrimary full size="lg" onPress={finish}>
                  Done
                </ButtonPrimary>
              ) : q?.type === 'multi' || q?.type === 'text' ? (
                <ButtonPrimary
                  full
                  size="lg"
                  disabled={!answered(q.id)}
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
