// ============================================
// WHAT THIS FILE DOES (plain English):
// Take What Gets You Going with Bridger flair: purple wash, fun emoji tiles,
// burst on tap, note behind a chip, no scrolling. One pick per scene, skip×3.
// Mid-take answers stay on this phone so you can leave and finish later.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  openSurface,
  dismissSurface,
  trackClick,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct,
  WHAT_GETS_YOU_GOING
} from '@bridger/shared';
import { EndQuizSheet } from '../../_shared/EndQuizSheet';
import { getDisclosure } from '../../../data/discover';
import { toDisclosureContextForQuiz } from '../_shared/disclosure-context';
import {
  clearDiscoverDraft,
  loadDiscoverDraft,
  saveDiscoverDraft
} from '../_shared/discover-draft';
import { optionEmoji } from '../_shared/option-emoji';
import { QuizTakeShell } from '../_shared/QuizTakeShell';
import { VALUES_DIALS } from './dimensions';
import {
  VALUES_INSTRUCTIONS,
  VALUES_QUESTIONS,
  type ValuesOption
} from './questions';
import {
  scoreValues,
  type ValuesAnswer,
  type ValuesScoreResult
} from './score';

type Props = {
  open: boolean;
  parentScreen?: string;
  onClose: () => void;
  onComplete: (result: ValuesScoreResult) => void | Promise<void>;
};

const SLUG = 'values';

