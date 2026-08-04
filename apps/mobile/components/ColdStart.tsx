// ============================================
// WHAT THIS FILE DOES (plain English):
// The day-one invitation when you have no friends yet — "Bring your people in"
// with share / QR / scan actions. Same card Magic Patterns uses on Home and Friends.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { LinkIcon, QrCodeIcon, ScanLineIcon } from 'lucide-react-native';
import { ButtonSecondary, Card, PixelHeading, useThemeColors } from '@bridger/ui';

export function ColdStart({ onAdd }: { onAdd?: () => void }) {
  const c = useThemeColors();
  return (
    <Card className="items-center">
      <Text accessible={false} className="text-[30px]">
        🌉
      </Text>
      <PixelHeading size="md" className="mt-3 text-center">
        Bring your people in
      </PixelHeading>
      <Text className="mt-2 text-center font-sans-sb text-[13px] text-ink-mute">
        Bridger is quiet until your friends are here.
      </Text>
      <View className="mt-5 w-full gap-2.5">
        <ButtonSecondary
          full
          size="md"
          tone="solid"
          icon={<LinkIcon size={16} color="#FFFFFF" strokeWidth={2.5} />}
          onPress={onAdd}
          accessibilityLabel="Share invite link"
        >
          Share invite link
        </ButtonSecondary>
        <ButtonSecondary
          full
          icon={<QrCodeIcon size={16} color={c.ink} strokeWidth={2.4} />}
          onPress={onAdd}
          accessibilityLabel="Your QR code"
        >
          Your QR code
        </ButtonSecondary>
        <ButtonSecondary
          full
          icon={<ScanLineIcon size={16} color={c.ink} strokeWidth={2.4} />}
          onPress={onAdd}
          accessibilityLabel="Scan a code"
        >
          Scan a code
        </ButtonSecondary>
      </View>
    </Card>
  );
}
