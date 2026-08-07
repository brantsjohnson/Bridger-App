// ============================================
// WHAT THIS FILE DOES (plain English):
// Your invite QR in the Add-friend sheet. Loads a short-lived invite from the
// invites helper (demo or live — same URL shape), then draws a real scannable
// QR that encodes that deep link. The link text under it is selectable so
// someone can paste into Scan when a camera is not handy.
// ============================================
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { createQrInvite, type InvitePayload } from '../../data/invites';

export function QrBlock() {
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // THIS SECTION DOES: fetch a QR invite as soon as the block mounts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await createQrInvite();
        if (!cancelled) {
          setInvite(next);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load invite code.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View className="items-center gap-2">
      <View
        accessibilityRole="image"
        accessibilityLabel={
          invite
            ? 'Your invite QR code. Someone can scan this to add you.'
            : 'Loading your QR code'
        }
        className="mx-auto h-44 w-44 items-center justify-center border-2 border-ink bg-white p-3"
      >
        {!invite && !error ? (
          <ActivityIndicator />
        ) : invite ? (
          <QRCode
            value={invite.url}
            size={148}
            backgroundColor="#FFFFFF"
            color="#1C1B16"
            // Quiet zone is already padded by the white frame above.
            ecl="M"
          />
        ) : null}
      </View>
      {invite ? (
        <Text
          selectable
          className="px-4 text-center font-sans text-[11px] text-ink-mute"
        >
          {invite.url}
        </Text>
      ) : null}
      {error ? (
        <Text className="text-center font-sans text-[11px] text-coral">{error}</Text>
      ) : null}
    </View>
  );
}
