// ============================================
// WHAT THIS FILE DOES (plain English):
// The Settings tab on your profile: appearance, who sees what, storage,
// Discover, page customization, notifications, blocked people, account, and
// Log out. Rows that lead to surfaces we haven't built yet show a small note
// instead of going nowhere silently. Log out is always reachable here, which
// the app stores require.
// ============================================
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Person } from '@bridger/shared';
import { ButtonSecondary, Card, ListRow, Toggle } from '@bridger/ui';
import { useColorScheme } from '../useColorScheme';
import type { StorageState } from '../../data/profile';
import { BlockedPeopleSheet } from './BlockedPeopleSheet';

export function ProfileSettings({
  blocked,
  storage,
  onUnblock,
  onSignOut
}: {
  blocked: Person[];
  storage: StorageState;
  onUnblock: (id: string) => void;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const scheme = useColorScheme();
  /** a standing preference for other people's pages — never your own */
  const [preferOriginal, setPreferOriginal] = useState(false);
  const [notifications, setNotifications] = useState(true);
  /** blocking is reversible, and undoing it lives here */
  const [blockedOpen, setBlockedOpen] = useState(false);

  // Surfaces that aren't built yet say so instead of silently doing nothing.
  const notYet = (what: string) => () =>
    Alert.alert(what, 'This screen is coming soon.');

  return (
    <View className="gap-2.5">
      <ListRow
        label="Appearance"
        sublabel={`${scheme === 'dark' ? 'Dark' : 'Light'} · follows your device`}
        onPress={notYet('Appearance')}
        trailing="chevron"
      />
      <ListRow
        label="Who sees what"
        sublabel="Close · Friends · Everyone"
        trailing="chevron"
        onPress={notYet('Who sees what')}
      />
      <ListRow
        label="Storage & plan"
        sublabel={`Free month · ${storage.usedPct}% used`}
        trailing="chevron"
        onPress={notYet('Storage & plan')}
      />
      <ListRow
        label="Discover"
        sublabel="Discoverable · match sources"
        trailing="chevron"
        onPress={() => router.push('/discover')}
      />
      <ListRow
        label="Customize your page"
        sublabel="Members only · make it yours"
        trailing="chevron"
        onPress={notYet('Customize your page')}
      />
      <ListRow
        label="Always show plain pages"
        sublabel="Skip other people's customization when you visit"
        action={
          <Toggle
            checked={preferOriginal}
            onChange={setPreferOriginal}
            label="Always show plain pages"
          />
        }
      />
      <ListRow
        label="Co-op"
        sublabel="Membership · what you get"
        trailing="chevron"
        onPress={notYet('Co-op')}
      />
      <ListRow
        label="Notifications"
        action={<Toggle checked={notifications} onChange={setNotifications} label="Notifications" />}
      />
      <ListRow
        label="Blocked people"
        sublabel={
          blocked.length > 0 ? `${blocked.length} blocked · nobody is ever told` : 'Nobody blocked'
        }
        trailing="chevron"
        onPress={() => setBlockedOpen(true)}
      />
      {/* Account leads to in-app account deletion when it ships — an app-store requirement */}
      <ListRow label="Account" trailing="chevron" onPress={notYet('Account')} />

      <Card>
        <ButtonSecondary full tone="ghost" onPress={onSignOut}>
          Log out
        </ButtonSecondary>
      </Card>

      <Text className="px-1 font-sans-md text-[11px] text-ink-mute">
        Anything you delete is removed from Bridger for good.
      </Text>

      <BlockedPeopleSheet
        open={blockedOpen}
        people={blocked}
        onClose={() => setBlockedOpen(false)}
        onUnblock={onUnblock}
      />
    </View>
  );
}
