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
// RE-ENTRY: if you already finished once, opening it again shows your first
// (canonical) result. Home and Profile say "See your result." A quiet
// "Retake for fun" starts a second run that stays on this phone only and
// never overwrites friend matching. You can flip First / Fun on the result.
// SHARE LINK: a friend can take this with no account. Their first result stays
// on the phone until they sign up. Signup adds the sharer as a friend so both
// can see the duo result.
// Analytics: quiz_started / quiz_question_answered / quiz_completed /
// quiz_abandoned (never the answer text).
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jnameCompatibilityPercent, QUIZ as QUIZ_IDS, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader,
  SegmentedTabs,
  withAnalyticsPress
} from '@bridger/ui';
import { EndQuizSheet } from '../_shared/EndQuizSheet';
import { MANIFEST } from './manifest';
import { clearJnameDraft, loadJnameDraft, saveJnameDraft } from './draft';
import { loadJnameFunResult, saveJnameFunResult } from './fun-result';
import {
  loadJnameGuestResult,
  saveJnameGuestResult
} from './guest-result';
import { useAuth } from '../../providers/auth-provider';
import { getAnonRef, peekPendingReferral, setPendingReferral } from '../../lib/jname-referral';
import { loadPeople } from '../../lib/people-cache';
import {
  BrutalistLoading,
  BrutalistMessage,
  BrutalistTake,
  BRUTAL_NAVY,
  EmojiBurstLayer,
  type LiveBurst
} from './BrutalistTake';
import {
  __demoSetQuizResult,
  getCanonicalJnamePreview,
  setLiveJnameSessionResult
} from '../../data/quiz';
import quizRaw from './quiz.json';
import { scoreRun, topJNames, type QuizRun } from './engine';
import { ResultCardStage } from './ResultCardStage';
import { JnameLeaderboard } from './JnameLeaderboard';
import { QUIZ_OPTION_IMAGES } from './images';
import { StrokeText } from './StrokeText';
import { POSTER, POSTER_FONT } from './result-theme';
import { ShareInviteLink } from './ShareInviteLink';
import { captureCard, saveImageToPhotos, shareLink, visibleShareUrl } from './share';
import {
  fetchJnameLeaderboard,
  fetchJnameMyResult,
  fetchJnameSharedView,
  getJnameShareLink,
  resolveJnameReferral,
  saveJnameResult
} from '../../lib/jname-api';
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

// THIS SECTION DOES: remember the first (canonical) result this session so
// re-opening jumps to the result, not a new take.
let sessionCanonical: { jName: string; percent: number } | null = null;

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

type ShareFriend = {
  token: string;
  jName: string;
  percent: number;
  firstName?: string;
};

