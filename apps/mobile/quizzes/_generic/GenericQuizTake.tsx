// ============================================
// WHAT THIS FILE DOES (plain English):
// Take any admin-published quiz from the API (no custom plugin folder).
// Supports single and multi choice, optional explain text (never sent to
// analytics), then shows the result and share. AI moderator is not used here.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import type { LiveQuiz, QuizQuestionPublic, QuizResult } from '@bridger/shared';
import {
  HOME,
  QUIZ,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  ButtonPrimary,
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import {
  completeQuiz,
  getLiveQuizDetail,
  submitResponse
} from '../../data/quiz';

type Phase = 'loading' | 'take' | 'result' | 'missing';

export default function GenericQuizTake({ slug }: { slug: string }) {
  const router = useRouter();
  const c = useThemeColors();
  const [phase, setPhase] = useState<Phase>('loading');
  const [quiz, setQuiz] = useState<LiveQuiz | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [explain, setExplain] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [whoGotWho, setWhoGotWho] = useState<
    Array<{ id: string; label: string; friendIds: string[] }>
  >([]);
  const startedAt = useRef(Date.now());
  const lastStep = useRef('start');
  const completed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const live = await getLiveQuizDetail(slug);
      if (cancelled) return;
      if (!live || !live.questions?.length) {
        setPhase('missing');
        return;
      }
      setQuiz(live);
      setPhase(live.resultId ? 'result' : 'take');
      if (!live.resultId) {
        trackFlowStarted('take_quiz');
        trackProduct('quiz_started', { quiz_slug: live.slug });
        startedAt.current = Date.now();
      } else if (live.results) {
        setWhoGotWho(live.results);
        setResult({
          quizId: live.quizId,
          userId: '',
          dimensionScores: {},
          confidence: {},
          completedAt: new Date().toISOString(),
          resultLabel: live.results[0]?.label,
          resultId: live.resultId
        });
      }
    })();
    return () => {
      cancelled = true;
      if (!completed.current && lastStep.current !== 'result') {
        trackFlowAbandoned(
          'take_quiz',
          Date.now() - startedAt.current,
          lastStep.current
        );
        trackProduct('quiz_abandoned', { last_step: lastStep.current });
      }
    };
  }, [slug]);

  const question: QuizQuestionPublic | undefined = quiz?.questions[index];

  function toggleOption(id: string, type: 'single' | 'multi') {
    if (type === 'single') {
      setSelected([id]);
      return;
    }
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onNext() {
    if (!quiz || !question || selected.length === 0 || busy) return;
    setBusy(true);
    lastStep.current = `q_${index}`;
    trackFlowStep('take_quiz', `question_${index + 1}`);
    trackProduct('quiz_question_answered', {
      question_index: index,
      multi: question.type === 'multi'
    });
    try {
      await submitResponse(quiz.slug, {
        questionId: question.id,
        selectedOptionIds: selected,
        explainText: question.allowExplain ? explain.trim() || undefined : undefined
      });
      const next = index + 1;
      if (next >= quiz.questions.length) {
        const { result: scored, whoGotWho: groups } = await completeQuiz(
          quiz.slug
        );
        setResult(scored);
        setWhoGotWho(groups ?? []);
        setPhase('result');
        completed.current = true;
        lastStep.current = 'result';
        trackFlowCompleted('take_quiz', Date.now() - startedAt.current);
        trackProduct('quiz_completed', {
          quiz_slug: quiz.slug,
          has_label: !!scored.resultLabel
        });
      } else {
        setIndex(next);
        setSelected([]);
        setExplain('');
      }
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    const title = quiz?.title ?? 'this quiz';
    const label = result?.resultLabel ? ` I got: ${result.resultLabel}.` : '';
    await Share.share({
      message: `Take "${title}" on Bridger.${label}`
    });
  }

  if (phase === 'loading') {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Quiz" onBack={() => router.back()} hideProfile />
        <ScreenBody>
          <ActivityIndicator className="mt-10" />
        </ScreenBody>
      </Screen>
    );
  }

  if (phase === 'missing' || !quiz) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Quiz" onBack={() => router.back()} hideProfile />
        <ScreenBody>
          <Text className="mt-8 text-center font-pixel text-[22px] text-ink">
            Quiz not found
          </Text>
          <View className="mt-4">
            <ButtonSecondary full onPress={() => router.back()}>
              Go back
            </ButtonSecondary>
          </View>
        </ScreenBody>
      </Screen>
    );
  }

  if (phase === 'result' && result) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title={quiz.title} onBack={() => router.back()} hideProfile />
        <ScreenBody>
          <Text className="font-sans-b text-[12px] uppercase text-ink-mute">
            Your result
          </Text>
          <Text className="mt-2 font-pixel text-[24px] text-ink">
            {result.resultLabel ?? 'Done'}
          </Text>
          <View className="mt-5 gap-2">
            <ButtonPrimary
              full
              analyticsId={QUIZ.result.share}
              onPress={() => void onShare()}
            >
              Share
            </ButtonPrimary>
            <ButtonSecondary full onPress={() => router.back()}>
              Done
            </ButtonSecondary>
          </View>
          {whoGotWho.length > 0 ? (
            <View className="mt-8">
              <Text className="mb-2 font-sans-b text-[14px] text-ink">
                Who got who (friends)
              </Text>
              {whoGotWho.map((g) => (
                <Text
                  key={g.id}
                  className="mb-1 font-sans-sb text-[13px] text-ink-soft"
                >
                  {g.label} · {g.friendIds.length} friend
                  {g.friendIds.length === 1 ? '' : 's'}
                </Text>
              ))}
            </View>
          ) : null}
        </ScreenBody>
      </Screen>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader title={quiz.title} onBack={() => router.back()} hideProfile />
      <ScreenBody>
        <Text className="font-sans-b text-[12px] text-ink-mute">
          {index + 1} / {quiz.questions.length}
        </Text>
        <Text className="mt-3 font-pixel text-[22px] leading-tight text-ink">
          {question.prompt}
        </Text>
        <View className="mt-6 gap-3">
          {question.options.map((opt) => {
            const on = selected.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                disabled={busy}
                onPress={withAnalyticsPress(HOME.this_week.take_quiz, () =>
                  toggleOption(opt.id, question.type)
                )}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                className={
                  on
                    ? 'rounded-2xl border-2 border-teal bg-teal/15 px-4 py-3.5'
                    : 'rounded-2xl border border-ink-line bg-surface px-4 py-3.5'
                }
              >
                <Text className="font-sans-b text-[15px] text-ink">{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {question.allowExplain ? (
          <TextInput
            value={explain}
            onChangeText={setExplain}
            placeholder="Optional: why? (kept private)"
            placeholderTextColor={c.inkMute}
            multiline
            className="mt-4 min-h-[64px] font-sans-sb text-[14px] text-ink"
            accessibilityLabel="Optional explanation"
          />
        ) : null}
        <View className="mt-6">
          <ButtonPrimary
            full
            loading={busy}
            disabled={selected.length === 0}
            analyticsId={HOME.this_week.take_quiz}
            onPress={() => void onNext()}
          >
            {index + 1 >= quiz.questions.length ? 'See result' : 'Next'}
          </ButtonPrimary>
        </View>
      </ScreenBody>
    </Screen>
  );
}
