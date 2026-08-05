// ============================================
// WHAT THIS FILE DOES (plain English):
// The "Which road trip are you?" take flow: one question per screen, a
// progress bar, then a big result with Share and (when comparable) Who got
// who. Demo scores locally; live mode posts each answer and completes via API.
// Analytics: quiz_started / quiz_question_answered / quiz_completed /
// quiz_abandoned. No answer text in events (PRIVACY).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HOME,
  trackProduct,
  type Accent,
  type LiveQuiz,
  type QuizQuestionPublic
} from '@bridger/shared';
import {
  ACCENTS,
  AvatarStack,
  ButtonPrimary,
  ButtonSecondary,
  ORGANIC,
  Screen,
  ScreenBody,
  ScreenHeader,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { isDemoMode } from '../../lib/demo';
import {
  __demoSetQuizResult,
  completeQuiz,
  getLiveQuizDetail,
  submitResponse
} from '../../data/quiz';
import { personById } from '../../data/people';
import { QUESTIONS } from './questions';
import {
  allResultBuckets,
  buildResult,
  scoreAnswers,
  type RoadTripResult,
  type RoadTripResultId
} from './result';

type Phase = 'take' | 'result';

type DisplayQuestion = {
  id: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
};

export default function RoadTripQuiz({ slug }: { slug: string }) {
  const router = useRouter();
  const c = useThemeColors();
  const startedAt = useRef(Date.now());
  const completedRef = useRef(false);
  const answersRef = useRef<Record<string, string>>({});

  const [phase, setPhase] = useState<Phase>('take');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<DisplayQuestion[]>(
    QUESTIONS.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, label: o.label }))
    }))
  );
  const [live, setLive] = useState<LiveQuiz | null>(null);
  const [result, setResult] = useState<RoadTripResult | null>(null);
  const [buckets, setBuckets] = useState<RoadTripResult[]>(allResultBuckets());
  const [busy, setBusy] = useState(false);

  // Keep a live copy of answers for abandon tracking on unmount.
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // --- START: load live questions when not in demo ---
  useEffect(() => {
    trackProduct('quiz_started', { surface: 'quiz', method: 'tap' });
    startedAt.current = Date.now();

    if (isDemoMode()) return;

    let cancelled = false;
    (async () => {
      const detail = await getLiveQuizDetail(slug);
      if (cancelled || !detail) return;
      setLive(detail);
      if (detail.questions?.length) {
        setQuestions(
          detail.questions.map((q: QuizQuestionPublic) => ({
            id: q.id,
            prompt: q.prompt,
            options: q.options.map((o) => ({ id: o.id, label: o.label }))
          }))
        );
      }
      if (detail.results?.length) {
        setBuckets(
          detail.results.map((r, i) => ({
            id: r.id as RoadTripResultId,
            label: r.label,
            accent: (r.accent as Accent) ?? (['teal', 'amber', 'coral'] as Accent[])[i % 3],
            friendIds: r.friendIds ?? []
          }))
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // --- ABANDON: if they leave before finishing, record it ---
  useEffect(() => {
    return () => {
      if (!completedRef.current) {
        trackProduct('quiz_abandoned', {
          surface: 'quiz',
          time_to_complete_ms: Date.now() - startedAt.current,
          count: Object.keys(answersRef.current).length
        });
      }
    };
  }, []);

  const total = questions.length;
  const current = questions[step];
  const progress = total > 0 ? (step + 1) / total : 0;

  async function pickOption(optionId: string) {
    if (!current || busy) return;
    const nextAnswers = { ...answers, [current.id]: optionId };
    setAnswers(nextAnswers);

    trackProduct('quiz_question_answered', {
      surface: 'quiz',
      page_index: step,
      count: step + 1
    });

    if (!isDemoMode()) {
      setBusy(true);
      try {
        await submitResponse(live?.slug ?? slug, {
          questionId: current.id,
          selectedOptionIds: [optionId]
        });
      } catch {
        // Keep going locally so a flaky network does not strand the take.
      } finally {
        setBusy(false);
      }
    }

    if (step + 1 < total) {
      setStep((s) => s + 1);
      return;
    }

    // --- COMPLETE ---
    await finish(nextAnswers);
  }

  async function finish(finalAnswers: Record<string, string>) {
    setBusy(true);
    try {
      if (isDemoMode()) {
        const id = scoreAnswers(finalAnswers);
        __demoSetQuizResult(id);
        setResult(buildResult(id));
        setBuckets(allResultBuckets());
      } else {
        const apiSlug = live?.slug ?? slug;
        const res = await completeQuiz(apiSlug);
        const resultId = (res.result.resultId ??
          guessIdFromLabel(res.result.resultLabel)) as RoadTripResultId;
        const built = buildResult(
          ['coastal', 'mountain', 'desert'].includes(resultId)
            ? resultId
            : 'coastal'
        );
        if (res.result.resultLabel) built.label = res.result.resultLabel;
        setResult(built);
        if (res.whoGotWho?.length) {
          setBuckets(
            res.whoGotWho.map((r, i) => ({
              id: r.id as RoadTripResultId,
              label: r.label,
              accent: (['teal', 'amber', 'coral'] as Accent[])[i % 3],
              friendIds: r.friendIds ?? []
            }))
          );
        }
      }

      completedRef.current = true;
      trackProduct('quiz_completed', {
        surface: 'quiz',
        time_to_complete_ms: Date.now() - startedAt.current
      });
      setPhase('result');
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    const label = result?.label ?? 'my road trip';
    try {
      await Share.share({
        message: `I got ${label} on Bridger. Which road trip are you?`
      });
    } catch {
      // User cancelled share sheet; that is fine.
    }
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  // --- RESULT SCREEN ---
  if (phase === 'result' && result) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Your result" onBack={close} />
        <ScreenBody>
          <View
            style={ORGANIC.bold}
            accessible
            accessibilityLabel={`Your result: ${result.label}`}
            className={cn('mt-4 p-8', ACCENTS[result.accent].tintSolid)}
          >
            <Text className="text-center font-sans-b text-[12px] text-ink-soft">
              Which road trip are you?
            </Text>
            <Text className="mt-2 text-center font-pixel text-[28px] leading-tight text-ink">
              {result.label}
            </Text>
          </View>

          <View className="mt-5">
            <ButtonPrimary
              full
              analyticsId={HOME.this_week.take_quiz}
              onPress={() => void onShare()}
              accessibilityLabel="Share quiz"
            >
              Share quiz
            </ButtonPrimary>
          </View>

          {/* Who got who: only when this quiz supports comparison */}
          <View className="mt-8">
            <Text
              accessibilityRole="header"
              className="mb-3 font-sans-b text-[15px] text-ink"
            >
              Who got who
            </Text>
            <View className="gap-2.5">
              {buckets.map((r) => (
                <View
                  key={r.id}
                  accessibilityLabel={`${r.label}, ${r.friendIds.length} friends`}
                  className="w-full flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-4 py-3"
                >
                  <Text
                    className="min-w-0 flex-1 font-sans-b text-[13px] text-ink"
                    numberOfLines={1}
                  >
                    {r.label} · {r.friendIds.length}
                  </Text>
                  <AvatarStack
                    people={r.friendIds.slice(0, 3).map((id) => {
                      const p = personById(id);
                      return { name: p.name, emoji: p.emoji, accent: p.accent };
                    })}
                  />
                </View>
              ))}
            </View>
          </View>

          <View className="mt-6">
            <ButtonSecondary full onPress={close} accessibilityLabel="Done">
              Done
            </ButtonSecondary>
          </View>
        </ScreenBody>
      </Screen>
    );
  }

  // --- TAKE FLOW: one question per screen ---
  if (!current) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Quiz" onBack={close} />
        <ScreenBody>
          <Text className="mt-8 text-center font-sans-sb text-ink-mute">Loading…</Text>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader title="Quiz" onBack={close} />
      <ScreenBody>
        {/* Progress: how far through the quiz */}
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: total, now: step + 1 }}
          accessibilityLabel={`Question ${step + 1} of ${total}`}
          className="mt-2 h-2 overflow-hidden rounded-full bg-ink-line"
        >
          <View
            className="h-full rounded-full bg-green"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
        <Text className="mt-2 font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
          {step + 1} / {total}
        </Text>

        <Text
          accessibilityRole="header"
          className="mt-6 font-pixel text-[24px] leading-tight text-ink"
        >
          {current.prompt}
        </Text>

        <View className="mt-6 gap-3">
          {current.options.map((opt) => (
            <Pressable
              key={opt.id}
              disabled={busy}
              onPress={withAnalyticsPress(HOME.this_week.take_quiz, () =>
                void pickOption(opt.id)
              )}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              className="min-h-[52px] justify-center rounded-card border border-ink-line bg-surface px-4 py-3.5 active:opacity-90"
              style={{ borderColor: c.inkLine }}
            >
              <Text className="font-sans-b text-[15px] text-ink">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScreenBody>
    </Screen>
  );
}

/** Best-effort map of a server result label back to a local bucket id. */
function guessIdFromLabel(label?: string): RoadTripResultId {
  const lower = (label ?? '').toLowerCase();
  if (lower.includes('mountain')) return 'mountain';
  if (lower.includes('desert')) return 'desert';
  return 'coastal';
}
