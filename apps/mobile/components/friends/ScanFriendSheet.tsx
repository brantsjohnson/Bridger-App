// ============================================
// WHAT THIS FILE DOES (plain English):
// The "Scan a code" sheet. It opens the phone camera and watches for a friend's
// invite QR. The moment a valid Bridger QR is in frame, we redeem it, add each
// other as friends, and drop you into the connection reveal (your "in common"
// story). There is no code to type or paste anymore — point the camera and it
// just works.
//
// Demo note: on a single phone you cannot scan your own screen, so demo mode
// shows a "Try sample invite (Ana)" button that redeems the same way a real
// scan would.
//
// ACCESSIBILITY: the camera is asked for in context (only when this sheet is
// open), and if permission is denied the sheet still works — it explains why
// and offers a button to open Settings, never a dead end.
//
// Analytics: friend_added + add_friend flow_completed fire only after the
// redeem succeeds (a confirmed connection, not the moment the camera opens).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  FRIENDS,
  trackFlowCompleted,
  trackProduct
} from '@bridger/shared';
import { ButtonPrimary, Sheet, withAnalyticsPress } from '@bridger/ui';
import {
  getDemoSampleInvite,
  parseInviteInput,
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
  const router = useRouter();
  // Camera permission state (null while it loads, then granted / denied).
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Clock for flow_completed duration once redeem succeeds.
  const openedAt = useRef(0);
  // Guard so one QR only redeems once (the camera fires many frames a second).
  const handledRef = useRef(false);

  // THIS SECTION DOES: reset the one-shot guard and timer each time we open.
  useEffect(() => {
    if (open) {
      openedAt.current = Date.now();
      handledRef.current = false;
      setError(null);
      setBusy(false);
    }
  }, [open]);

  // THIS SECTION DOES: take an invite value (from a scan or the demo button),
  // redeem it, fire the outcome analytics, then go to the reveal.
  const redeem = async (raw: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await redeemInvite(raw);
      // OUTCOME: the connection now exists — product event + flow complete.
      trackProduct('friend_added', { method: res.method });
      trackFlowCompleted(
        'add_friend',
        openedAt.current > 0 ? Date.now() - openedAt.current : 0,
        { method: res.method }
      );
      if (!isDemoMode()) {
        await loadPeople();
      }
      onClose();
      router.push(`/reveal/${res.personId}`);
    } catch (e) {
      // Let them try another code: clear the guard and show a gentle message.
      handledRef.current = false;
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Could not read that code.');
    }
  };

  // THIS SECTION DOES: when the camera sees a QR, only act on real Bridger
  // invite links (ignore random QR codes on posters, menus, etc.).
  const onScanned = ({ data }: { data: string }) => {
    if (busy || handledRef.current) return;
    const parsed = parseInviteInput(data);
    if (!parsed) return;
    void redeem(data);
  };

  // THIS SECTION DOES: demo mode can't scan its own screen, so redeem Ana.
  const fillSample = () => {
    void redeem(getDemoSampleInvite().url);
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title="Scan a code"
      surface="add_friend_sheet"
      parentScreen="friends"
    >
      <View className="gap-3">
        <Text className="font-sans text-[13px] text-ink-mute">
          Point your camera at a friend's Bridger QR. It connects you both the
          moment it lands.
        </Text>

        {/* THE CAMERA: a square viewfinder that watches for QR codes. */}
        <ScannerViewport
          open={open}
          canScan={open && !!permission?.granted && !busy}
          permission={permission}
          onScanned={onScanned}
          onEnable={() => void requestPermission()}
          onOpenSettings={() => void Linking.openSettings()}
        />

        {/* DEMO: one-phone path so Scan → connect → reveal still proves out. */}
        {isDemoMode() ? (
          <Pressable
            onPress={withAnalyticsPress(FRIENDS.add_sheet.scan, fillSample, {
              analyticsProps: { method: 'link' }
            })}
            accessibilityRole="button"
            accessibilityLabel="Try sample invite for demo"
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

// ============================================
// THE VIEWFINDER: shows the live camera when we have permission, and a clear
// "turn the camera on" state when we do not (never a blank box).
// ============================================
function ScannerViewport({
  open,
  canScan,
  permission,
  onScanned,
  onEnable,
  onOpenSettings
}: {
  open: boolean;
  canScan: boolean;
  permission: ReturnType<typeof useCameraPermissions>[0];
  onScanned: (result: { data: string }) => void;
  onEnable: () => void;
  onOpenSettings: () => void;
}) {
  // Still loading the permission answer: show a calm placeholder.
  if (!permission) {
    return (
      <View className="aspect-square w-full items-center justify-center rounded-2xl border-2 border-ink bg-ink/5">
        <Text className="font-sans text-[13px] text-ink-mute">Loading camera…</Text>
      </View>
    );
  }

  // Camera not allowed yet: explain and offer the in-context enable button.
  if (!permission.granted) {
    // If iOS/Android won't ask again, we must bounce them to Settings instead.
    const canAsk = permission.canAskAgain;
    return (
      <View className="aspect-square w-full items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-ink/5 px-6">
        <Text className="text-center font-sans-sb text-[14px] text-ink">
          Camera access is off
        </Text>
        <Text className="text-center font-sans text-[12px] text-ink-mute">
          Bridger needs the camera to scan a friend's QR code.
        </Text>
        <ButtonPrimary
          size="md"
          onPress={canAsk ? onEnable : onOpenSettings}
          accessibilityLabel={canAsk ? 'Turn on camera' : 'Open Settings'}
          analyticsId={FRIENDS.add_sheet.scan_enable}
        >
          {canAsk ? 'Turn on camera' : 'Open Settings'}
        </ButtonPrimary>
      </View>
    );
  }

  // Permission granted: show the live scanner. We only mount the camera while
  // the sheet is open so it releases the camera the moment you close it.
  return (
    <View className="aspect-square w-full overflow-hidden rounded-2xl border-2 border-ink bg-black">
      {open ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          // iOS: pause the session while we redeem, without unmounting.
          active={canScan}
          // Only listen for QR codes, and stop listening while we redeem.
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={canScan ? onScanned : undefined}
        />
      ) : null}
    </View>
  );
}
