// ============================================
// WHAT THIS FILE DOES (plain English):
// Take Your Funny Bone with Bridger flair: coral wash, fun-shaped emoji tiles,
// burst on tap, note tucked behind a chip, no scrolling. Scores five taste
// axes + breadth. Disclosure rides along for the moderator.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  openSurface,
  dismissSurface,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct,
  YOUR_FUNNY_BONE
} from '@bridger/shared';
import { getDisclosure } from '../../../data/discover';
import { toDisclosureContextForQuiz } from '../_shared/disclosure-context';
import { optionEmoji } from '../_shared/option-emoji';
import { QuizTakeShell } from '../_shared/QuizTakeShell';
import { HUMOR_INSTRUCTIONS, HUMOR_QUESTIONS } from './questions';
import {
  scoreHumor,
  type HumorAnswer,
  type HumorScoreResult
} from './score';

type Props = {
  open: boolean;
  parentScreen?: string;
  onClose: () => void;
  onComplete: (result: HumorScoreResult) => void | Promise<void>;
};

const PHASE_EMOJI = { 1: '😂', 2: '🎤', 3: '🕵️' } as const;

const SHELL_IDS = {
  back: YOUR_FUNNY_BONE.chrome.back,
  introBody: YOUR_FUNNY_BONE.intro.body,
  introStart: YOUR_FUNNY_BONE.intro.start,
  option: YOUR_FUNNY_BONE.take.option,
  explain: YOUR_FUNNY_BONE.take.explain,
  next: YOUR_FUNNY_BONE.take.next,
  optionsMore: YOUR_FUNNY_BONE.take.options_more,
  noteToggle: YOUR_FUNNY_BONE.take.note_toggle,
  resultBody: YOUR_FUNNY_BONE.result.body,
  resultDone: YOUR_FUNNY_BONE.result.done
};

