// ============================================
// WHAT THIS FILE DOES (plain English):
// Lets you redeem someone else's invite / QR token. Opens a small sheet where
// you paste (or type) the code, then calls POST /connections/redeem and sends
// you into the connection reveal.
//
// Camera barcode scan is deferred until we ship a real QR renderer (needs a
// QR library go-ahead). Paste works today on every platform, including web.
// ============================================
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FRIENDS } from '@bridger/shared';
import { ButtonPrimary, Sheet, useThemeColors } from '@bridger/ui';
import { apiFetch } from '../../lib/api';
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

  const redeem = async () => {
    const cleaned = token.trim();
    // Allow pasting a full bridger://invite/<token> deep link.
    const match = /(?:invite\/)?([0-9a-f-]{36})$/i.exec(cleaned);
    const value = match?.[1] ?? cleaned;
    if (!value) {
      setError('Paste an invite code first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const kind: 'link' | 'qr' = cleaned.includes('invite/') ? 'link' : 'qr';
      const res = await apiFetch<{ personId: string }>('/connections/redeem', {
        method: 'POST',
        body: JSON.stringify({ token: value, kind })
      });
      await loadPeople();
      setToken('');
      onClose();
      router.push(`/reveal/${res.personId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not redeem that code.');
    } finally {
      setBusy(false);
    }
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
          Paste the invite code or link your friend showed you. Camera scan
          lands once we ship real QR art.
        </Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Invite code or link"
          placeholderTextColor={c.inkMute}
          accessibilityLabel="Invite code"
          className="rounded-xl border-2 border-ink bg-white px-3 py-3 font-sans text-[14px] text-ink"
        />
        {error ? (
          <Text className="font-sans text-[12px] text-coral">{error}</Text>
        ) : null}
      </View>
    </Sheet>
  );
}
