// ============================================
// WHAT THIS FILE DOES (plain English):
// The Add-friend sheet from the Friends header "+". Both doors are instant
// (no request, no accept). Your QR shows the moment the sheet opens; share-link
// and scan sit under it. Live mode will wire invite-links / qr-tokens.
// Analytics: own surface (add_friend_sheet), add_friend flow start/step/
// complete, and friend_added on share/scan success. No names or other PII.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinkIcon, ScanLineIcon } from 'lucide-react-native';
import {
  FRIENDS,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
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
  // Flow clock lives here so open/close of the sheet can start / abandon it.
  const startedAt = useRef(0);
  const lastStep = useRef('open');
  const completed = useRef(false);

  // Start the add_friend flow every time this sheet opens.
  useEffect(() => {
    if (!open) return;
    startedAt.current = Date.now();
    lastStep.current = 'open';
    completed.current = false;
    trackFlowStarted('add_friend');
  }, [open]);

  // Closing without finishing counts as abandon (how far they got).
  const handleClose = () => {
    if (open && !completed.current && startedAt.current > 0) {
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
          startedAt={startedAt}
          lastStep={lastStep}
          completed={completed}
          onShare={onShare}
          onClose={handleClose}
        />
      }
    >
      <AddFriendBody
        startedAt={startedAt}
        lastStep={lastStep}
        completed={completed}
        onScan={onScan}
      />
    </Sheet>
  );
}

/** Share-invite footer. Must sit under SurfaceHost so markActed works. */
function AddFriendFooter({
  startedAt,
  lastStep,
  completed,
  onShare,
  onClose
}: {
  startedAt: React.MutableRefObject<number>;
  lastStep: React.MutableRefObject<string>;
  completed: React.MutableRefObject<boolean>;
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
        lastStep.current = 'link';
        trackFlowStep('add_friend', 'link', { method: 'link' });
        trackProduct('friend_added', { method: 'link' });
        trackFlowCompleted('add_friend', Date.now() - startedAt.current, {
          method: 'link'
        });
        completed.current = true;
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
  startedAt,
  lastStep,
  completed,
  onScan
}: {
  startedAt: React.MutableRefObject<number>;
  lastStep: React.MutableRefObject<string>;
  completed: React.MutableRefObject<boolean>;
  onScan?: () => void;
}) {
  const c = useThemeColors();
  const { markActed } = useSurfaceAct();

  return (
    <View className="gap-4">
      {/* Tapping the QR chooses the qr method; connection confirms later live */}
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
          lastStep.current = 'scan';
          trackFlowStep('add_friend', 'scan', { method: 'scan' });
          trackProduct('friend_added', { method: 'scan' });
          trackFlowCompleted('add_friend', Date.now() - startedAt.current, {
            method: 'scan'
          });
          completed.current = true;
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
