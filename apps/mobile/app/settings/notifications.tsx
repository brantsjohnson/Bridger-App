// ============================================
// WHAT THIS FILE DOES (plain English):
// Profile → Settings → Notifications. First: who can nudge you (Close /
// Friends / Acquaintances — Acquaintances off by default). Then: each
// notification kind with its own on/off switch (invites, reminders, etc.
// are separate, not one "Events" bucket). Prefs gate push only.
// Spec: NOTIFICATIONS.md.
// ============================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  NOTIFICATION_CIRCLE_OPTIONS,
  NOTIFICATION_KIND_PREFS,
  NOTIFICATIONS,
  trackProduct,
  type NotificationCircleId,
  type NotificationKind,
  type NotificationPrefsState
} from '@bridger/shared';
import {
  AnalyticsRegion,
  ListRow,
  Screen,
  ScreenBody,
  ScreenHeader,
  Toggle
} from '@bridger/ui';
import {
  getNotificationPrefs,
  setNotificationCirclePref,
  setNotificationKindPref
} from '../../data/notification-prefs';

/** Group kind rows under their section title for the Settings list. */
function groupKindsBySection() {
  const sections: Array<{ title: string; items: typeof NOTIFICATION_KIND_PREFS }> = [];
  for (const pref of NOTIFICATION_KIND_PREFS) {
    const last = sections[sections.length - 1];
    if (last && last.title === pref.section) {
      last.items.push(pref);
    } else {
      sections.push({ title: pref.section, items: [pref] });
    }
  }
  return sections;
}

export default function NotificationPrefsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefsState | null>(null);
  const sections = useMemo(() => groupKindsBySection(), []);

  useEffect(() => {
    let alive = true;
    getNotificationPrefs().then((p) => {
      if (alive) setPrefs(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  // --- WHO: Close / Friends / Acquaintances ---
  const toggleCircle = useCallback(async (id: NotificationCircleId, on: boolean) => {
    setPrefs((prev) =>
      prev ? { ...prev, circles: { ...prev.circles, [id]: on } } : prev
    );
    const next = await setNotificationCirclePref(id, on);
    setPrefs(next);
    trackProduct('notification_pref_changed', {
      pref: id,
      pref_scope: 'circle',
      enabled: on
    });
  }, []);

  // --- WHAT: one switch per notification kind ---
  const toggleKind = useCallback(async (kind: NotificationKind, on: boolean) => {
    setPrefs((prev) =>
      prev ? { ...prev, kinds: { ...prev.kinds, [kind]: on } } : prev
    );
    const next = await setNotificationKindPref(kind, on);
    setPrefs(next);
    trackProduct('notification_pref_changed', {
      pref: kind,
      pref_scope: 'kind',
      enabled: on
    });
  }, []);

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        onBack={() => router.back()}
        hideProfile
        backAnalyticsId={NOTIFICATIONS.prefs.back}
        titleAnalyticsId={NOTIFICATIONS.prefs.page_title}
        analyticsSurface="notification_prefs"
      />
      <ScreenBody tabBarInset={false}>
        <AnalyticsRegion
          analyticsId={NOTIFICATIONS.prefs.intro_body}
          interactive={false}
        >
          <Text className="mb-4 font-sans-sb text-[13px] leading-snug text-ink-mute">
            Choose who can nudge you and what we nudge you about. Turning one
            off stops push for that item; you still see it in Alerts when you
            open the app.
          </Text>
        </AnalyticsRegion>

        {/* Who — circle filters; Acquaintances defaults off */}
        <AnalyticsRegion
          analyticsId={NOTIFICATIONS.prefs.who_header}
          interactive={false}
        >
          <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
            Who can nudge you
          </Text>
        </AnalyticsRegion>
        <View className="mb-6 gap-2.5">
          {NOTIFICATION_CIRCLE_OPTIONS.map((c) => (
            <ListRow
              key={c.id}
              label={c.label}
              sublabel={c.description}
              action={
                <Toggle
                  checked={prefs?.circles[c.id] ?? c.defaultOn}
                  onChange={(on) => void toggleCircle(c.id, on)}
                  label={c.label}
                  analyticsId={NOTIFICATIONS.prefs.toggle}
                  analyticsProps={{ pref: c.id, pref_scope: 'circle' }}
                />
              }
            />
          ))}
        </View>

        {/* What — individual kinds, grouped only for reading */}
        {sections.map((section) => (
          <View key={section.title} className="mb-5">
            <AnalyticsRegion
              analyticsId={NOTIFICATIONS.prefs.section_header}
              interactive={false}
              analyticsProps={{ section: section.title }}
            >
              <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                {section.title}
              </Text>
            </AnalyticsRegion>
            <View className="gap-2.5">
              {section.items.map((p) => (
                <ListRow
                  key={p.kind}
                  label={p.label}
                  sublabel={p.description}
                  action={
                    <Toggle
                      checked={prefs?.kinds[p.kind] ?? p.defaultOn}
                      onChange={(on) => void toggleKind(p.kind, on)}
                      label={p.label}
                      analyticsId={NOTIFICATIONS.prefs.toggle}
                      analyticsProps={{ pref: p.kind, pref_scope: 'kind' }}
                    />
                  }
                />
              ))}
            </View>
          </View>
        ))}
        <View className="h-8" />
      </ScreenBody>
    </Screen>
  );
}
