// ============================================
// WHAT THIS FILE DOES (plain English):
// Take Your Vibe with Bridger flair: amber wash, fun emoji tiles, burst on tap,
// note behind a chip, no scrolling. Scores Big Five + assertiveness.
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
  YOUR_VIBE
} from '@bridger/shared';
import { getDisclosure } from '../../../data/discover';
import { toDisclosureContextForQuiz } from '../_shared/disclosure-context';
import { optionEmoji } from '../_shared/option-emoji';
import { QuizTakeShell } from '../_shared/QuizTakeShell';
import {
  PERSONALITY_INSTRUCTIONS,
  PERSONALITY_QUESTIONS
} from './questions';
import {
  scorePersonality,
  type PersonalityAnswer,
  type PersonalityScoreResult
} from './score';

type Props = {
  open: boolean;
  parentScreen?: string;
  onClose: () => void;
  onComplete: (result: PersonalityScoreResult) => void | Promise<void>;
};

const SHELL_IDS = {
  back: YOUR_VIBE.chrome.back,
  introBody: YOUR_VIBE.intro.body,
  introStart: YOUR_VIBE.intro.start,
  option: YOUR_VIBE.take.option,
  explain: YOUR_VIBE.take.explain,
  next: YOUR_VIBE.take.next,
  optionsMore: YOUR_VIBE.take.options_more,
  noteToggle: YOUR_VIBE.take.note_toggle,
  resultBody: YOUR_VIBE.result.body,
  resultDone: YOUR_VIBE.result.done
};

export function PersonalityFlow({
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
  const [answers, setAnswers] = useState<PersonalityAnswer[]>([]);
  const [result, setResult] = useState<PersonalityScoreResult | null>(null);

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
    openSurface('your_vibe', parentScreen);
    trackFlowStarted('your_vibe', { quiz_id: 'personality' });
    trackProduct('quiz_started', { quiz_id: 'personality', quiz_version: 1 });
    return () => {
      if (!completedRef.current) {
        const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
        trackFlowAbandoned('your_vibe', ms, lastStep.current, {
          quiz_id: 'personality'
        });
        trackProduct('quiz_abandoned', {
          quiz_id: 'personality',
          last_question_id: lastStep.current,
          time_spent_ms: ms
        });
        dismissSurface('your_vibe');
      }
    };
  }, [open, parentScreen]);

  const question = PERSONALITY_QUESTIONS[index];
  const total = PERSONALITY_QUESTIONS.length;
  const progress =
    phase === 'intro' ? 0.02 : phase === 'result' ? 1 : (index + 1) / total;

  const tiles = useMemo(() => {
    if (!question) return [];
    return question.options.map((o) => ({
      id: o.id,
      label: o.label,
      emoji: optionEmoji(`${question.id}-${o.id}`)
    }));
  }, [question]);

  const toggle = (optionId: string) => {
    if (!question) return;
    if (optionId === 'e') {
      setSelected((prev) => (prev.includes('e') ? [] : ['e']));
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((id) => id !== 'e');
      if (withoutNone.includes(optionId)) {
        return withoutNone.filter((id) => id !== optionId);
      }
      if (withoutNone.length >= question.maxSelect) {
        return [...withoutNone.slice(1), optionId];
      }
      return [...withoutNone, optionId];
    });
  };

  const finishWithAnswers = async (finalAnswers: PersonalityAnswer[]) => {
    const disclosure = toDisclosureContextForQuiz(await getDisclosure());
    setResult(scorePersonality(finalAnswers, disclosure));
    setPhase('result');
    lastStep.current = 'result';
  };

  const onContinue = async () => {
    if (!question || selected.length === 0) return;
    const nextAnswers: PersonalityAnswer[] = [
      ...answers,
      {
        questionId: question.id,
        optionIds: [...selected],
        explain: explain.trim() || undefined
      }
    ];
    trackProduct('quiz_question_answered', {
      quiz_id: 'personality',
      question_id: question.id,
      option_count: selected.length,
      explained: Boolean(explain.trim()),
      is_inserted: false
    });
    trackFlowStep('your_vibe', question.id, { quiz_id: 'personality' });
    setAnswers(nextAnswers);
    setSelected([]);
    setExplain('');
    if (index + 1 >= total) {
      await finishWithAnswers(nextAnswers);
      return;
    }
    setIndex((i) => i + 1);
    lastStep.current = PERSONALITY_QUESTIONS[index + 1]?.id ?? 'take';
  };

  const onDoneResult = async () => {
    if (!result) return;
    completedRef.current = true;
    const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
    await onComplete(result);
    trackFlowCompleted('your_vibe', ms, { quiz_id: 'personality' });
    trackProduct('quiz_completed', {
      quiz_id: 'personality',
      quiz_version: 1,
      time_to_complete_ms: ms,
      questions_answered: total
    });
    dismissSurface('your_vibe');
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
      accent="amber"
      ids={SHELL_IDS}
      phase={phase}
      progress={progress}
      onClose={onClose}
      onBack={onBack}
      intro={{
        headline: 'How do you move?',
        title: PERSONALITY_INSTRUCTIONS.title,
        lead: PERSONALITY_INSTRUCTIONS.lead,
        rules: PERSONALITY_INSTRUCTIONS.rules.slice(0, 3),
        emoji: '✨'
      }}
      onStart={() => {
        setPhase('take');
        lastStep.current = PERSONALITY_QUESTIONS[0]?.id ?? 'take';
        trackFlowStep('your_vibe', 'take_start', { quiz_id: 'personality' });
      }}
      stepLabel={`${index + 1} of ${total}`}
      prompt={question?.prompt ?? ''}
      questionEmoji="✨"
      options={tiles}
      selected={selected}
      maxSelect={question?.maxSelect ?? 2}
      onToggle={(id) => toggle(id)}
      explain={explain}
      onExplainChange={setExplain}
      continueDisabled={selected.length === 0}
      continueLabel={index + 1 >= total ? 'See my vibe' : 'Continue'}
      onContinue={() => void onContinue()}
      result={result ? <ResultSummary result={result} /> : null}
      onDoneResult={() => void onDoneResult()}
    />
  );
}

