// ============================================
// WHAT THIS FILE DOES (plain English):
// The Settings tab on your profile: appearance, who sees what, storage,
// Discover, page customization, notifications (opens per-group prefs), blocked
// people, account, and Log out. Rows that lead to surfaces we haven't built yet
// show a small note instead of going nowhere silently. Log out is always
// reachable here, which the app stores require.
// Analytics: each row uses PROFILE.settings.* so taps land in PostHog by name.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Person } from '@bridger/shared';
import { PROFILE } from '@bridger/shared';
import { ButtonSecondary, Card, ListRow, Toggle } from '@bridger/ui';
import { useColorScheme } from '../useColorScheme';
import type { StorageState } from '../../data/profile';
import {
  getAlwaysViewOriginal,
  setAlwaysViewOriginal
} from '../../data/profile-presentation';
import {
  fetchAssistantSettings,
  setAssistantEnabled
} from '../../data/assistant';
import { getMembership } from '../../data/coop';
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
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [assistantOn, setAssistantOn] = useState(false);
  // THIS SECTION DOES: stop a slow Settings load from flipping the toggle back off
  // after you already switched it (Settings unmounts when you leave the tab).
  const assistantTouched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void getAlwaysViewOriginal().then((v) => {
      if (!cancelled) setPreferOriginal(v);
    });
    void fetchAssistantSettings().then((s) => {
      if (cancelled) return;
      setAssistantVisible(s.assistantVisible);
      if (!assistantTouched.current) {
        setAssistantOn(s.assistantEnabled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  /** blocking is reversible, and undoing it lives here */
  const [blockedOpen, setBlockedOpen] = useState(false);

  // Surfaces that aren't built yet say so instead of silently doing nothing.
  const notYet = (what: string) => () =>
    Alert.alert(what, 'This screen is coming soon.');

  // Co-op members enter the customize flow. Free accounts get a clear join choice.
  const openCustomize = async () => {
    try {
      const member = storage.plan === 'coop' || (await getMembership()).member;
      if (member) {
        router.push('/profile/customize');
        return;
      }
      Alert.alert('Co-op membership', 'Join the co-op to customize your profile.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'See membership', onPress: () => router.push('/coop') }
      ]);
    } catch {
      Alert.alert('Could not check membership', 'Please try again in a moment.');
    }
  };

  return (
    <View className="gap-2.5">
      <ListRow
        label="Appearance"
        sublabel={`${scheme === 'dark' ? 'Dark' : 'Light'} · follows your device`}
        onPress={notYet('Appearance')}
        trailing="chevron"
        analyticsId={PROFILE.settings.appearance}
      />
      <ListRow
        label="Who sees what"
        sublabel="Close · Friends · Everyone"
        trailing="chevron"
        onPress={notYet('Who sees what')}
        analyticsId={PROFILE.settings.who_sees_what}
      />
      {/* No dedicated taxonomy id for Storage yet — leave uninstrumented (gap). */}
      <ListRow
        label="Storage & plan"
        sublabel={
          storage.plan === 'coop'
            ? `Co-op allotment · ${storage.usedPct}% used`
            : `Free month · ${storage.usedPct}% used`
        }
        trailing="chevron"
        onPress={notYet('Storage & plan')}
        analyticsId={PROFILE.settings.storage_plan}
      />
      <ListRow
        label="Discover"
        sublabel="Discoverable · match sources"
        trailing="chevron"
        onPress={() => router.push('/discover')}
        analyticsId={PROFILE.settings.discover_toggle}
      />
      <ListRow
        label="Customize your page"
        sublabel="Members only · make it yours"
        trailing="chevron"
        onPress={() => void openCustomize()}
        analyticsId={PROFILE.settings.customize_profile}
      />
      <ListRow
        label="Always show plain pages"
        sublabel="Skip other people's customization when you visit"
        action={
          <Toggle
            checked={preferOriginal}
            onChange={(v) => {
              setPreferOriginal(v);
              void setAlwaysViewOriginal(v);
            }}
            label="Always show plain pages"
            analyticsId={PROFILE.settings.always_original}
          />
        }
      />
      <ListRow
        label="Co-op"
        sublabel="Membership · what you get"
        trailing="chevron"
        onPress={() => router.push('/coop')}
        analyticsId={PROFILE.settings.coop}
      />
      <ListRow
        label="Notifications"
        sublabel="Choose what we nudge you about"
        trailing="chevron"
        onPress={() => router.push('/settings/notifications')}
        analyticsId={PROFILE.settings.notifications}
      />
      {assistantVisible ? (
        <>
          <ListRow
            label="Assistant"
            sublabel="Help manage friendships from what you've saved. Off by default."
            action={
              <Toggle
                checked={assistantOn}
                onChange={(v) => {
                  assistantTouched.current = true;
                  setAssistantOn(v);
                  void setAssistantEnabled(v).catch(() => {
                    setAssistantOn(!v);
                    Alert.alert(
                      'Could not update Assistant',
                      'Please try again in a moment.'
                    );
                  });
                }}
                label="Assistant"
                analyticsId={PROFILE.settings.assistant_toggle}
              />
            }
          />
          {assistantOn ? (
            <ListRow
              label="Open Assistant"
              sublabel="Ask about notes, dates, and reconnects"
              trailing="chevron"
              onPress={() =>
                router.push({ pathname: '/assistant', params: { entry: 'settings' } })
              }
              analyticsId={PROFILE.settings.assistant_open}
            />
          ) : null}
        </>
      ) : null}
      <ListRow
        label="Blocked people"
        sublabel={
          blocked.length > 0 ? `${blocked.length} blocked · nobody is ever told` : 'Nobody blocked'
        }
        trailing="chevron"
        onPress={() => setBlockedOpen(true)}
        analyticsId={PROFILE.settings.blocked_people}
      />
      {/* Account leads to in-app account deletion when it ships — an app-store requirement */}
      <ListRow
        label="Account"
        trailing="chevron"
        onPress={notYet('Account')}
        analyticsId={PROFILE.settings.account}
      />

      <Card>
        <ButtonSecondary
          full
          tone="ghost"
          onPress={onSignOut}
          analyticsId={PROFILE.settings.log_out}
        >
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