export default function WhatJNameQuiz() {
  const router = useRouter();
  const { session } = useAuth();
  const signedIn = Boolean(session?.user?.id);
  const params = useLocalSearchParams<{
    retake?: string | string[];
    share?: string | string[];
  }>();
  const wantRetake =
    (Array.isArray(params.retake) ? params.retake[0] : params.retake) === '1';
  const shareFromRoute = Array.isArray(params.share) ? params.share[0] : params.share;
  const startedAt = useRef(Date.now());
  const completedRef = useRef(false);
  // True while this take is a fun retake (do not write the server result).
  const funRunRef = useRef(false);
  const retakeFromRouteRef = useRef(false);
  // The card View we snapshot into a PNG for saving / story sharing.
  const cardRef = useRef<View>(null);

  // THIS SECTION DOES: hold every answer we collect, in the engine's shape.
  const runRef = useRef<QuizRun>({ part1: [], rapidFire: [], selectedBestFriends: [], part4: [] });

  const [phase, setPhase] = useState<Phase>(sessionCanonical ? 'result' : 'intro');
  const [currentQId, setCurrentQId] = useState<string>(FIRST_Q?.id ?? '');
  const [rapidIndex, setRapidIndex] = useState(0);
  const [part4Index, setPart4Index] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [revealStep, setRevealStep] = useState(0);
  const [result, setResult] = useState(sessionCanonical);
  const [canonicalResult, setCanonicalResult] = useState(sessionCanonical);
  const [funResult, setFunResult] = useState<{ jName: string; percent: number } | null>(
    null
  );
  const [viewing, setViewing] = useState<'first' | 'fun'>('first');
  const [shareFriend, setShareFriend] = useState<ShareFriend | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [addedFriend, setAddedFriend] = useState(false);
  const [shareInvite, setShareInvite] = useState<{ token: string; url: string } | null>(
    null
  );
  const [board, setBoard] = useState<LeaderboardBucket[]>([]);
  // Where the "Download PNG" button is up to, so we can say if it worked.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  // A transient quip shown after an answer, with what to do on Continue.
  const [quip, setQuip] = useState<{ text: string; then: () => void } | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  // Emoji showers live here so they keep falling after we leave the tile screen.
  const [bursts, setBursts] = useState<LiveBurst[]>([]);
  // True while we check Supabase for a prior result on cold open.
  const [hydrating, setHydrating] = useState(!sessionCanonical);

  function spawnBurst(emojis: readonly string[], origin: { x: number; y: number }) {
    setBursts((prev) => [
      ...prev,
      { key: Date.now() + Math.random(), emojis, origin }
    ]);
  }

  // THIS SECTION DOES: if they log out in this tab, forget the in-memory first
  // result so a friend using the same browser is not shown someone else's card.
  useEffect(() => {
    if (!signedIn) sessionCanonical = null;
  }, [signedIn]);

  // THIS SECTION DOES: on open, load the first result (session / server / demo)
  // and any fun retake on this phone. Resume a mid-take draft after that so a
  // fun retake never gets mistaken for a first finish.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fun = await loadJnameFunResult();
      if (cancelled) return;
      if (fun) setFunResult({ jName: fun.jName, percent: fun.percent });

      let canonical = sessionCanonical;
      if (!canonical) {
        if (isDemoMode()) canonical = getCanonicalJnamePreview();
        else if (signedIn) {
          const saved = await fetchJnameMyResult();
          if (cancelled) return;
          if (saved?.jName) canonical = { jName: saved.jName, percent: saved.percent };
        }
      }
      if (!canonical) {
        const guest = await loadJnameGuestResult();
        if (cancelled) return;
        if (guest?.jName) canonical = { jName: guest.jName, percent: guest.percent };
      }
      if (canonical) {
        sessionCanonical = canonical;
        setCanonicalResult(canonical);
      }

      const draft = await loadJnameDraft();
      if (cancelled) return;
      if (draft && draft.phase !== 'result' && draft.phase !== 'reveal') {
        if (canonical) funRunRef.current = true;
        runRef.current = draft.run;
        setCurrentQId(draft.currentQId || FIRST_Q?.id || '');
        setRapidIndex(draft.rapidIndex || 0);
        setPart4Index(draft.part4Index || 0);
        setPicks(draft.picks || []);
        setPhase(draft.phase as Phase);
        startedAt.current = draft.startedAt || Date.now();
        setHydrating(false);
        return;
      }

      if (canonical) {
        setResult(canonical);
        setPhase('result');
        if (!isDemoMode()) {
          const live = await fetchJnameLeaderboard();
          if (!cancelled && live?.buckets) setBoard(live.buckets);
        }
      }
      setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  // THIS SECTION DOES: remember the friend who shared the link, so a guest
  // take can show the duo teaser (you vs them) before an account exists.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const guest = await loadJnameGuestResult();
      const token =
        shareFromRoute || (await peekPendingReferral()) || guest?.shareToken;
      if (!token) return;
      await setPendingReferral(token);
      const anon = signedIn ? undefined : await getAnonRef();
      const view = await fetchJnameSharedView(token, anon);
      if (cancelled || !view) {
        if (!cancelled && guest?.sharerJName) {
          setShareFriend({
            token,
            jName: guest.sharerJName,
            percent: guest.sharerPercent ?? 0,
            firstName: guest.sharerFirstName
          });
        }
        return;
      }
      setShareFriend({
        token,
        jName: view.jName,
        percent: view.percent,
        firstName: view.sharerFirstName
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [shareFromRoute, signedIn]);

  // THIS SECTION DOES: keep a local draft while they are mid-take.
  useEffect(() => {
    if (hydrating || completedRef.current) return;
    if (phase === 'result' || phase === 'reveal' || phase === 'intro') return;
    void saveJnameDraft({
      phase,
      currentQId,
      rapidIndex,
      part4Index,
      picks,
      run: runRef.current,
      startedAt: startedAt.current
    });
  }, [phase, currentQId, rapidIndex, part4Index, picks, hydrating]);

  // THIS SECTION DOES: load the real invite URL once a first result exists, so
  // you can see / copy / preview the same link a friend would open.
  useEffect(() => {
    if (!signedIn || hydrating) return;
    if (!canonicalResult && !sessionCanonical) return;
    let cancelled = false;
    void (async () => {
      let server = await getJnameShareLink();
      if (!server?.token) {
        await new Promise((r) => setTimeout(r, 500));
        server = await getJnameShareLink();
      }
      if (cancelled || !server?.token) return;
      setShareInvite({
        token: server.token,
        url: visibleShareUrl(server.token, server.url)
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, hydrating, canonicalResult]);

  // THIS SECTION DOES: load the friend board whenever we land on a saved result
  // (re-opening the quiz) so "your versions" is ready without re-taking.
  useEffect(() => {
    if (!sessionCanonical) return;
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
    if (!sessionCanonical) {
      trackProduct('quiz_started', {
        surface: 'quiz',
        quiz_id: 'what-j-name',
        method: 'tap'
      });
      startedAt.current = Date.now();
    }
    return () => {
      if (!completedRef.current && !sessionCanonical) {
        trackProduct('quiz_abandoned', {
          surface: 'quiz',
          quiz_id: 'what-j-name',
          time_to_complete_ms: Date.now() - startedAt.current,
          count: runRef.current.part1.length + runRef.current.part4.length
        });
      }
    };
  }, [hydrating]);

  function close() {
    if (!signedIn) {
      const token = shareFriend?.token || shareFromRoute;
      if (token) void setPendingReferral(token);
      router.replace('/sign-in');
      return;
    }
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
    // Save progress so they can resume instead of starting over.
    if (!completedRef.current && phase !== 'intro') {
      void saveJnameDraft({
        phase,
        currentQId,
        rapidIndex,
        part4Index,
        picks,
        run: runRef.current,
        startedAt: startedAt.current
      });
    }
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
        <EndQuizSheet
          open={leaveOpen}
          onStay={stayInQuiz}
          onEnd={endQuiz}
          canSaveDraft={phase !== 'intro' && !completedRef.current}
        />
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

  // THIS SECTION DOES: load the friend board for the first result only.
  function loadBoard() {
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
  }

  // THIS SECTION DOES: score the run. The first finish is the real result
  // (saved for friends). A later finish is fun-only and stays on this phone.
  function finish() {
    const out = scoreRun(runRef.current);
    const tops = topJNames(out.j_name_scores, 3);
    const res = { jName: out.j_name, percent: out.j_percentage };
    const isFun = funRunRef.current || Boolean(sessionCanonical || canonicalResult);
    setResult(res);
    completedRef.current = true;
    void clearJnameDraft();
    trackProduct('quiz_completed', {
      surface: 'quiz',
      quiz_id: 'what-j-name',
      method: isFun ? 'retake' : 'tap',
      time_to_complete_ms: Date.now() - startedAt.current
    });
    if (isFun) {
      setFunResult(res);
      setViewing('fun');
      void saveJnameFunResult(res);
    } else {
      sessionCanonical = res;
      setCanonicalResult(res);
      setViewing('first');
      __demoSetQuizResult(out.j_name);
      setLiveJnameSessionResult(res);
      if (signedIn) {
        void saveJnameResult({
          jName: out.j_name,
          percent: out.j_percentage,
          topNames: tops
        });
        loadBoard();
        const linkToken = shareFriend?.token || shareFromRoute;
        if (linkToken) {
          void (async () => {
            const linked = await resolveJnameReferral({ token: linkToken });
            if (linked.connected) {
              trackProduct('friend_added', { method: 'link' });
              if (!isDemoMode()) await loadPeople();
              setAddedFriend(true);
              loadBoard();
            } else if (linked.alreadyFriends) {
              setAddedFriend(true);
            }
          })();
        }
      } else {
        const guestToken = shareFriend?.token || shareFromRoute;
        void saveJnameGuestResult({
          jName: out.j_name,
          percent: out.j_percentage,
          topNames: tops,
          shareToken: guestToken,
          sharerFirstName: shareFriend?.firstName,
          sharerJName: shareFriend?.jName,
          sharerPercent: shareFriend?.percent
        });
        if (guestToken) void setPendingReferral(guestToken);
      }
    }
    setRevealStep(0);
    setPhase('reveal');
  }

  function retake() {
    funRunRef.current = true;
    runRef.current = { part1: [], rapidFire: [], selectedBestFriends: [], part4: [] };
    setPicks([]);
    setRapidIndex(0);
    setPart4Index(0);
    setCurrentQId(FIRST_Q?.id ?? '');
    setPhase('intro');
    void clearJnameDraft();
    trackProduct('quiz_started', {
      surface: 'quiz',
      quiz_id: 'what-j-name',
      method: 'retake'
    });
    startedAt.current = Date.now();
    completedRef.current = false;
  }

  // THIS SECTION DOES: Profile can open this screen already asking for a fun retake.
  useEffect(() => {
    if (hydrating || retakeFromRouteRef.current || !wantRetake) return;
    if (sessionCanonical || canonicalResult) {
      retakeFromRouteRef.current = true;
      retake();
    }
  }, [hydrating, wantRetake]);

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

  // --- RESULT: poster + connect-with-friends (first) or fun-only card ---
  const shownResult =
    viewing === 'fun' && funResult ? funResult : canonicalResult ?? result;
  if (phase === 'result' && shownResult) {
    const isFunView = viewing === 'fun' && Boolean(funResult);
    const shareName = canonicalResult?.jName ?? shownResult.jName;
    const friendName = shareFriend?.firstName || 'your friend';
    const duoPercent =
      shareFriend && !isFunView
        ? jnameCompatibilityPercent(shownResult, {
            jName: shareFriend.jName,
            percent: shareFriend.percent
          })
        : null;

    async function addShareFriend() {
      if (!shareFriend?.token || addingFriend) return;
      setAddingFriend(true);
      const linked = await resolveJnameReferral({ token: shareFriend.token });
      if (linked.connected) {
        trackProduct('friend_added', { method: 'link' });
        if (!isDemoMode()) await loadPeople();
        loadBoard();
      }
      if (linked.personId || linked.alreadyFriends || linked.connected) {
        setAddedFriend(true);
      }
      setAddingFriend(false);
    }

    function goMakeAccount() {
      if (shareFriend?.token) void setPendingReferral(shareFriend.token);
      router.replace('/sign-in');
    }

    // DOWNLOAD PNG: snapshot the poster exactly as it looks, then write that
    // picture into the phone's photo library so it can be posted anywhere.
    const onSaveImage = async () => {
      setSaveState('saving');
      const uri = await captureCard(cardRef);
      if (!uri) {
        setSaveState('failed');
        return;
      }
      const ok = await saveImageToPhotos(uri);
      setSaveState(ok ? 'saved' : 'failed');
      if (ok) {
        trackProduct('quiz_shared', {
          surface: 'quiz',
          quiz_id: 'what-j-name',
          method: 'save_image'
        });
      }
    };
    // Snapshot the card, then open Bridger's collage composer with that PNG.
    const onShareToStory = async () => {
      const uri = await captureCard(cardRef);
      if (!uri) return;
      trackProduct('quiz_shared', {
        surface: 'quiz',
        quiz_id: 'what-j-name',
        method: 'story'
      });
      router.push({
        pathname: '/story/capture',
        params: { photoUri: uri }
      });
    };
    // Share the first-result invite link so friends take it and land on your board.
    const onShareLink = async () => {
      const server = await getJnameShareLink();
      const url = server?.token
        ? visibleShareUrl(server.token, server.url)
        : shareInvite?.url;
      if (!url) return;
      if (server?.token) setShareInvite({ token: server.token, url });
      const ok = await shareLink(url, `I'm ${shareName} on Bridger. Which J are you?`);
      if (ok) {
        trackProduct('quiz_shared', {
          surface: 'quiz',
          quiz_id: 'what-j-name',
          method: 'link'
        });
      }
    };

    return (
      <Screen tone="plain" className="bg-white">
        <ScreenHeader title="Your result" onBack={close} />
        {/* ScreenBody paints the header with status-bar padding. A raw ScrollView
            left the poster under the clock (TestFlight overlap). */}
        <ScreenBody tabBarInset={false} padded className="px-5">
          {funResult ? (
            <View className="mt-1 mb-3">
              <SegmentedTabs
                tabs={['Your result', 'Fun retake']}
                value={isFunView ? 'Fun retake' : 'Your result'}
                onChange={(tab) => setViewing(tab === 'Fun retake' ? 'fun' : 'first')}
                analyticsIdForTab={(tab) =>
                  tab === 'Fun retake' ? QUIZ_IDS.result.view_fun : QUIZ_IDS.result.view_first
                }
              />
            </View>
          ) : null}

          {/* The poster. The stage shrinks it to fit the phone but hands us the
              real, full-size view underneath so the saved PNG stays crisp. */}
          <View className="mt-2">
            <ResultCardStage
              jName={shownResult.jName}
              percent={shownResult.percent}
              captureRef={cardRef}
            />
          </View>

          {isFunView ? (
            <AnalyticsRegion
              analyticsId={QUIZ_IDS.result.fun_note}
              interactive={false}
              accessibilityLabel="This retake is just for fun. Friend matching still uses your first result."
              className="mt-4 rounded-card border border-ink-line bg-surface px-4 py-3"
            >
              <Text className="text-center font-sans-sb text-[13px] text-ink-mute">
                Just for fun. Friend matching still uses your first result.
              </Text>
            </AnalyticsRegion>
          ) : shareFriend ? (
            <AnalyticsRegion
              analyticsId={QUIZ_IDS.result.duo_card}
              interactive={false}
              accessibilityLabel={`You are ${shownResult.jName}. ${friendName} is ${shareFriend.jName}. You two are ${duoPercent} percent compatible.`}
              className="mt-6 rounded-card border border-ink-line bg-surface px-4 py-4"
            >
              <Text className="text-center font-sans-b text-[15px] text-ink">You and {friendName}</Text>
              <Text className="mt-1 text-center font-sans-sb text-[13px] text-ink-mute">
                You are {shownResult.jName}. {friendName} is {shareFriend.jName}.
              </Text>
              {duoPercent != null ? (
                <Text className="mt-2 text-center font-pixel text-[28px] text-ink">
                  {duoPercent}% compatible
                </Text>
              ) : null}
            </AnalyticsRegion>
          ) : (
            <View className="mt-6">
              <AnalyticsRegion
                analyticsId={QUIZ_IDS.result.connect_header}
                interactive={false}
                accessibilityRole="header"
              >
                <Text className="font-sans-b text-[15px] text-ink">Connect with friends</Text>
              </AnalyticsRegion>
              <AnalyticsRegion
                analyticsId={QUIZ_IDS.result.connect_body}
                interactive={false}
                accessibilityLabel="Share this quiz so friends can take it and see how you line up."
              >
                <Text className="mt-1 font-sans-sb text-[13px] text-ink-mute">
                  Send this quiz to friends. When they finish, you see their J-name
                  and how compatible you two are.
                </Text>
              </AnalyticsRegion>
            </View>
          )}

          {!isFunView && signedIn && shareInvite ? (
            <ShareInviteLink
              url={shareInvite.url}
              token={shareInvite.token}
              urlAnalyticsId={QUIZ_IDS.result.share_url}
              copyAnalyticsId={QUIZ_IDS.result.copy_link}
              previewAnalyticsId={QUIZ_IDS.result.preview_link}
              onCopied={() =>
                trackProduct('quiz_shared', {
                  surface: 'quiz',
                  quiz_id: 'what-j-name',
                  method: 'copy'
                })
              }
            />
          ) : null}

          {/* Share the picture, a Bridger collage, or (first result) the invite link. */}
          <View className="mt-5 gap-2.5">
            {!isFunView && !signedIn ? (
              <ButtonPrimary
                full
                onPress={goMakeAccount}
                analyticsId={QUIZ_IDS.result.make_account}
                accessibilityLabel={
                  shareFriend
                    ? `Make an account to add ${friendName}`
                    : 'Make an account to save your result'
                }
              >
                {shareFriend
                  ? `Make an account to add ${friendName}`
                  : 'Make an account to save this'}
              </ButtonPrimary>
            ) : !isFunView && shareFriend && !addedFriend ? (
              <ButtonPrimary
                full
                onPress={() => void addShareFriend()}
                analyticsId={QUIZ_IDS.result.add_friend}
                accessibilityLabel={`Add ${friendName}`}
              >
                {addingFriend ? 'Adding…' : `Add ${friendName}`}
              </ButtonPrimary>
            ) : isFunView ? (
              <ButtonPrimary
                full
                onPress={() => void onShareToStory()}
                analyticsId={QUIZ_IDS.result.share_story}
                accessibilityLabel="Share to your Bridger collage"
              >
                Share to story
              </ButtonPrimary>
            ) : (
              <ButtonPrimary
                full
                onPress={() => void onShareLink()}
                analyticsId={QUIZ_IDS.result.share_link}
                accessibilityLabel="Share the quiz link with friends"
              >
                Share link
              </ButtonPrimary>
            )}
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <ButtonSecondary
                  full
                  onPress={() => void onSaveImage()}
                  analyticsId={QUIZ_IDS.result.save_image}
                  accessibilityLabel="Download this card as a PNG to your photos"
                >
                  {saveState === 'saving' ? 'Saving…' : 'Download PNG'}
                </ButtonSecondary>
              </View>
              {!isFunView && signedIn ? (
                <View className="flex-1">
                  <ButtonSecondary
                    full
                    onPress={() => void onShareToStory()}
                    analyticsId={QUIZ_IDS.result.share_story}
                    accessibilityLabel="Share to your Bridger collage"
                  >
                    Share to story
                  </ButtonSecondary>
                </View>
              ) : null}
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

          {!isFunView && signedIn ? (
            <View className="mt-8">
              <JnameLeaderboard buckets={board} onInvite={() => void onShareLink()} />
            </View>
          ) : null}

          <View className="mt-5">
            <ButtonSecondary
              full
              onPress={close}
              analyticsId={QUIZ_IDS.result.done}
              accessibilityLabel="Done"
            >
              Done
            </ButtonSecondary>
          </View>

          {/* Quiet, on purpose: the first result above stays the one that counts. */}
          <Pressable
            onPress={withAnalyticsPress(QUIZ_IDS.result.retake, retake)}
            accessibilityRole="button"
            accessibilityLabel="Retake this quiz for fun"
            className="mt-4 min-h-[44px] self-center justify-center py-2"
          >
            <Text className="font-sans-sb text-[12px] text-ink-mute underline">Retake for fun</Text>
          </Pressable>
        </ScreenBody>
      </Screen>
    );
  }

  return withLeaveAsk(<BrutalistLoading onBack={requestLeave} />);
}