export function HumorFlow({
  open,
  parentScreen = 'discover',
  onClose,
  onComplete
}: Props) {
  const startedAt = useRef<number | null>(null);
  const lastStep = useRef('intro');
  const completedRef = useRef(false);

  const [phase, setPhase] = useState<'intro' | 'take' | 'result'>('intro');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [explain, setExplain] = useState('');
  const [answers, setAnswers] = useState<HumorAnswer[]>([]);
  const [result, setResult] = useState<HumorScoreResult | null>(null);

  useEffect(() => {
    if (!open) return;
    completedRef.current = false;
    startedAt.current = Date.now();
    lastStep.current = 'intro';
    setPhase('intro');
    setIndex(0);
    setSelected([]);
    setExplain('');
    setAnswers([]);
    setResult(null);
    openSurface('your_funny_bone', parentScreen);
    trackFlowStarted('your_funny_bone', { quiz_id: 'humor' });
    trackProduct('quiz_started', { quiz_id: 'humor', quiz_version: 1 });
    return () => {
      if (!completedRef.current) {
        const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
        trackFlowAbandoned('your_funny_bone', ms, lastStep.current, {
          quiz_id: 'humor'
        });
        trackProduct('quiz_abandoned', {
          quiz_id: 'humor',
          last_question_id: lastStep.current,
          time_spent_ms: ms
        });
        dismissSurface('your_funny_bone');
      }
    };
  }, [open, parentScreen]);

  const question = HUMOR_QUESTIONS[index];
  const total = HUMOR_QUESTIONS.length;
  const progress =
    phase === 'intro' ? 0.02 : phase === 'result' ? 1 : (index + 1) / total;

  const tiles = useMemo(() => {
    if (!question) return [];
    return question.options.map((o) => ({
      id: o.id,
      label: o.label,
      emoji: optionEmoji(o.id, o.emoji)
    }));
  }, [question]);

  const toggle = (optionId: string) => {
    if (!question) return;
    if (optionId === 'none') {
      setSelected((prev) => (prev.includes('none') ? [] : ['none']));
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((id) => id !== 'none');
      if (withoutNone.includes(optionId)) {
        return withoutNone.filter((id) => id !== optionId);
      }
      if (withoutNone.length >= question.maxSelect) {
        return [...withoutNone.slice(1), optionId];
      }
      return [...withoutNone, optionId];
    });
  };

  const finishWithAnswers = async (finalAnswers: HumorAnswer[]) => {
    const disclosure = toDisclosureContextForQuiz(await getDisclosure());
    const scored = scoreHumor(finalAnswers, disclosure);
    setResult(scored);
    setPhase('result');
    lastStep.current = 'result';
  };

  const onContinue = async () => {
    if (!question || selected.length === 0) return;
    const nextAnswers: HumorAnswer[] = [
      ...answers,
      {
        questionId: question.id,
        optionIds: [...selected],
        explain: explain.trim() || undefined
      }
    ];
    trackProduct('quiz_question_answered', {
      quiz_id: 'humor',
      question_id: question.id,
      option_count: selected.length,
      explained: Boolean(explain.trim()),
      is_inserted: false
    });
    trackFlowStep('your_funny_bone', question.id, { quiz_id: 'humor' });
    setAnswers(nextAnswers);
    setSelected([]);
    setExplain('');

    if (index + 1 >= total) {
      await finishWithAnswers(nextAnswers);
      return;
    }
    setIndex((i) => i + 1);
    lastStep.current = HUMOR_QUESTIONS[index + 1]?.id ?? 'take';
  };

  const onDoneResult = async () => {
    if (!result) return;
    completedRef.current = true;
    const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
    await onComplete(result);
    trackFlowCompleted('your_funny_bone', ms, { quiz_id: 'humor' });
    trackProduct('quiz_completed', {
      quiz_id: 'humor',
      quiz_version: 1,
      time_to_complete_ms: ms,
      questions_answered: total
    });
    dismissSurface('your_funny_bone');
    onClose();
  };

  const onBack = () => {
    if (phase === 'intro' || (phase === 'take' && index === 0)) {
      onClose();
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
    setSelected(prev?.optionIds ?? []);
    setExplain(prev?.explain ?? '');
  };

  return (
    <QuizTakeShell
      open={open}
      accent="coral"
      ids={SHELL_IDS}
      phase={phase}
      progress={progress}
      onClose={onClose}
      onBack={onBack}
      intro={{
        headline: HUMOR_INSTRUCTIONS.headline,
        title: HUMOR_INSTRUCTIONS.title,
        lead: HUMOR_INSTRUCTIONS.lead,
        rules: HUMOR_INSTRUCTIONS.rules,
        emoji: '😂'
      }}
      onStart={() => {
        setPhase('take');
        lastStep.current = 'h01';
        trackFlowStep('your_funny_bone', 'take_start', { quiz_id: 'humor' });
      }}
      stepLabel={`${index + 1} of ${total}`}
      prompt={question?.prompt ?? ''}
      questionEmoji={question ? PHASE_EMOJI[question.phase] : '😂'}
      options={tiles}
      selected={selected}
      maxSelect={question?.maxSelect ?? 1}
      onToggle={(id) => toggle(id)}
      explain={explain}
      onExplainChange={setExplain}
      continueDisabled={selected.length === 0}
      continueLabel={
        index + 1 >= total ? 'See my funny bone' : 'Continue'
      }
      onContinue={() => void onContinue()}
      result={result ? <ResultSummary result={result} /> : null}
      onDoneResult={() => void onDoneResult()}
    />
  );
}

function ResultSummary({ result }: { result: HumorScoreResult }) {
  return (
    <View className="flex-1 justify-center">
      <Text accessibilityRole="header" className="font-pixel text-[28px] text-ink">
        {result.breadthLabel}
      </Text>
      <Text className="mt-2 font-sans text-[15px] leading-snug text-ink-soft">
        Private taste dials. Matches never see your picks.
      </Text>

      <View className="mt-5 gap-2">
        {result.axes.map((axis) => (
          <View
            key={axis.key}
            className="border-2 border-ink bg-coral px-3 py-2.5"
            style={{
              borderTopLeftRadius: 22,
              borderTopRightRadius: 10,
              borderBottomRightRadius: 22,
              borderBottomLeftRadius: 10
            }}
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text className="min-w-0 flex-1 font-sans text-[11px] text-onaccent">
                {axis.lowLabel}
              </Text>
              <Text className="font-sans-b text-[11px] text-onaccent">
                {axis.band}
              </Text>
              <Text className="min-w-0 flex-1 text-right font-sans text-[11px] text-onaccent">
                {axis.highLabel}
              </Text>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-canvas/40">
              <View
                className="h-full rounded-full bg-ink"
                style={{ width: `${Math.round(axis.score * 100)}%` }}
                accessible={false}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default HumorFlow;
