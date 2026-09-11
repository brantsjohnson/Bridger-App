// ============================================
// WHAT THIS FILE DOES (plain English):
// The profile YOU made for a friend who is not on Bridger yet. You can write
// private notes here. When they sign up with the same phone number, this card
// is replaced by their real profile and your notes stay with you.
//
// PRIVACY: only you can see this card and these notes. They never see them.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PENDING_PROFILE, openSurface } from '@bridger/shared';
import {
  AnalyticsRegion,
  Avatar,
  ButtonSecondary,
  Card,
  Screen,
  ScreenBody,
  ScreenHeader
} from '@bridger/ui';
import { NotesReminders } from '../../components/profile/NotesReminders';
import {
  getPendingPerson,
  type PendingPerson
} from '../../data/pending-people';
import { sendInviteToContact } from '../../lib/invite-from-contacts';

export default function PendingProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<PendingPerson | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    openSurface('pending_profile');
  }, []);

  // THIS SECTION DOES: load the card you made, or jump to their real profile.
  useEffect(() => {
    if (!id) return;
    void getPendingPerson(id).then((row) => {
      if (!row) {
        router.replace('/(tabs)/friends');
        return;
      }
      if (row.mergedUserId) {
        router.replace({
          pathname: '/person/[id]',
          params: { id: row.mergedUserId }
        });
        return;
      }
      setPerson(row);
    });
  }, [id, router]);

  const name = person?.displayName?.trim() || 'A friend';
  const first = name.split(' ')[0] ?? name;

  const invite = async () => {
    if (!person) return;
    setInviting(true);
    try {
      const result = await sendInviteToContact(
        {
          id: person.id,
          name,
          phone: person.phoneE164
        },
        'friends'
      );
      if (!result.ok && !result.cancelled) {
        Alert.alert('Could not send invite', result.message);
      }
    } finally {
      setInviting(false);
    }
  };

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title={name}
        analyticsSurface="pending_profile"
        onBack={() => router.back()}
      />
      <ScreenBody>
        {!person ? (
          <Text className="font-sans-sb text-[14px] text-ink-mute">Loading</Text>
        ) : (
          <View className="gap-5">
            <Card className="items-center">
              <AnalyticsRegion
                analyticsId={PENDING_PROFILE.header.name}
                interactive={false}
                accessibilityLabel={`${name}, card you made`}
                className="items-center"
              >
                <Avatar name={name} size="lg" />
                <Text className="mt-3 font-sans-b text-[20px] text-ink">{name}</Text>
              </AnalyticsRegion>
              <AnalyticsRegion
                analyticsId={PENDING_PROFILE.header.status}
                interactive={false}
                accessibilityLabel="Not on Bridger yet. Only you can see this card."
                className="mt-2 items-center"
              >
                <Text className="text-center font-sans-sb text-[13px] text-ink-mute">
                  Not on Bridger yet. This card is only yours. When they join with
                  this number, their real profile takes over and your notes stay.
                </Text>
              </AnalyticsRegion>
              <View className="mt-4 w-full">
                <ButtonSecondary
                  full
                  size="md"
                  tone="solid"
                  loading={inviting}
                  onPress={() => void invite()}
                  accessibilityLabel={`Invite ${first}`}
                  analyticsId={PENDING_PROFILE.actions.invite}
                >
                  Invite {first}
                </ButtonSecondary>
              </View>
            </Card>

            <NotesReminders pendingPersonId={person.id} firstName={first} />
          </View>
        )}
      </ScreenBody>
    </Screen>
  );
}
