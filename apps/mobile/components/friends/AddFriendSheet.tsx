// ============================================
// WHAT THIS FILE DOES (plain English):
// The Add-friend sheet from the Friends header "+". Both doors are instant —
// no request, no accept. Your QR shows the moment the sheet opens; share-link
// and scan sit under it. Live mode will wire invite-links / qr-tokens.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { LinkIcon, ScanLineIcon } from 'lucide-react-native';
import { ButtonSecondary, Sheet, useThemeColors } from '@bridger/ui';
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
  const c = useThemeColors();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a friend"
      footer={
        <ButtonSecondary
          full
          size="md"
          tone="solid"
          icon={<LinkIcon size={16} color="#FFFFFF" strokeWidth={2.5} />}
          onPress={onShare ?? onClose}
          accessibilityLabel="Share invite link"
        >
          Share invite link
        </ButtonSecondary>
      }
    >
      <View className="gap-4">
        <QrBlock />
        <Text className="text-center font-sans-sb text-[12px] text-ink-mute">
          Let them scan this
        </Text>
        <ButtonSecondary
          full
          size="md"
          icon={<ScanLineIcon size={16} color={c.ink} strokeWidth={2.4} />}
          onPress={onScan}
          accessibilityLabel="Scan a code"
        >
          Scan a code
        </ButtonSecondary>
      </View>
    </Sheet>
  );
}
