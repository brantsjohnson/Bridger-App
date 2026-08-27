// ============================================
// WHAT THIS FILE DOES (plain English):
// Confirm sheet before you emoji-bomb a friend. Nothing sends until they tap
// Send. This sheet is its own analytics surface (parent = person).
// ============================================
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SEND_DELIGHT_SHEET, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  Sheet,
  SurfaceHost
} from '@bridger/ui';
import { sendTrigger } from '../../data/delight';

export function SendDelightSheet({
  open,
  onClose,
  toUserId,
  toFirstName,
  delightId
}: {
  open: boolean;
  onClose: () => void;
  toUserId: string;
  toFirstName: string;
  delightId: string;
}) {
  const [busy, setBusy] = useState(false);

  const onSend = () => {
    if (busy) return;
    setBusy(true);
    void sendTrigger({ delightId, toUserId })
      .then(() => {
        trackProduct('delight_gifted', { delight_slug: 'emoji-bomb' });
        onClose();
        Alert.alert(
          'Sent',
          `${toFirstName} will see it next time they open Bridger.`
        );
      })
      .catch((err: unknown) => {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Try again in a moment.';
        Alert.alert('Could not send', message);
      })
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={open} onClose={onClose} title="Emoji bomb">
      <SurfaceHost surface="send_delight" parentScreen="person" open={open}>
        <AnalyticsRegion
          analyticsId={SEND_DELIGHT_SHEET.sheet.body}
          interactive={false}
        >
          <Text className="mb-4 font-sans-sb text-[14px] leading-snug text-ink-mute">
            Rain emojis when they open Bridger.
          </Text>
        </AnalyticsRegion>
        <View className="gap-2">
          <ButtonPrimary
            analyticsId={SEND_DELIGHT_SHEET.sheet.send}
            onPress={onSend}
            disabled={busy}
            loading={busy}
            accessibilityLabel={`Send emoji bomb to ${toFirstName}`}
          >
            Send
          </ButtonPrimary>
          <ButtonSecondary
            analyticsId={SEND_DELIGHT_SHEET.sheet.cancel}
            onPress={onClose}
            accessibilityLabel="Cancel emoji bomb"
          >
            Cancel
          </ButtonSecondary>
        </View>
      </SurfaceHost>
    </Sheet>
  );
}
