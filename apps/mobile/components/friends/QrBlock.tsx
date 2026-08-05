// ============================================
// WHAT THIS FILE DOES (plain English):
// Your invite QR block in the Add-friend sheet. Live mode asks the API for a
// short-lived QR token the moment the block mounts, then shows a chunky pixel
// pattern seeded by that token (plus the token itself so someone can type it
// in if camera scan is not available). Demo mode keeps the old fake pattern.
//
// FOLLOW-UP: render a real machine-readable QR once we pick a QR library
// (needs an explicit go-ahead — stack is locked). Until then, scan uses paste.
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { cn } from '@bridger/ui';
import { apiFetch } from '../../lib/api';
import { isDemoMode } from '../../lib/demo';

/** Turn a token into 64 on/off modules so the block looks like a QR. */
function modulesFromToken(token: string): boolean[] {
  let h = 0;
  for (let i = 0; i < token.length; i += 1) {
    h = (h * 31 + token.charCodeAt(i)) | 0;
  }
  return Array.from({ length: 64 }, (_, i) => {
    const bit = (Math.abs(h + i * 17) >> (i % 8)) & 1;
    return bit === 1 || i % 7 === 0;
  });
}

export function QrBlock() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isDemoMode()) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ token: string }>('/connections/qr-token', {
          method: 'POST',
          body: JSON.stringify({})
        });
        if (!cancelled) setToken(res.token);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const modules = useMemo(
    () => modulesFromToken(token ?? 'demo-placeholder'),
    [token]
  );

  return (
    <View className="items-center gap-2">
      <View
        accessibilityRole="image"
        accessibilityLabel={
          token ? `Your invite code ${token.slice(0, 8)}` : 'Your QR code'
        }
        className="mx-auto h-40 w-40 flex-row flex-wrap content-start border-2 border-ink bg-white p-2"
      >
        {!isDemoMode() && !token && !error ? (
          <View className="h-full w-full items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          modules.map((on, i) => (
            <View
              key={i}
              style={{ width: '12.5%', height: '12.5%' }}
              className={cn(on ? 'bg-ink' : 'bg-transparent')}
            />
          ))
        )}
      </View>
      {token ? (
        <Text
          selectable
          className="px-4 text-center font-sans text-[11px] text-ink-mute"
        >
          Code: {token}
        </Text>
      ) : null}
      {error ? (
        <Text className="text-center font-sans text-[11px] text-ink-mute">
          Could not load invite code. Try again.
        </Text>
      ) : null}
    </View>
  );
}
