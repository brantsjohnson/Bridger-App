// ============================================
// WHAT THIS FILE DOES (plain English):
// The free, no-account page a friend lands on when they open a shared
// J-name result link (https://bridger.app/q/<token>). It shows the sharer's
// card and lets them take the quiz without signing in. After they finish,
// they can make an account. That account adds this friend so both can see
// the duo result.
//
// PRIVACY: opening records only an opaque "someone opened this link" note.
// ============================================
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import type { JnameSharedView } from '@bridger/shared';
import { openSurface, QUIZ_SHARE, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader
} from '@bridger/ui';
import { ResultCardStage } from '../../quizzes/what-j-name/ResultCardStage';
import { fetchJnameSharedView, resolveJnameReferral } from '../../lib/jname-api';
import { getAnonRef, setPendingReferral } from '../../lib/jname-referral';
import { loadPeople } from '../../lib/people-cache';
import { isDemoMode } from '../../lib/demo';
import { useAuth } from '../../providers/auth-provider';

export default function SharedJnameScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const signedIn = Boolean(session?.user?.id);
  const params = useLocalSearchParams<{ token: string }>();
  const token = typeof params.token === 'string' ? params.token : '';

  const [view, setView] = useState<JnameSharedView | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    openSurface('quiz_share', 'quiz');
    let alive = true;
    (async () => {
      if (!token) {
        setState('missing');
        return;
      }
      // Remember this link so a later signup can add the friend who shared it.
      let anonRef: string | undefined;
      if (!signedIn) {
        anonRef = await getAnonRef();
        await setPendingReferral(token);
      }
      const result = await fetchJnameSharedView(token, anonRef);
      if (!alive) return;
      if (!result) {
        setState('missing');
        return;
      }
      setView(result);
      setState('ready');
    })();
    return () => {
      alive = false;
    };
  }, [token, signedIn]);

  const who = view?.sharerFirstName || 'this friend';

  function takeQuiz() {
    if (token) void setPendingReferral(token);
    router.replace({
      pathname: '/quiz/[slug]',
      params: { slug: 'what-j-name', share: token }
    } as Href);
  }

  async function addFriend() {
    if (!token || adding) return;
    setAdding(true);
    const res = await resolveJnameReferral({ token });
    if (res.connected) {
      trackProduct('friend_added', { method: 'link' });
      if (!isDemoMode()) await loadPeople();
    }
    if (res.personId || res.alreadyFriends || res.connected) setAdded(true);
    setAdding(false);
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader title="A friend's result" onBack={() => router.replace('/')} />
      <ScreenBody tabBarInset={false} padded className="px-5">
        {state === 'loading' ? (
          <Text className="mt-8 text-center font-sans text-ink-mute">Loading…</Text>
        ) : null}

        {state === 'missing' ? (
          <View className="mt-10 items-center gap-3">
            <Text className="text-center font-sans-sb text-ink">This link isn't available.</Text>
            <ButtonPrimary
              onPress={takeQuiz}
              analyticsId={QUIZ_SHARE.actions.take}
              accessibilityLabel="Take the quiz"
            >
              Take the quiz
            </ButtonPrimary>
          </View>
        ) : null}

        {state === 'ready' && view ? (
          <View className="mt-2 gap-4">
            <AnalyticsRegion
              analyticsId={QUIZ_SHARE.body.headline}
              interactive={false}
              accessibilityRole="header"
            >
              <Text className="text-center font-sans-sb text-[15px] text-ink">
                {view.sharerFirstName ? `${view.sharerFirstName} is ${view.jName}` : `They're ${view.jName}`}
              </Text>
            </AnalyticsRegion>

            <AnalyticsRegion analyticsId={QUIZ_SHARE.body.card} interactive={false}>
              <ResultCardStage jName={view.jName} percent={view.percent} />
            </AnalyticsRegion>

            <View className="mt-2 gap-2.5">
              <ButtonPrimary
                full
                onPress={takeQuiz}
                analyticsId={QUIZ_SHARE.actions.take}
                accessibilityLabel="Take the quiz. No Bridger account needed."
              >
                Take the quiz
              </ButtonPrimary>
              <AnalyticsRegion
                analyticsId={QUIZ_SHARE.body.note}
                interactive={false}
                accessibilityLabel="No Bridger account needed to take the quiz"
              >
                <Text className="text-center font-sans-sb text-[12px] text-ink-mute">
                  No Bridger account needed to take it. Making an account adds{' '}
                  {who} so you can see how you two line up.
                </Text>
              </AnalyticsRegion>
              {signedIn ? (
                <ButtonSecondary
                  full
                  disabled={adding || added}
                  onPress={() => void addFriend()}
                  analyticsId={QUIZ_SHARE.actions.add_friend}
                  accessibilityLabel={added ? `You and ${who} are friends` : `Add ${who}`}
                >
                  {added ? `You and ${who} are friends` : adding ? 'Adding…' : `Add ${who}`}
                </ButtonSecondary>
              ) : (
                <ButtonSecondary
                  full
                  onPress={() => {
                    void setPendingReferral(token);
                    router.replace('/sign-in');
                  }}
                  analyticsId={QUIZ_SHARE.actions.make_account}
                  accessibilityLabel={`Make an account to add ${who}`}
                >
                  Make an account to add {who}
                </ButtonSecondary>
              )}
            </View>
          </View>
        ) : null}
      </ScreenBody>
    </Screen>
  );
}
