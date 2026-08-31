// ============================================
// WHAT THIS FILE DOES (plain English):
// The "What J name are you..." take flow. It opens on a yellow commentary
// beat, then the first Part 1 question. Take screens use the geometric brutalist
// look: navy question slab, each answer its own accent color, emoji shower
// on tap. The explode lives above the quiz so it keeps falling after we flip
// to commentary. Then it walks the four parts in quiz.json: branching Part 1,
// rapid-fire, top 3 friends, then
// Part 4. Then it reveals your percentage and J-name. Scoring is engine.ts
// (no AI, same taps always score the same).
//
// RE-ENTRY: if you already took it this session, opening it again shows your
// saved result with a quiet "Retake for fun" link, so your real result stays
// the one that counts.
// Analytics: quiz_started / quiz_question_answered / quiz_completed /
// quiz_abandoned (never the answer text). Full element-level taxonomy ids are a
// follow-up pass (see ANALYTICS-TAXONOMY.md).
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { QUIZ as QUIZ_IDS, trackProduct } from '@bridger/shared';
import {
  ButtonPrimary,
  ButtonSecondary,
  Screen,
  ScreenHeader,
  withAnalyticsPress
} from '@bridger/ui';
import { EndQuizSheet } from '../_shared/EndQuizSheet';
import { MANIFEST } from './manifest';
import {
  BrutalistLoading,
  BrutalistMessage,
  BrutalistTake,
  BRUTAL_NAVY,
  EmojiBurstLayer,
  type LiveBurst
} from './BrutalistTake';
import { __demoSetQuizResult } from '../../data/quiz';
import quizRaw from './quiz.json';
import { scoreRun, topJNames, type QuizRun } from './engine';
import { ResultCardStage } from './ResultCardStage';
import { JnameLeaderboard } from './JnameLeaderboard';
import { QUIZ_OPTION_IMAGES } from './images';
import { StrokeText } from './StrokeText';
import { POSTER, POSTER_FONT } from './result-theme';
import { buildResultLink, captureCard, saveImageToPhotos, shareImage, shareLink } from './share';
import { fetchJnameLeaderboard, fetchJnameMyResult, getJnameShareLink, saveJnameResult } from '../../lib/jname-api';
import { QUIZ as DEMO_QUIZ } from '../../data/fixtures/catalog';
import { isDemoMode } from '../../lib/demo';
import type { LeaderboardBucket } from './JnameLeaderboard';

// THIS SECTION DOES: describe just the parts of quiz.json this screen reads.
type Answer = {
  id: string;
  text: string;
  style?: string;
  response?: string;
  next?: string;
  image?: string;
  emojis?: string[];
};
type FlowItem = { id: string; type: string; text?: string; answers?: Answer[] };
type RapidQ = {
  id: string;
  text: string;
  response?: string;
  yes_emojis?: string[];
  no_emojis?: string[];
};
type FriendOption = { id: string; label: string; subtitle?: string; emojis?: string[] };
type Part4Answer = { text: string; emojis?: string[] };
type Part4Q = { id: string; text: string; answers: Part4Answer[] };

const QUIZ = quizRaw as unknown as {
  flow: FlowItem[];
  rapid_fire: RapidQ[];
  part3: {
    intro: { text: string };
    best_friends: { text: string; options: FriendOption[] };
    response: { text: string };
    next_instruction: { text: string };
  };
  part4: { questions: Part4Q[] };
  result_flow: Array<{ text: string; display?: string }>;
};

const FLOW = QUIZ.flow;
const FLOW_IDS = FLOW.map((f) => f.id);
const FIRST_Q = FLOW.find((f) => f.type === 'question');

// THIS SECTION DOES: remember this session's result so re-opening the quiz
// shows it (with a quiet retake) instead of starting over.
let sessionResult: { jName: string; percent: number } | null = null;

type Phase =
  | 'intro'
  | 'part1'
  | 'rapidIntro'
  | 'rapid'
  | 'part3Intro'
  | 'part3Select'
  | 'part3Response'
  | 'part3Next'
  | 'part4'
  | 'reveal'
  | 'result';

