// ============================================
// WHAT THIS FILE DOES (plain English):
// The day-one invitation when you have no friends yet — "Bring your people in"
// with share / QR / scan actions. Same card Magic Patterns uses on Home and Friends.
// Analytics: body is dead-click; CTAs share cold_start.cta with method.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { LinkIcon, QrCodeIcon, ScanLineIcon } from 'lucide-react-native';
import { HOME } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonSecondary,
  Card,
  PixelHeading,
  useThemeColors
} from '@bridger/ui';

export function ColdStart({
  onAdd,
  bodyAnalyticsId = HOME.cold_start.body,
  ctaAnalyticsId = HOME.cold_start.cta,
  inviteLocked = false
}: {
  onAdd?: () => void;
  /** Override when reused outside Home (e.g. Friends). */
  bodyAnalyticsId?: string;
  ctaAnalyticsId?: string;
  /** Demo week: invitee cannot send links. */
  inviteLocked?: boolean;
}) {
  const c = useThemeColors();
  return (
    <Card className="items-center">
      {/* Analytics: card body is not a button; taps log dead_click. */}
      <AnalyticsRegion
        analyticsId={bodyAnalyticsId}
        interactive={false}
        accessibilityLabel="Bring your people in"
        className="items-center"
      >
        <Text accessible={false} className="text-[30px]">
          🌉
        </Text>
        <PixelHeading size="md" className="mt-3 text-center">
          Bring your people in
        </PixelHeading>
        <Text className="mt-2 text-center font-sans-sb text-[13px] text-ink-mute">
          {inviteLocked
            ? 'During the TestFlight demo, only people who were here first can send invite links.'
            : 'Bridger is quiet until your friends are here.'}
        </Text>
      </AnalyticsRegion>
      <View className="mt-5 w-full gap-2.5">
        {!inviteLocked ? (
          <>
        <ButtonSecondary
          full
          size="md"
          tone="solid"
          icon={<LinkIcon size={16} color="#FFFFFF" strokeWidth={2.5} />}
          onPress={onAdd}
          accessibilityLabel="Share invite link"
          analyticsId={ctaAnalyticsId}
          analyticsProps={{ method: 'link' }}
        >
          Share invite link
        </ButtonSecondary>
        <ButtonSecondary
          full
          icon={<QrCodeIcon size={16} color={c.ink} strokeWidth={2.4} />}
          onPress={onAdd}
          accessibilityLabel="Your QR code"
          analyticsId={ctaAnalyticsId}
          analyticsProps={{ method: 'qr' }}
        >
          Your QR code
        </ButtonSecondary>
        <ButtonSecondary
          full
          icon={<ScanLineIcon size={16} color={c.ink} strokeWidth={2.4} />}
          onPress={onAdd}
          accessibilityLabel="Scan a code"
          analyticsId={ctaAnalyticsId}
          analyticsProps={{ method: 'scan' }}
        >
          Scan a code
        </ButtonSecondary>
          </>
        ) : null}
      </View>
    </Card>
  );
}
