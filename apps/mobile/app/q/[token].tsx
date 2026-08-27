// ============================================
// WHAT THIS FILE DOES (plain English):
// The free, no-account-needed page a friend lands on when they open a shared
// J-name result link (https://bridger.app/q/<token>). If they have the app
// installed the link opens the app to this same screen; if not, it opens on the
// web and still works. It shows the sharer's result and invites them to take
// the quiz. To actually SEE which of their friends is their "Jake", they have
// to make an account (that gate is the leaderboard, coming in the next phase).
//
// PRIVACY: opening this page records only an opaque "someone opened this link"
// note so we can connect a later signup to the friend who invited them. No
// names or personal data are needed to view it.
// ============================================
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { JnameSharedView } from '@bridger/shared';
import { ButtonPrimary, ButtonSecondary, Screen, ScreenHeader } from '@bridger/ui';
import { ResultCardStage } from '../../quizzes/what-j-name/ResultCardStage';
import { fetchJnameSharedView } from '../../lib/jname-api';
import { getAnonRef, setPendingReferral } from '../../lib/jname-referral';
import { supabase } from '../../lib/supabase';

export default function SharedJnameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token: string }>();
  const token = typeof params.token === 'string' ? params.token : '';

  const [view, setView] = useState<JnameSharedView | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) {
        setState('missing');
        return;
      }
      // Are we signed in? If not, remember this link so a later signup can be
      // connected to the friend who invited them, and pass an opaque device id.
      const { data } = await supabase.auth.getSession();
      const signedIn = Boolean(data.session?.access_token);
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
  }, [token]);

  return (
    <Screen tone="canvas">
      <ScreenHeader title="A friend's result" onBack={() => router.replace('/')} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        {state === 'loading' ? (
          <Text className="mt-8 text-center font-sans text-ink-mute">Loading…</Text>
        ) : null}

        {state === 'missing' ? (
          <View className="mt-10 items-center gap-3">
            <Text className="text-center font-sans-sb text-ink">This link isn't available.</Text>
            <ButtonPrimary onPress={() => router.replace('/quiz/what-j-name')} accessibilityLabel="Take the quiz">
              Take the quiz
            </ButtonPrimary>
          </View>
        ) : null}

        {state === 'ready' && view ? (
          <View className="mt-2 gap-4">
            {/* Who shared it, in plain words. */}
            <Text className="text-center font-sans-sb text-[15px] text-ink">
              {view.sharerFirstName ? `${view.sharerFirstName} is ${view.jName}` : `They're ${view.jName}`}
            </Text>

            <ResultCardStage jName={view.jName} percent={view.percent} />

            {/* The invite: take it yourself; account needed for friend results. */}
            <View className="mt-2 gap-2.5">
              <ButtonPrimary full onPress={() => router.replace('/quiz/what-j-name')} accessibilityLabel="Take the quiz">
                Take the quiz
              </ButtonPrimary>
              <ButtonSecondary full onPress={() => router.replace('/')} accessibilityLabel="Make an account to see your friends">
                Make an account to see which friend is your {view.jName}
              </ButtonSecondary>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
