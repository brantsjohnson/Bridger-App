// ============================================
// WHAT THIS FILE DOES (plain English):
// The Add-friend sheet from the Friends header "+". Both doors are instant
// (no request, no accept). Your QR shows the moment the sheet opens; share-link
// and scan sit under it. Live mode will wire invite-links / qr-tokens.
//
// Analytics timing (important): taps here only record flow *steps*
// (method chosen). `friend_added` + `flow_completed` fire later, when the
// connection actually succeeds (ScanFriendSheet redeem / deep-link callback).
// Opening the share sheet or Scan is a start, not an outcome.
//
// QR note: showing your own code is a step on *this* device. The friendship
// completes on the *other* person's device when they redeem. Do not fire
// flow_completed on the QR tap.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinkIcon, ScanLineIcon } from 'lucide-react-native';
import {
  FRIENDS,
  trackFlowAbandoned,
  trackFlowStarted,
  trackFlowStep
} from '@bridger/shared';
import {
  ButtonSecondary,
  Sheet,
  useSurfaceAct,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { QrBlock } from './QrBlock';

export function AddFriendSheet({
  open,
  onClose,
  onShare,
  onScan
}: {
  open: boolean;
  onClose: () => void;
  onShare?: () => void;
  onScan?: () => void;
}) {
  // Flow clock: open starts it; dismiss without a method hand-off abandons it.
  // Choosing link/scan hands off (camera / share / redeem) — do not abandon
  // just because this sheet closed. friend_added still waits for real connect.
  const startedAt = useRef(0);
  const lastStep = useRef('open');
  const handedOff = useRef(false);

  // Start the add_friend flow every time this sheet opens.
  useEffect(() => {
    if (!open) return;
    startedAt.current = Date.now();
    lastStep.current = 'open';
    handedOff.current = false;
    trackFlowStarted('add_friend');
  }, [open]);

  // Closing with no method chosen = abandon. Hand-off to share/scan is not.
  const handleClose = () => {
    if (open && !handedOff.current && startedAt.current > 0) {
      trackFlowAbandoned(
        'add_friend',
        Date.now() - startedAt.current,
        lastStep.current
      );
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Add a friend"
      surface="add_friend_sheet"
      parentScreen="friends"
      footer={
        <AddFriendFooter
          lastStep={lastStep}
          handedOff={handedOff}
          onShare={onShare}
          onClose={handleClose}
        />
      }
    >
      <AddFriendBody
        lastStep={lastStep}
        handedOff={handedOff}
        onScan={onScan}
      />
    </Sheet>
  );
}

/** Share-invite footer. Must sit under SurfaceHost so markActed works. */
function AddFriendFooter({
  lastStep,
  handedOff,
  onShare,
  onClose
}: {
  lastStep: React.MutableRefObject<string>;
  handedOff: React.MutableRefObject<boolean>;
  onShare?: () => void;
  onClose: () => void;
}) {
  const { markActed } = useSurfaceAct();

  return (
    <ButtonSecondary
      full
      size="md"
      tone="solid"
      icon={<LinkIcon size={16} color="#FFFFFF" strokeWidth={2.5} />}
      onPress={() => {
        // Step only: they chose "link". friend_added waits for a real connect
        // (recipient redeems the invite — that fires on *their* device).
        lastStep.current = 'link';
        handedOff.current = true;
        trackFlowStep('add_friend', 'link', { method: 'link' });
        markActed();
        (onShare ?? onClose)();
      }}
      accessibilityLabel="Share invite link"
      analyticsId={FRIENDS.add_sheet.invite_link}
      analyticsProps={{ method: 'link' }}
    >
      Share invite link
    </ButtonSecondary>
  );
}

/** QR + scan body. Must sit under SurfaceHost so markActed works. */
function AddFriendBody({
  lastStep,
  handedOff,
  onScan
}: {
  lastStep: React.MutableRefObject<string>;
  handedOff: React.MutableRefObject<boolean>;
  onScan?: () => void;
}) {
  const c = useThemeColors();
  const { markActed } = useSurfaceAct();

  return (
    <View className="gap-4">
      {/*
        Showing your QR is a method step on this device only.
        The other person scanning completes the friendship on *their* device —
        never fire flow_completed / friend_added here.
      */}
      <Pressable
        onPress={withAnalyticsPress(
          FRIENDS.add_sheet.qr,
          () => {
            lastStep.current = 'qr';
            trackFlowStep('add_friend', 'qr', { method: 'qr' });
          },
          { analyticsProps: { method: 'qr' } }
        )}
        accessibilityRole="imagebutton"
        accessibilityLabel="Your QR code"
      >
        <QrBlock />
      </Pressable>
      <Text className="text-center font-sans-sb text-[12px] text-ink-mute">
        Let them scan this
      </Text>
      <ButtonSecondary
        full
        size="md"
        icon={<ScanLineIcon size={16} color={c.ink} strokeWidth={2.4} />}
        onPress={() => {
          // Step only: redeem sheet opens next. friend_added waits for success.
          lastStep.current = 'scan';
          handedOff.current = true;
          trackFlowStep('add_friend', 'scan', { method: 'scan' });
          markActed();
          onScan?.();
        }}
        accessibilityLabel="Scan a code"
        analyticsId={FRIENDS.add_sheet.scan}
        analyticsProps={{ method: 'scan' }}
      >
        Scan a code
      </ButtonSecondary>
    </View>
  );
}
