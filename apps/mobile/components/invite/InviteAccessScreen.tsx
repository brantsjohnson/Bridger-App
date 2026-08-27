// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen gate during demo week: you must invite a friend before the rest
// of Bridger unlocks. Tapping invite asks for contacts, then shares your link.
// ============================================
import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { UserPlusIcon } from 'lucide-react-native';
import { INVITE_ACCESS, openSurface } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody
} from '@bridger/ui';
import {
  ContactInviteSheet,
  type ContactPick
} from './ContactInviteSheet';
import {
  loadInviteContacts,
  sendInviteToContact,
  shareInviteForAccess
} from '../../lib/invite-from-contacts';

export function InviteAccessScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactPick[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  React.useEffect(() => {
    openSurface('invite_access');
  }, []);

  const goHome = () => {
    router.replace('/home');
  };

  const onInvite = async () => {
    setBusy(true);
    setError(null);
    try {
      const { contacts: list, permission } = await loadInviteContacts();
      if (list.length > 0) {
        setContacts(list);
        setPickerOpen(true);
        return;
      }
      const result = await shareInviteForAccess();
      if (!result.ok) {
        if (!result.cancelled) setError(result.message);
        return;
      }
      goHome();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send invite.');
    } finally {
      setBusy(false);
    }
  };

  const onPick = async (contact: ContactPick) => {
    setPickerOpen(false);
    setBusy(true);
    setError(null);
    try {
      const result = await sendInviteToContact(contact);
      if (!result.ok) {
        if (!result.cancelled) setError(result.message);
        return;
      }
      goHome();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send invite.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="bg-canvas">
      <ScreenBody className="flex-1 justify-center px-5">
        <View className="items-center">
          <AnalyticsRegion
            analyticsId={INVITE_ACCESS.body}
            interactive={false}
            accessibilityLabel="Invite a friend to get access"
            className="items-center"
          >
            <Text accessible={false} className="text-[40px]">
              🌉
            </Text>
            <PixelHeading size="lg" className="mt-4 text-center">
              Invite a friend to get access
            </PixelHeading>
            <Text className="mt-3 text-center font-sans-sb text-[14px] leading-snug text-ink-mute">
              Bridger is in a small TestFlight demo this week. Pick someone you know
              and send them your personal link. They can join you; during the demo they
              will not be able to invite others.
            </Text>
          </AnalyticsRegion>

          {error ? (
            <Text className="mt-4 text-center font-sans-sb text-[13px] text-danger">
              {error}
            </Text>
          ) : null}

          <View className="mt-8 w-full">
            <ButtonSecondary
              full
              size="lg"
              tone="solid"
              disabled={busy}
              icon={
                busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <UserPlusIcon size={18} strokeWidth={2.5} color="#FFFFFF" />
                )
              }
              analyticsId={INVITE_ACCESS.invite_button}
              onPress={() => void onInvite()}
              accessibilityLabel="Invite a friend"
            >
              {busy ? 'Opening contacts…' : 'Invite a friend'}
            </ButtonSecondary>
          </View>
        </View>
      </ScreenBody>

      <ContactInviteSheet
        open={pickerOpen}
        contacts={contacts}
        onPick={(c) => void onPick(c)}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}