export default function WhatJNameQuiz() {
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const completedRef = useRef(false);
  // The card View we snapshot into a PNG for saving / story sharing.
  const cardRef = useRef<View>(null);

  // THIS SECTION DOES: hold every answer we collect, in the engine's shape.
  const runRef = useRef<QuizRun>({ part1: [], rapidFire: [], selectedBestFriends: [], part4: [] });

  const [phase, setPhase] = useState<Phase>(sessionResult ? 'result' : 'intro');
  const [currentQId, setCurrentQId] = useState<string>(FIRST_Q?.id ?? '');
  const [rapidIndex, setRapidIndex] = useState(0);
  const [part4Index, setPart4Index] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [revealStep, setRevealStep] = useState(0);
  const [result, setResult] = useState(sessionResult);
  const [board, setBoard] = useState<LeaderboardBucket[]>([]);
  // Where the "Download PNG" button is up to, so we can say if it worked.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  // A transient quip shown after an answer, with what to do on Continue.
  const [quip, setQuip] = useState<{ text: string; then: () => void } | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  // Emoji showers live here so they keep falling after we leave the tile screen.
  const [bursts, setBursts] = useState<LiveBurst[]>([]);
  // True while we check Supabase for a prior result on cold open.
  const [hydrating, setHydrating] = useState(!sessionResult && !isDemoMode());

  function spawnBurst(emojis: readonly string[], origin: { x: number; y: number }) {
    setBursts((prev) => [
      ...prev,
      { key: Date.now() + Math.random(), emojis, origin }
    ]);
  }

  // THIS SECTION DOES: on open, load a saved result from the server so a cold
  // start still shows your card (not just this JS session's memory).
  useEffect(() => {
    if (sessionResult || isDemoMode()) {
      setHydrating(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const saved = await fetchJnameMyResult();
      if (cancelled) return;
      if (saved?.jName) {
        const res = { jName: saved.jName, percent: saved.percent };
        sessionResult = res;
        setResult(res);
        setPhase('result');
        const live = await fetchJnameLeaderboard();
        if (!cancelled && live?.buckets) setBoard(live.buckets);
      }
      setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // THIS SECTION DOES: load the friend board whenever we land on a saved result
  // (re-opening the quiz) so "your versions" is ready without re-taking.
  useEffect(() => {
    if (!sessionResult) return;
    void (async () => {
      if (isDemoMode()) {
        setBoard(
          DEMO_QUIZ.results
            .filter((r) => r.friendIds.length > 0)
            .map((r) => ({
              jName: r.label,
              friendIds: [...r.friendIds],
              friends: r.friendIds.map((userId) => ({
                userId,
                percent: 80,
                compatibilityPercent: 85
              }))
            }))
            .sort((a, b) => b.friendIds.length - a.friendIds.length)
        );
        return;
      }
      const live = await fetchJnameLeaderboard();
      if (live?.buckets) setBoard(live.buckets);
    })();
  }, []);

  // --- START + ABANDON tracking ---
  useEffect(() => {
    if (hydrating) return;
    if (!sessionResult) {
      trackProduct('quiz_started', { surface: 'quiz', method: 'tap' });
      startedAt.current = Date.now();
    }
    return () => {
      if (!completedRef.current && !sessionResult) {
        trackProduct('quiz_abandoned', {
          surface: 'quiz',
          time_to_complete_ms: Date.now() - startedAt.current,
          count: runRef.current.part1.length + runRef.current.part4.length
        });
      }
    };
  }, [hydrating]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  // X mid-quiz asks first. Finished result / reveal just leaves.
  function requestLeave() {
    if (completedRef.current) {
      close();
      return;
    }
    setLeaveOpen(true);
  }

  function stayInQuiz() {
    setLeaveOpen(false);
  }

  function endQuiz() {
    setLeaveOpen(false);
    close();
  }

  // Phone back button uses the same confirm, not an instant exit.
  // Web has no hardware back, and BackHandler throws a toast there.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (leaveOpen) {
        stayInQuiz();
        return true;
      }
      if (!completedRef.current) {
        setLeaveOpen(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [leaveOpen]);

  function withLeaveAsk(node: React.ReactElement) {
    return (
      <View style={{ flex: 1 }}>
        {node}
        <EmojiBurstLayer
          bursts={bursts}
          onDone={(key) => setBursts((prev) => prev.filter((b) => b.key !== key))}
        />
        <EndQuizSheet open={leaveOpen} onStay={stayInQuiz} onEnd={endQuiz} />
      </View>
    );
  }

  // THIS SECTION DOES: figure out where a Part 1 answer sends you next. Some
  // answers jump to a specific question ("next"); otherwise you go to the next
  // question in the list. Hitting the rapid-fire intro ends Part 1.
  function goAfterPart1(current: FlowItem, answer: Answer) {
    const nextId = answer.next ?? FLOW_IDS[FLOW_IDS.indexOf(current.id) + 1];
    const nextItem = FLOW.find((f) => f.id === nextId);
    if (!nextItem || nextItem.type !== 'question') {
      setPhase('rapidIntro');
      return;
    }
    setCurrentQId(nextItem.id);
  }

  function answerPart1(current: FlowItem, answer: Answer) {
    runRef.current.part1.push({ questionId: current.id, answerId: answer.id });
    trackProduct('quiz_question_answered', { surface: 'quiz', count: runRef.current.part1.length });
    const advance = () => {
      setQuip(null);
      goAfterPart1(current, answer);
    };
    if (answer.response) setQuip({ text: answer.response, then: advance });
    else advance();
  }

  function answerRapid(yes: boolean) {
    const q = QUIZ.rapid_fire[rapidIndex];
    runRef.current.rapidFire.push({ id: q.id, yes });
    trackProduct('quiz_question_answered', { surface: 'quiz', count: runRef.current.rapidFire.length });
    const advance = () => {
      setQuip(null);
      if (rapidIndex + 1 < QUIZ.rapid_fire.length) setRapidIndex((i) => i + 1);
      else setPhase('part3Intro');
    };
    if (q.response) setQuip({ text: q.response, then: advance });
    else advance();
  }

  function togglePick(id: string) {
    setPicks((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 3) return prev; // exactly 3 allowed
      return [...prev, id];
    });
  }

  function answerPart4(index: number) {
    const q = QUIZ.part4.questions[part4Index];
    runRef.current.part4.push({ questionId: q.id, answerIndex: index });
    trackProduct('quiz_question_answered', { surface: 'quiz', count: runRef.current.part4.length });
    if (part4Index + 1 < QUIZ.part4.questions.length) setPart4Index((i) => i + 1);
    else finish();
  }

  // THIS SECTION DOES: score everything and move into the reveal.
  function finish() {
    const out = scoreRun(runRef.current);
    const tops = topJNames(out.j_name_scores, 3);
    const res = { jName: out.j_name, percent: out.j_percentage };
    setResult(res);
    sessionResult = res;
    __demoSetQuizResult(out.j_name);
    // Save the result to the server (skipped in demo) so it can power sharing,
    // the leaderboard, and notifications. Fire-and-forget; never blocks the UI.
    void saveJnameResult({
      jName: out.j_name,
      percent: out.j_percentage,
      topNames: tops
    });
    // Load the "your version of X" board (demo uses fixture friend buckets).
    void (async () => {
      if (isDemoMode()) {
        setBoard(
          DEMO_QUIZ.results
            .filter((r) => r.friendIds.length > 0)
            .map((r) => ({
              jName: r.label,
              friendIds: [...r.friendIds],
              friends: r.friendIds.map((userId) => ({
                userId,
                percent: 80,
                compatibilityPercent: 85
              }))
            }))
            .sort((a, b) => b.friendIds.length - a.friendIds.length)
        );
        return;
      }
      const live = await fetchJnameLeaderboard();
      if (live?.buckets) setBoard(live.buckets);
    })();
    completedRef.current = true;
    trackProduct('quiz_completed', {
      surface: 'quiz',
      time_to_complete_ms: Date.now() - startedAt.current
    });
    setRevealStep(0);
    setPhase('reveal');
  }

  function retake() {
    runRef.current = { part1: [], rapidFire: [], selectedBestFriends: [], part4: [] };
    setPicks([]);
    setRapidIndex(0);
    setPart4Index(0);
    setCurrentQId(FIRST_Q?.id ?? '');
    setPhase('intro');
    trackProduct('quiz_started', { surface: 'quiz', method: 'retake' });
    startedAt.current = Date.now();
    completedRef.current = false;
  }

  // ============================================
  // RENDER
  // ============================================

  // Opening beat: yellow commentary, then the gender question.
  if (hydrating) {
    return withLeaveAsk(<BrutalistLoading onBack={requestLeave} />);
  }

  if (phase === 'intro') {
    const intro = FLOW.find((f) => f.id === 'intro');
    return withLeaveAsk(
      <BrutalistMessage
        title={MANIFEST.title}
        text={intro?.text ?? 'Ok... are you ready to come to terms with your J-ness?'}
        onBack={requestLeave}
        onNext={() => setPhase('part1')}
      />
    );
  }

  // A quip overlay takes over the screen until they tap Continue.
  if (quip) {
    return withLeaveAsk(
      <BrutalistMessage
        title={MANIFEST.title}
        text={quip.text}
        onBack={requestLeave}
        onNext={quip.then}
      />
    );
  }

  // --- PART 1: branching questions ---
  if (phase === 'part1') {
    const q = FLOW.find((f) => f.id === currentQId);
    if (!q || !q.answers) return withLeaveAsk(<BrutalistLoading onBack={requestLeave} />);
    return withLeaveAsk(
      <BrutalistTake
        key={q.id}
        title="Part 1"
        question={q.text ?? ''}
        options={q.answers.map((a) => ({
          key: a.id,
          label: a.text,
          image: a.image ? QUIZ_OPTION_IMAGES[a.image] : undefined,
          emojis: a.emojis
        }))}
        onBack={requestLeave}
        onBurst={spawnBurst}
        onSelect={(key) => {
          const a = q.answers?.find((x) => x.id === key);
          if (a) answerPart1(q, a);
        }}
      />
    );
  }

  // --- RAPID FIRE intro + round ---
  if (phase === 'rapidIntro') {
    const intro = FLOW.find((f) => f.id === 'rapid_fire_intro');
    return withLeaveAsk(
      <BrutalistMessage
        title="Part 2"
        text={intro?.text ?? 'Rapid fire.'}
        onBack={requestLeave}
        onNext={() => {
          setRapidIndex(0);
          setPhase('rapid');
        }}
      />
    );
  }

  if (phase === 'rapid') {
    const q = QUIZ.rapid_fire[rapidIndex];
    return withLeaveAsk(
      <BrutalistTake
        key={q.id}
        title="Rapid fire"
        question={q.text}
        options={[
          { key: 'yes', label: 'Yes', emojis: q.yes_emojis },
          { key: 'no', label: 'No', emojis: q.no_emojis }
        ]}
        colorShift={rapidIndex * 2}
        onBack={requestLeave}
        onBurst={spawnBurst}
        onSelect={(key) => answerRapid(key === 'yes')}
      />
    );
  }

  // --- PART 3: pick your top 3 friends ---
  if (phase === 'part3Intro') {
    return withLeaveAsk(
      <BrutalistMessage
        title="Part 3"
        text={QUIZ.part3.intro.text}
        onBack={requestLeave}
        onNext={() => setPhase('part3Select')}
      />
    );
  }

  if (phase === 'part3Select') {
    return withLeaveAsk(
      <BrutalistTake
        title="Part 3"
        question={QUIZ.part3.best_friends.text}
        options={QUIZ.part3.best_friends.options.map((o) => ({
          key: o.id,
          label: o.label,
          sub: o.subtitle,
          selected: picks.includes(o.id),
          emojis: o.emojis
        }))}
        onBack={requestLeave}
        onBurst={spawnBurst}
        onSelect={togglePick}
        footer={
          <Pressable
            onPress={withAnalyticsPress(QUIZ_IDS.take.next, () => {
              if (picks.length !== 3) return;
              runRef.current.selectedBestFriends = [...picks];
              setPhase('part3Response');
            })}
            disabled={picks.length !== 3}
            accessibilityRole="button"
            accessibilityLabel="Confirm your three friends"
            accessibilityState={{ disabled: picks.length !== 3 }}
            className="min-h-[80px] items-center justify-center active:opacity-90"
            style={{
              backgroundColor: picks.length === 3 ? BRUTAL_NAVY : '#9AA3B8',
              flexShrink: 0
            }}
          >
            <Text className="font-sans-b text-[20px] text-white">
              {picks.length === 3 ? 'Lock in my 3' : `Pick ${3 - picks.length} more`}
            </Text>
          </Pressable>
        }
      />
    );
  }

  if (phase === 'part3Response') {
    return withLeaveAsk(
      <BrutalistMessage
        title="Part 3"
        text={QUIZ.part3.response.text}
        onBack={requestLeave}
        onNext={() => setPhase('part3Next')}
      />
    );
  }

  if (phase === 'part3Next') {
    return withLeaveAsk(
      <BrutalistMessage
        title="Part 4"
        text={QUIZ.part3.next_instruction.text}
        onBack={requestLeave}
        onNext={() => {
          setPart4Index(0);
          setPhase('part4');
        }}
      />
    );
  }

  // --- PART 4: the 8 J-name questions ---
  if (phase === 'part4') {
    const q = QUIZ.part4.questions[part4Index];
    return withLeaveAsk(
      <BrutalistTake
        key={q.id}
        title={`Part 4 · ${part4Index + 1}/${QUIZ.part4.questions.length}`}
        question={q.text}
        colorShift={part4Index * 2}
        options={q.answers.map((a, i) => ({
          key: String(i),
          label: a.text,
          emojis: a.emojis
        }))}
        onBack={requestLeave}
        onBurst={spawnBurst}
        onSelect={(key) => answerPart4(Number(key))}
      />
    );
  }

  // --- REVEAL: interstitials, then percentage, then name ---
  if (phase === 'reveal' && result) {
    const steps = QUIZ.result_flow;
    const step = steps[revealStep];
    const last = revealStep >= steps.length - 1;
    return withLeaveAsk(
      <BrutalistMessage
        title="Results"
        text={step?.text ?? ''}
        onBack={close}
        onNext={() => (last ? setPhase('result') : setRevealStep((s) => s + 1))}
        nextLabel={last ? 'See my result' : 'Next'}
        display={
          step?.display === 'j_percentage' ? (
            <Text
              className="mt-6 text-center font-sans-b text-[64px] leading-none"
              style={{ color: BRUTAL_NAVY }}
            >
              {result.percent}%
            </Text>
          ) : step?.display === 'j_name' ? (
            // THIS SECTION DOES: shout the J-name in big block poster letters
            <View className="mt-8 items-center px-2">
              <StrokeText
                stroke={6}
                strokeColor={POSTER.cream}
                center
                style={{
                  fontFamily: POSTER_FONT.display,
                  fontSize: result.jName.length <= 4 ? 96 : result.jName.length === 5 ? 84 : 72,
                  lineHeight: result.jName.length <= 4 ? 88 : result.jName.length === 5 ? 78 : 68,
                  letterSpacing: 2,
                  color: BRUTAL_NAVY,
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
              >
                {result.jName.toUpperCase()}
              </StrokeText>
            </View>
          ) : null
        }
      />
    );
  }

  // --- RESULT: the big card (+ share tools + quiet retake) ---
  if (phase === 'result' && result) {
    // DOWNLOAD PNG: snapshot the poster exactly as it looks, then write that
    // picture into the phone's photo library so it can be posted anywhere.
    // We say out loud whether it worked, because saving is silent otherwise.
    const onSaveImage = async () => {
      setSaveState('saving');
      const uri = await captureCard(cardRef);
      if (!uri) {
        setSaveState('failed');
        return;
      }
      const ok = await saveImageToPhotos(uri);
      setSaveState(ok ? 'saved' : 'failed');
      if (ok) trackProduct('quiz_shared', { surface: 'quiz', method: 'save_image' });
    };
    // Snapshot the card, then open the share sheet (Instagram/Snap/Messages).
    const onShareImage = async () => {
      const uri = await captureCard(cardRef);
      if (!uri) return;
      const ok = await shareImage(uri);
      if (ok) trackProduct('quiz_shared', { surface: 'quiz', method: 'image' });
    };
    // Share just the link so a friend can take it and find their version of you.
    // Prefer the server's stable link (remembers who shared it); if that isn't
    // available (demo / offline) fall back to a plain link.
    const onShareLink = async () => {
      const server = await getJnameShareLink();
      const url = server?.url ?? buildResultLink(result.jName);
      const ok = await shareLink(url, `I'm ${result.jName} on Bridger. Which J are you?`);
      if (ok) trackProduct('quiz_shared', { surface: 'quiz', method: 'link' });
    };

    return (
      <Screen tone="plain" className="bg-white">
        <ScreenHeader title="Your result" onBack={close} />
        <ScrollView contentContainerClassName="px-5 pb-10">
          {/* The poster. The stage shrinks it to fit the phone but hands us the
              real, full-size view underneath so the saved PNG stays crisp. */}
          <View className="mt-2">
            <ResultCardStage
              jName={result.jName}
              percent={result.percent}
              captureRef={cardRef}
            />
          </View>

          {/* Save the picture, share it to a story, or share the link. */}
          <View className="mt-5 gap-2.5">
            <ButtonPrimary full onPress={() => void onShareImage()} accessibilityLabel="Share to a story">
              Share to story
            </ButtonPrimary>
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <ButtonSecondary
                  full
                  onPress={() => void onSaveImage()}
                  accessibilityLabel="Download this card as a PNG to your photos"
                >
                  {saveState === 'saving' ? 'Saving…' : 'Download PNG'}
                </ButtonSecondary>
              </View>
              <View className="flex-1">
                <ButtonSecondary full onPress={() => void onShareLink()} accessibilityLabel="Share the quiz link">
                  Share link
                </ButtonSecondary>
              </View>
            </View>
            {/* ACCESSIBILITY: say what happened out loud, since a silent save
                looks like a broken button to anyone using a screen reader. */}
            {saveState === 'saved' || saveState === 'failed' ? (
              <Text
                accessibilityLiveRegion="polite"
                className="text-center font-sans-sb text-[12px]"
                style={{ color: saveState === 'saved' ? BRUTAL_NAVY : '#B3261E' }}
              >
                {saveState === 'saved'
                  ? 'Saved to your photos.'
                  : "Couldn't save. Allow photo access to add pictures, then try again."}
              </Text>
            ) : null}
          </View>

          {/* Friends grouped by the J-name they got ("your version of Jake"). */}
          <View className="mt-8">
            <JnameLeaderboard buckets={board} />
          </View>

          <View className="mt-5">
            <ButtonSecondary full onPress={close} accessibilityLabel="Done">
              Done
            </ButtonSecondary>
          </View>

          {/* Quiet, on purpose: the real result above stays the one that counts. */}
          <Pressable onPress={retake} accessibilityRole="button" className="mt-4 self-center py-2">
            <Text className="font-sans-sb text-[12px] text-ink-mute underline">Retake for fun</Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  return withLeaveAsk(<BrutalistLoading onBack={requestLeave} />);
}
