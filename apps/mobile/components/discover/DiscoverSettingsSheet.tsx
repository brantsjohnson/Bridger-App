// ============================================
// WHAT THIS FILE DOES (plain English):
// Discover settings: master Discoverable switch, what you're matched on
// (About-me category toggles + quiz toggles), and a locked note that
// personality signals never appear on your profile. "Turn matching off"
// returns to the gate.
// Analytics: own surface discover_settings_sheet; toggles use DISCOVER.settings_sheet.*.
// ============================================
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LockIcon } from 'lucide-react-native';
import type { DiscoverSettings } from '@bridger/shared';
import { DISCOVER } from '@bridger/shared';
import {
  ButtonSecondary,
  Card,
  ListRow,
  Sheet,
  Toggle,
  useThemeColors
} from '@bridger/ui';
import { ABOUT_ME_CATEGORIES } from '../../data/discover';

/** True when this About-me category is on for matching (defaults on). */
function categoryOn(
  settings: DiscoverSettings,
  id: string
): boolean {
  const map = settings.sources.aboutMeCategories;
  if (map && id in map) return map[id] !== false;
  // No per-category map yet: follow the About-me master.
  return settings.sources.aboutMe !== false;
}

export function DiscoverSettingsSheet({
  open,
  onClose,
  settings,
  onSetDiscoverable,
  onSetSources,
  onTurnOff
}: {
  open: boolean;
  onClose: () => void;
  settings: DiscoverSettings;
  onSetDiscoverable: (on: boolean) => void;
  onSetSources: (patch: Partial<DiscoverSettings['sources']>) => void;
  onTurnOff: () => void;
}) {
  const c = useThemeColors();

  function toggleCategory(id: string, on: boolean) {
    // Build a full map so every category has an explicit yes/no.
    const next: Record<string, boolean> = {};
    for (const cat of ABOUT_ME_CATEGORIES) {
      next[cat.id] = cat.id === id ? on : categoryOn(settings, cat.id);
    }
    const anyOn = Object.values(next).some(Boolean);
    onSetSources({
      aboutMeCategories: next,
      aboutMe: anyOn
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Discover settings"
      surface="discover_settings_sheet"
      parentScreen="discover"
      dismissAnalyticsId={DISCOVER.settings_sheet.dismiss}
    >
      <ScrollView className="max-h-[520px]" showsVerticalScrollIndicator={false}>
        <View className="gap-2.5">
          <ListRow
            label="Discoverable"
            sublabel={
              settings.discoverable ? 'Matching is on' : 'Nobody can find you'
            }
            action={
              <Toggle
                checked={settings.discoverable}
                onChange={onSetDiscoverable}
                label="Discoverable"
                analyticsId={DISCOVER.settings_sheet.discoverable_toggle}
              />
            }
          />

          {/* THIS SECTION DOES: turn each About-me signal on or off for matching */}
          <View className="gap-1.5">
            <Text className="px-1 font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
              About me · everyone can see
            </Text>
            {ABOUT_ME_CATEGORIES.map((a) => {
              const on = categoryOn(settings, a.id);
              return (
                <ListRow
                  key={a.id}
                  label={a.label}
                  action={
                    <Toggle
                      checked={on}
                      onChange={(v) => toggleCategory(a.id, v)}
                      label={a.label}
                      analyticsId={DISCOVER.settings_sheet.about_me_toggle}
                      analyticsProps={{ category: a.id }}
                    />
                  }
                />
              );
            })}
          </View>

          <ListRow
            label="Onboarding quiz"
            sublabel="Result shared, scoring private"
            action={
              <Toggle
                checked={settings.sources.onboardingQuiz}
                onChange={(v) => onSetSources({ onboardingQuiz: v })}
                label="Onboarding quiz"
                analyticsId={DISCOVER.settings_sheet.source_toggle}
              />
            }
          />

          <ListRow
            label="Discover Me questionnaire"
            sublabel="Deeper match signals"
            action={
              <Toggle
                checked={settings.sources.discoverMe}
                onChange={(v) => onSetSources({ discoverMe: v })}
                label="Discover Me questionnaire"
                analyticsId={DISCOVER.settings_sheet.source_toggle}
              />
            }
          />

          <Card className="flex-row items-start gap-2.5 p-4">
            <LockIcon
              size={16}
              color={c.inkMute}
              strokeWidth={2.5}
              style={{ marginTop: 2 }}
            />
            <Text className="flex-1 font-sans-sb text-[13px] leading-snug text-ink-soft">
              Personality signals help matching. They never appear on your
              profile.
            </Text>
          </Card>

          <ButtonSecondary
            full
            analyticsId={DISCOVER.settings_sheet.discoverable_toggle}
            onPress={() => {
              onClose();
              onTurnOff();
            }}
            accessibilityLabel="Turn matching off"
          >
            Turn matching off
          </ButtonSecondary>
        </View>
      </ScrollView>
    </Sheet>
  );
}
