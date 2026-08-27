// ============================================
// WHAT THIS FILE DOES (plain English):
// Take The Friend Zone with Bridger flair: blue wash, fun emoji tiles, burst
// on tap, note behind a chip, no scrolling. Scores anxiety + avoidance.
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
  THE_FRIEND_ZONE
} from '@bridger/shared';
import { getDisclosure } from '../../../data/discover';
import { toDisclosureContextForQuiz } from '../_shared/disclosure-context';
import { optionEmoji } from '../_shared/option-emoji';
import { QuizTakeShell } from '../_shared/QuizTakeShell';
import {
  ATTACHMENT_INSTRUCTIONS,
  ATTACHMENT_QUESTIONS
} from './questions';
import {
  scoreAttachment,
  type AttachmentAnswer,
  type AttachmentScoreResult
} from './score';

type Props = {
  open: boolean;
  parentScreen?: string;
  onClose: () => void;
  onComplete: (result: AttachmentScoreResult) => void | Promise<void>;
};

const SHELL_IDS = {
  back: THE_FRIEND_ZONE.chrome.back,
  introBody: THE_FRIEND_ZONE.intro.body,
  introStart: THE_FRIEND_ZONE.intro.start,
  option: THE_FRIEND_ZONE.take.option,
  explain: THE_FRIEND_ZONE.take.explain,
  next: THE_FRIEND_ZONE.take.next,
  optionsMore: THE_FRIEND_ZONE.take.options_more,
  noteToggle: THE_FRIEND_ZONE.take.note_toggle,
  resultBody: THE_FRIEND_ZONE.result.body,
  resultDone: THE_FRIEND_ZONE.result.done
};

export function AttachmentFlow({
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
  const [answers, setAnswers] = useState<AttachmentAnswer[]>([]);
  const [result, setResult] = useState<AttachmentScoreResult | null>(null);

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
    openSurface('the_friend_zone', parentScreen);
    trackFlowStarted('the_friend_zone', { quiz_id: 'attachment' });
    trackProduct('quiz_started', { quiz_id: 'attachment', quiz_version: 1 });
    return () => {
      if (!completedRef.current) {
        const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
        trackFlowAbandoned('the_friend_zone', ms, lastStep.current, {
          quiz_id: 'attachment'
        });
        trackProduct('quiz_abandoned', {
          quiz_id: 'attachment',
          last_question_id: lastStep.current,
          time_spent_ms: ms
        });
        dismissSurface('the_friend_zone');
      }
    };
  }, [open, parentScreen]);

  const question = ATTACHMENT_QUESTIONS[index];
  const total = ATTACHMENT_QUESTIONS.length;
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

  const shortPrompt = (question?.prompt ?? '').replace(/\n+/g, ' ');

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

  const finishWithAnswers = async (finalAnswers: AttachmentAnswer[]) => {
    const disclosure = toDisclosureContextForQuiz(await getDisclosure());
    setResult(scoreAttachment(finalAnswers, disclosure));
    setPhase('result');
    lastStep.current = 'result';
  };

  const onContinue = async () => {
    if (!question || selected.length === 0) return;
    const nextAnswers: AttachmentAnswer[] = [
      ...answers,
      {
        questionId: question.id,
        optionIds: [...selected],
        explain: explain.trim() || undefined
      }
    ];
    trackProduct('quiz_question_answered', {
      quiz_id: 'attachment',
      question_id: question.id,
      option_count: selected.length,
      explained: Boolean(explain.trim()),
      is_inserted: false
    });
    trackFlowStep('the_friend_zone', question.id, { quiz_id: 'attachment' });
    setAnswers(nextAnswers);
    setSelected([]);
    setExplain('');
    if (index + 1 >= total) {
      await finishWithAnswers(nextAnswers);
      return;
    }
    setIndex((i) => i + 1);
    lastStep.current = ATTACHMENT_QUESTIONS[index + 1]?.id ?? 'take';
  };

  const onDoneResult = async () => {
    if (!result) return;
    completedRef.current = true;
    const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
    await onComplete(result);
    trackFlowCompleted('the_friend_zone', ms, { quiz_id: 'attachment' });
    trackProduct('quiz_completed', {
      quiz_id: 'attachment',
      quiz_version: 1,
      time_to_complete_ms: ms,
      questions_answered: total
    });
    dismissSurface('the_friend_zone');
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
      accent="blue"
      ids={SHELL_IDS}
      phase={phase}
      progress={progress}
      onClose={onClose}
      onBack={onBack}
      intro={{
        headline: ATTACHMENT_INSTRUCTIONS.headline,
        title: ATTACHMENT_INSTRUCTIONS.title,
        lead: ATTACHMENT_INSTRUCTIONS.lead,
        rules: ATTACHMENT_INSTRUCTIONS.rules,
        emoji: '💙'
      }}
      onStart={() => {
        setPhase('take');
        lastStep.current = 'a01';
        trackFlowStep('the_friend_zone', 'take_start', {
          quiz_id: 'attachment'
        });
      }}
      stepLabel={`${index + 1} of ${total}`}
      prompt={shortPrompt}
      questionEmoji="🤝"
      options={tiles}
      selected={selected}
      maxSelect={question?.maxSelect ?? 2}
      onToggle={(id) => toggle(id)}
      explain={explain}
      onExplainChange={setExplain}
      continueDisabled={selected.length === 0}
      continueLabel={index + 1 >= total ? 'See my pattern' : 'Continue'}
      onContinue={() => void onContinue()}
      result={result ? <ResultSummary result={result} /> : null}
      onDoneResult={() => void onDoneResult()}
    />
  );
}

function ResultSummary({ result }: { result: AttachmentScoreResult }) {
  return (
    <View className="flex-1 justify-center">
      <Text accessibilityRole="header" className="font-pixel text-[28px] text-ink">
        {result.styleTitle}
      </Text>
      <Text className="mt-2 font-sans text-[15px] leading-snug text-ink-soft">
        {result.styleBlurb}
      </Text>
      <View className="mt-5 gap-2">
        {(
          [
            ['Closeness comfort', result.bands.closenessComfort],
            ['Independence comfort', result.bands.independenceComfort],
            ['Uncertainty', result.bands.uncertaintySensitivity],
            ['Rejection sensitivity', result.bands.rejectionSensitivity]
          ] as const
        ).map(([label, value], i) => (
          <View
            key={label}
            className="flex-row items-center justify-between border-2 border-ink bg-blue px-4 py-3"
            style={{
              borderTopLeftRadius: i % 2 === 0 ? 24 : 12,
              borderTopRightRadius: i % 2 === 0 ? 12 : 24,
              borderBottomRightRadius: i % 2 === 0 ? 24 : 12,
              borderBottomLeftRadius: i % 2 === 0 ? 12 : 24
            }}
          >
            <Text className="font-sans-b text-[14px] text-white">{label}</Text>
            <Text className="font-sans-b text-[13px] text-white">{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default AttachmentFlow;