function shuffleOptions(options: ValuesOption[]): ValuesOption[] {
  const out = [...options];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

const SHELL_IDS = {
  back: WHAT_GETS_YOU_GOING.chrome.back,
  introBody: WHAT_GETS_YOU_GOING.intro.body,
  introStart: WHAT_GETS_YOU_GOING.intro.start,
  option: WHAT_GETS_YOU_GOING.take.option,
  explain: WHAT_GETS_YOU_GOING.take.explain,
  next: WHAT_GETS_YOU_GOING.take.next,
  optionsMore: WHAT_GETS_YOU_GOING.take.options_more,
  noteToggle: WHAT_GETS_YOU_GOING.take.note_toggle,
  resultBody: WHAT_GETS_YOU_GOING.result.body,
  resultDone: WHAT_GETS_YOU_GOING.result.done
};

export function ValuesFlow({
  open,
  parentScreen = 'discover',
  onClose,
  onComplete
}: Props) {
  const startedAt = useRef<number | null>(null);
  const lastStep = useRef('intro');
  const completedRef = useRef(false);
  const hydratingRef = useRef(false);

  const [phase, setPhase] = useState<'intro' | 'take' | 'result'>('intro');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [explain, setExplain] = useState('');
  const [answers, setAnswers] = useState<ValuesAnswer[]>([]);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [result, setResult] = useState<ValuesScoreResult | null>(null);
  const [shuffled, setShuffled] = useState<ValuesOption[][]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // THIS SECTION DOES: open surface + resume a saved draft when possible.
  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    completedRef.current = false;
    hydratingRef.current = true;
    let cancelled = false;
    void (async () => {
      const draft = await loadDiscoverDraft<ValuesAnswer>(SLUG);
      if (cancelled) return;
      // Fresh shuffle each open; answers and skips still resume from the draft.
      setShuffled(VALUES_QUESTIONS.map((q) => shuffleOptions(q.options)));
      if (draft && draft.phase !== 'result' && (draft.answers?.length || draft.phase === 'take')) {
        const restored = draft.answers ?? [];
        startedAt.current = draft.startedAt || Date.now();
        lastStep.current = VALUES_QUESTIONS[draft.index]?.id ?? 'take';
        setPhase(draft.phase === 'intro' ? 'take' : draft.phase);
        setIndex(Math.min(draft.index, VALUES_QUESTIONS.length - 1));
        setAnswers(restored);
        setSelected(draft.selected ?? []);
        setExplain(draft.explain ?? '');
        setSkipsUsed(restored.filter((a) => a.optionId === 'skip').length);
        setResult(null);
      } else {
        startedAt.current = Date.now();
        lastStep.current = 'intro';
        setPhase('intro');
        setIndex(0);
        setSelected([]);
        setExplain('');
        setAnswers([]);
        setSkipsUsed(0);
        setResult(null);
        trackFlowStarted('what_gets_you_going', { quiz_id: 'values' });
        trackProduct('quiz_started', { quiz_id: 'values', quiz_version: 1 });
      }
      openSurface('what_gets_you_going', parentScreen);
      hydratingRef.current = false;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (!completedRef.current) {
        const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
        trackFlowAbandoned('what_gets_you_going', ms, lastStep.current, {
          quiz_id: 'values'
        });
        trackProduct('quiz_abandoned', {
          quiz_id: 'values',
          last_question_id: lastStep.current,
          time_spent_ms: ms
        });
        dismissSurface('what_gets_you_going');
      }
    };
  }, [open, parentScreen]);

  // THIS SECTION DOES: keep progress on-device while they answer.
  useEffect(() => {
    if (!open || !ready || hydratingRef.current || completedRef.current) return;
    if (phase === 'intro' || phase === 'result') return;
    void saveDiscoverDraft({
      slug: SLUG,
      phase,
      index,
      answers,
      selected,
      explain,
      startedAt: startedAt.current ?? Date.now(),
      totalQuestions: VALUES_QUESTIONS.length
    });
  }, [open, ready, phase, index, answers, selected, explain]);

  const question = VALUES_QUESTIONS[index];
  const options = shuffled[index] ?? question?.options ?? [];
  const total = VALUES_QUESTIONS.length;
  const skipsLeft = VALUES_INSTRUCTIONS.maxSkips - skipsUsed;
  const progress =
    phase === 'intro' ? 0.02 : phase === 'result' ? 1 : (index + 1) / total;

  const tiles = useMemo(
    () =>
      options.map((o) => ({
        id: o.id,
        label: o.label,
        emoji: optionEmoji(`${question?.id ?? 'v'}-${o.id}`)
      })),
    [options, question?.id]
  );

  const finishWithAnswers = async (finalAnswers: ValuesAnswer[]) => {
    const disclosure = toDisclosureContextForQuiz(await getDisclosure());
    setResult(scoreValues(finalAnswers, disclosure));
    setPhase('result');
    lastStep.current = 'result';
  };

  const advance = async (nextAnswers: ValuesAnswer[]) => {
    setAnswers(nextAnswers);
    setSelected([]);
    setExplain('');
    if (index + 1 >= total) {
      await finishWithAnswers(nextAnswers);
      return;
    }
    setIndex((i) => i + 1);
    lastStep.current = VALUES_QUESTIONS[index + 1]?.id ?? 'take';
  };

  const onContinue = async () => {
    if (!question || selected.length === 0) return;
    const pick = selected[0]!;
    const nextAnswers: ValuesAnswer[] = [
      ...answers,
      {
        questionId: question.id,
        optionId: pick,
        explain: explain.trim() || undefined
      }
    ];
    trackProduct('quiz_question_answered', {
      quiz_id: 'values',
      question_id: question.id,
      option_count: 1,
      explained: Boolean(explain.trim()),
      is_inserted: false
    });
    trackFlowStep('what_gets_you_going', question.id, { quiz_id: 'values' });
    await advance(nextAnswers);
  };

  const onSkip = async () => {
    if (!question || skipsLeft <= 0) return;
    trackClick(WHAT_GETS_YOU_GOING.take.skip);
    trackProduct('quiz_question_skipped', {
      quiz_id: 'values',
      question_id: question.id
    });
    setSkipsUsed((n) => n + 1);
    const nextAnswers: ValuesAnswer[] = [
      ...answers,
      { questionId: question.id, optionId: 'skip' }
    ];
    trackFlowStep('what_gets_you_going', `${question.id}_skip`, {
      quiz_id: 'values'
    });
    await advance(nextAnswers);
  };

  // THIS SECTION DOES: finish the quiz and wipe the on-device draft.
  const onDoneResult = async () => {
    if (!result) return;
    completedRef.current = true;
    await clearDiscoverDraft(SLUG);
    const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
    await onComplete(result);
    trackFlowCompleted('what_gets_you_going', ms, { quiz_id: 'values' });
    trackProduct('quiz_completed', {
      quiz_id: 'values',
      quiz_version: 1,
      time_to_complete_ms: ms,
      questions_answered: total - result.skippedCount
    });
    dismissSurface('what_gets_you_going');
    onClose();
  };

  // THIS SECTION DOES: ask Save and exit / Discard instead of closing cold.
  const requestLeave = () => {
    if (phase === 'intro' || completedRef.current) {
      onClose();
      return;
    }
    setLeaveOpen(true);
  };

  const saveAndExit = () => {
    setLeaveOpen(false);
    void saveDiscoverDraft({
      slug: SLUG,
      phase: phase === 'result' ? 'take' : phase,
      index,
      answers,
      selected,
      explain,
      startedAt: startedAt.current ?? Date.now(),
      totalQuestions: total
    });
    onClose();
  };

  const discardAndExit = () => {
    setLeaveOpen(false);
    void clearDiscoverDraft(SLUG);
    onClose();
  };

  const onBack = () => {
    if (phase === 'intro' || (phase === 'take' && index === 0)) {
      requestLeave();
      return;
    }
    if (phase === 'result') {
      setPhase('take');
      setIndex(total - 1);
      return;
    }
    const prev = answers[answers.length - 1];
    setAnswers((a) => a.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
    if (prev?.optionId === 'skip') {
      setSkipsUsed((n) => Math.max(0, n - 1));
      setSelected([]);
    } else {
      setSelected(prev?.optionId ? [prev.optionId] : []);
    }
    setExplain(prev?.explain ?? '');
  };

  if (!ready && open) return null;

  return (
    <>
      <QuizTakeShell
        open={open}
        accent="purple"
        ids={SHELL_IDS}
        phase={phase}
        progress={progress}
        onClose={requestLeave}
        onBack={onBack}
        intro={{
          headline: VALUES_INSTRUCTIONS.headline,
          title: VALUES_INSTRUCTIONS.title,
          lead: VALUES_INSTRUCTIONS.lead,
          rules: VALUES_INSTRUCTIONS.rules,
          emoji: '🧭'
        }}
        onStart={() => {
          setPhase('take');
          lastStep.current = 'v01';
          trackFlowStep('what_gets_you_going', 'take_start', {
            quiz_id: 'values'
          });
        }}
        stepLabel={`${index + 1} of ${total}`}
        prompt={question?.prompt ?? ''}
        questionEmoji="🧭"
        options={tiles}
        selected={selected}
        maxSelect={1}
        onToggle={(id) => setSelected([id])}
        explain={explain}
        onExplainChange={setExplain}
        continueDisabled={selected.length === 0}
        continueLabel={index + 1 >= total ? 'See my priorities' : 'Continue'}
        onContinue={() => void onContinue()}
        secondaryAction={
          skipsLeft > 0
            ? {
                label: `Skip (${skipsLeft} left)`,
                analyticsId: WHAT_GETS_YOU_GOING.take.skip,
                onPress: () => void onSkip()
              }
            : undefined
        }
        result={result ? <ResultSummary result={result} /> : null}
        onDoneResult={() => void onDoneResult()}
      />
      <EndQuizSheet
        open={leaveOpen}
        onStay={() => setLeaveOpen(false)}
        onEnd={saveAndExit}
        onDiscard={discardAndExit}
        parentScreen="what_gets_you_going"
        canSaveDraft
      />
    </>
  );
}

function ResultSummary({ result }: { result: ValuesScoreResult }) {
  const dialMeta = Object.fromEntries(VALUES_DIALS.map((d) => [d.key, d]));
  return (
    <View className="flex-1 justify-center">
      <Text accessibilityRole="header" className="font-pixel text-[28px] text-ink">
        What you prioritize
      </Text>
      <Text className="mt-2 font-sans text-[14px] leading-snug text-ink-soft">
        Relative priorities. Private. Not a judgment.
      </Text>
      <View className="mt-5 gap-2">
        {result.dials
          .filter((d) => !d.pending && d.score != null)
          .map((d, i) => {
            const meta = dialMeta[d.key];
            const score = d.score ?? 0.5;
            return (
              <View
                key={d.key}
                className="border-2 border-ink bg-purple px-3 py-2.5"
                style={{
                  borderTopLeftRadius: i % 2 === 0 ? 22 : 12,
                  borderTopRightRadius: i % 2 === 0 ? 12 : 22,
                  borderBottomRightRadius: i % 2 === 0 ? 22 : 12,
                  borderBottomLeftRadius: i % 2 === 0 ? 12 : 22
                }}
              >
                <Text className="font-sans-b text-[14px] text-white">
                  {meta?.label ?? d.key}
                </Text>
                <View className="mt-2 h-2 overflow-hidden rounded-full bg-canvas/40">
                  <View
                    className="h-full rounded-full bg-canvas"
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </View>
              </View>
            );
          })}
      </View>
    </View>
  );
}

export default ValuesFlow;
