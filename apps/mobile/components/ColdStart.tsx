// ============================================
// WHAT THIS FILE DOES (plain English):
// The day-one invitation when you have no friends yet. Home says "Bring your
// people in." Friends says "Connect your contacts" and can save one number as
// a private card. Share / QR / scan stay as backup doors.
// Analytics: body is dead-click; CTAs share cold_start.cta with method.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { LinkIcon, QrCodeIcon, ScanLineIcon, UsersIcon } from 'lucide-react-native';
import { FRIENDS, HOME } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonSecondary,
  Card,
  PixelHeading,
  useThemeColors
} from '@bridger/ui';

export function ColdStart({
  onAdd,
  onConnectContacts,
  friendsEmpty = false,
  bodyAnalyticsId,
  ctaAnalyticsId,
  inviteLocked = false
}: {
  onAdd?: () => void;
  /** Friends empty state: pick a contact and save a private card. */
  onConnectContacts?: () => void;
  friendsEmpty?: boolean;
  /** Override when reused outside Home (e.g. Friends). */
  bodyAnalyticsId?: string;
  ctaAnalyticsId?: string;
  /** Demo week: invitee cannot send links. */
  inviteLocked?: boolean;
}) {
  const c = useThemeColors();
  const bodyId =
    bodyAnalyticsId ?? (friendsEmpty ? FRIENDS.cold_start.body : HOME.cold_start.body);
  const ctaId =
    ctaAnalyticsId ?? (friendsEmpty ? FRIENDS.cold_start.cta : HOME.cold_start.cta);
  const heading = friendsEmpty ? 'Connect your contacts' : 'Bring your people in';
  const body = inviteLocked
    ? 'During the TestFlight demo, only people who were here first can send invite links.'
    : friendsEmpty
      ? 'Pick someone from your phone. You can write notes on a card you made. When they join with that number, their real profile takes over and your notes stay.'
      : 'Bridger is quiet until your friends are here.';

  return (
    <Card className="items-center">
      {/* Analytics: card body is not a button; taps log dead_click. */}
      <AnalyticsRegion
        analyticsId={bodyId}
        interactive={false}
        accessibilityLabel={heading}
        className="items-center"
      >
        <Text accessible={false} className="text-[30px]">
          🌉
        </Text>
        <PixelHeading size="md" className="mt-3 text-center">
          {heading}
        </PixelHeading>
        <Text className="mt-2 text-center font-sans-sb text-[13px] text-ink-mute">
          {body}
        </Text>
      </AnalyticsRegion>
      <View className="mt-5 w-full gap-2.5">
        {friendsEmpty && onConnectContacts && !inviteLocked ? (
          <ButtonSecondary
            full
            size="md"
            tone="solid"
            icon={<UsersIcon size={16} color="#FFFFFF" strokeWidth={2.4} />}
            onPress={onConnectContacts}
            accessibilityLabel="Connect your contacts"
            analyticsId={FRIENDS.cold_start.connect_contacts}
            analyticsProps={{ method: 'contacts' }}
          >
            Connect your contacts
          </ButtonSecondary>
        ) : null}
        {!inviteLocked ? (
          <>
        <ButtonSecondary
          full
          size="md"
          tone={friendsEmpty ? 'outline' : 'solid'}
          icon={
            <LinkIcon
              size={16}
              color={friendsEmpty ? c.ink : '#FFFFFF'}
              strokeWidth={2.5}
            />
          }
          onPress={onAdd}
          accessibilityLabel="Share invite link"
          analyticsId={ctaId}
          analyticsProps={{ method: 'link' }}
        >
          Share invite link
        </ButtonSecondary>
        <ButtonSecondary
          full
          icon={<QrCodeIcon size={16} color={c.ink} strokeWidth={2.4} />}
          onPress={onAdd}
          accessibilityLabel="Your QR code"
          analyticsId={ctaId}
          analyticsProps={{ method: 'qr' }}
        >
          Your QR code
        </ButtonSecondary>
        <ButtonSecondary
          full
          icon={<ScanLineIcon size={16} color={c.ink} strokeWidth={2.4} />}
          onPress={onAdd}
          accessibilityLabel="Scan a code"
          analyticsId={ctaId}
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