function ResultSummary({ result }: { result: PersonalityScoreResult }) {
  return (
    <View className="flex-1 justify-center">
      <Text accessibilityRole="header" className="font-pixel text-[28px] text-ink">
        Your Vibe
      </Text>
      <Text className="mt-2 font-sans text-[14px] leading-snug text-ink-soft">
        Private dials. Matches never see answers.
      </Text>
      <View className="mt-4 gap-2">
        {result.traits.slice(0, 6).map((t, i) => (
          <View
            key={t.key}
            className="border-2 border-ink bg-amber px-3 py-2.5"
            style={{
              borderTopLeftRadius: i % 2 === 0 ? 22 : 12,
              borderTopRightRadius: i % 2 === 0 ? 12 : 22,
              borderBottomRightRadius: i % 2 === 0 ? 22 : 12,
              borderBottomLeftRadius: i % 2 === 0 ? 12 : 22
            }}
          >
            <View className="flex-row items-baseline justify-between">
              <Text className="font-sans-b text-[14px] text-onaccent">
                {labelFor(t.key)}
              </Text>
              <Text className="font-sans-sb text-[11px] text-onaccent/80">
                {Math.round(t.score * 100)}
                {t.matchable ? '' : ' · private'}
              </Text>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-canvas/50">
              <View
                className="h-full rounded-full bg-ink"
                style={{ width: `${Math.round(t.score * 100)}%` }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function labelFor(key: string): string {
  switch (key) {
    case 'sociability':
      return 'Sociability';
    case 'assertiveness':
      return 'Assertiveness';
    case 'agreeableness':
      return 'Agreeableness';
    case 'conscientiousness':
      return 'Conscientiousness';
    case 'openness':
      return 'Openness';
    case 'neuroticism':
      return 'Emotional sensitivity';
    default:
      return key;
  }
}

export default PersonalityFlow;
