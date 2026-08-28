// ============================================
// WHAT THIS FILE DOES (plain English):
// Lets you redeem someone else's invite / QR token. Paste (or type) the code
// or full deep link, then redeemInvite confirms the connection and sends you
// into the connection reveal.
//
// Demo: tap "Try sample invite" to redeem Ana without a second device — same
// URL/token shape live mode uses. Camera barcode scan is still deferred.
//
// Analytics: friend_added + add_friend flow_completed fire only after redeem
// succeeds (confirmed outcome, not the Connect tap alone).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  FRIENDS,
  trackFlowCompleted,
  trackProduct
} from '@bridger/shared';
import { ButtonPrimary, Sheet, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import {
  getDemoSampleInvite,
  redeemInvite
} from '../../data/invites';
import { isDemoMode } from '../../lib/demo';
import { loadPeople } from '../../lib/people-cache';

export function ScanFriendSheet({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Clock for flow_completed duration once redeem succeeds.
  const openedAt = useRef(0);

  useEffect(() => {
    if (open) openedAt.current = Date.now();
  }, [open]);

  // THIS SECTION DOES: redeem the pasted invite, then fire outcome analytics.
  const redeem = async () => {
    if (!token.trim()) {
      setError('Paste an invite code or link first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await redeemInvite(token);
      // OUTCOME: connection exists — product event + flow complete, not the tap.
      trackProduct('friend_added', { method: res.method });
      trackFlowCompleted(
        'add_friend',
        openedAt.current > 0 ? Date.now() - openedAt.current : 0,
        { method: res.method }
      );
      if (!isDemoMode()) {
        await loadPeople();
      }
      setToken('');
      onClose();
      router.push(`/reveal/${res.personId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not redeem that code.');
    } finally {
      setBusy(false);
    }
  };

  const fillSample = () => {
    const sample = getDemoSampleInvite();
    setToken(sample.url);
    setError(null);
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setToken('');
        setError(null);
        onClose();
      }}
      title="Scan a code"
      surface="add_friend_sheet"
      parentScreen="friends"
      footer={
        <ButtonPrimary
          full
          size="md"
          disabled={!token.trim()}
          loading={busy}
          onPress={() => void redeem()}
          accessibilityLabel="Connect with this code"
          analyticsId={FRIENDS.add_sheet.scan}
          analyticsProps={{ method: 'scan' }}
        >
          Connect
        </ButtonPrimary>
      }
    >
      <View className="gap-3">
        <Text className="font-sans text-[13px] text-ink-mute">
          Paste the invite link or code from their QR. Camera scan lands once we
          ship barcode reading on top of this same redeem path.
        </Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Invite link or code"
          placeholderTextColor={c.inkMute}
          accessibilityLabel="Invite code"
          className="rounded-xl border-2 border-ink bg-surface px-3 py-3 font-sans text-[14px] text-ink"
        />
        {isDemoMode() ? (
          <Pressable
            onPress={withAnalyticsPress(FRIENDS.add_sheet.scan, fillSample, {
              analyticsProps: { method: 'link' }
            })}
            accessibilityRole="button"
            accessibilityLabel="Fill sample invite for demo"
            className="self-start rounded-full bg-ink/5 px-3 py-2 active:opacity-80"
          >
            <Text className="font-sans-sb text-[12px] text-ink-soft">
              Try sample invite (Ana)
            </Text>
          </Pressable>
        ) : null}
        {error ? (
          <Text className="font-sans text-[12px] text-coral">{error}</Text>
        ) : null}
      </View>
    </Sheet>
  );
}
