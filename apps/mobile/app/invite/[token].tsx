// ============================================
// WHAT THIS FILE DOES (plain English):
// The screen a friend lands on when they tap someone's "add me" invite link
// (bridger://invite/<token>, or an https .../invite/<token> link). If they are
// signed in, we redeem the invite right here — that adds the two of them as
// friends and sends them into the connection reveal (the "in common" story).
// If they are not signed in yet, we remember the invite on this device and send
// them to sign in; the root layout finishes the connection right after login.
//
// This is the same redeem path the camera scanner and the paste-free Scan sheet
// use, so scanning a QR and tapping a link behave identically.
//
// Analytics: friend_added + add_friend flow_completed fire only after the
// redeem succeeds (a confirmed connection, never on link open alone).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  trackFlowCompleted,
  trackFlowStarted,
  trackProduct
} from '@bridger/shared';
import { ButtonPrimary, Screen, ScreenHeader } from '@bridger/ui';
import { redeemInvite } from '../../data/invites';
import { setPendingInvite } from '../../lib/invite-pending';
import { isDemoMode } from '../../lib/demo';
import { loadPeople } from '../../lib/people-cache';
import { supabase } from '../../lib/supabase';

export default function InviteRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token: string; via?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';
  const via = params.via === 'qr' ? 'qr' : 'link';

  const [state, setState] = useState<'working' | 'error'>('working');
  const [message, setMessage] = useState('Connecting you…');
  // Guard so a re-render never redeems the same link twice.
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    void (async () => {
      if (!token) {
        setMessage("This invite link isn't valid.");
        setState('error');
        return;
      }

      // Rebuild the invite link so redeemInvite reads the right method (qr/link).
      const raw = via === 'qr' ? `bridger://invite/${token}?via=qr` : `bridger://invite/${token}`;

      // Signed out? Hold the invite and send them to sign in; the root layout
      // finishes the connection right after they get an account.
      const { data } = await supabase.auth.getSession();
      const signedIn = Boolean(data.session?.access_token) || isDemoMode();
      if (!signedIn) {
        await setPendingInvite(raw);
        router.replace('/sign-in');
        return;
      }

      // Signed in: redeem now, add each other, and open the reveal.
      const startedAt = Date.now();
      trackFlowStarted('add_friend');
      try {
        const res = await redeemInvite(raw);
        trackProduct('friend_added', { method: res.method });
        trackFlowCompleted('add_friend', Date.now() - startedAt, { method: res.method });
        if (!isDemoMode()) {
          await loadPeople();
        }
        router.replace(`/reveal/${res.personId}`);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Could not open that invite.');
        setState('error');
      }
    })();
  }, [token, via, router]);

  return (
    <Screen tone="canvas">
      <ScreenHeader title="Add a friend" onBack={() => router.replace('/home')} />
      <View className="flex-1 items-center justify-center gap-4 px-6">
        {state === 'working' ? (
          <Text className="text-center font-sans text-[14px] text-ink-mute">{message}</Text>
        ) : (
          <>
            <Text className="text-center font-sans-sb text-[15px] text-ink">{message}</Text>
            <ButtonPrimary
              onPress={() => router.replace('/home')}
              accessibilityLabel="Go home"
            >
              Go home
            </ButtonPrimary>
          </>
        )}
      </View>
    </Screen>
  );
}
