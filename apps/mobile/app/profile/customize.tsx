// ============================================
// WHAT THIS FILE DOES (plain English):
// The first co-op profile customize screen. Members pick one approved accent
// and one safe background token, preview the result, and save it. The fixed
// profile widgets and every field's visibility stay untouched. "View original"
// clears presentation settings so the accessible default is always available.
// ============================================
import React, { useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Accent } from "@bridger/shared";
import {
  CUSTOMIZE,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct,
} from "@bridger/shared";
import {
  AnalyticsRegion,
  ButtonPrimary,
  Chip,
  ColorCard,
  Screen,
  ScreenBody,
  ScreenHeader,
  Toggle,
  cn,
} from "@bridger/ui";
import { getMembership } from "../../data/coop";
import {
  getProfilePresentation,
  saveProfilePresentation,
  type ProfileBackground,
  type ProfilePresentation,
} from "../../data/profile-presentation";

const ACCENTS: Array<{ id: Accent; label: string }> = [
  { id: "purple", label: "Purple" },
  { id: "coral", label: "Coral" },
  { id: "teal", label: "Teal" },
  { id: "amber", label: "Amber" },
  { id: "pink", label: "Pink" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
];

const BACKGROUNDS: Array<{ id: ProfileBackground; label: string }> = [
  { id: "default", label: "Default" },
  { id: "eggshell", label: "Warm eggshell" },
  { id: "ink", label: "Dark ink" },
  { id: "grid", label: "Drifting grid" },
];

const BACKGROUND_CLASS: Record<ProfileBackground, string> = {
  default: "bg-surface",
  eggshell: "bg-canvas",
  ink: "bg-[#0E0E0E]",
  grid: "bg-purple/15",
};

export default function CustomizeProfileScreen() {
  const router = useRouter();
  const [presentation, setPresentation] = useState<ProfilePresentation>({
    accent: "purple",
    background: "default",
  });
  const [viewOriginal, setViewOriginal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const startedAt = useRef(Date.now());
  const completed = useRef(false);
  const lastStep = useRef("open");

  // --- MEMBERSHIP + CURRENT STYLE: the server remains the final save gate. ---
  useEffect(() => {
    let alive = true;
    trackFlowStarted("customize_profile", {
      surface: "customize",
      parent_screen: "profile.settings",
    });
    trackFlowStep("customize_profile", "open", { surface: "customize" });

    Promise.all([getMembership(), getProfilePresentation()])
      .then(([membership, current]) => {
        if (!alive) return;
        if (!membership.member) {
          Alert.alert(
            "Co-op membership",
            "Join the co-op to customize your profile.",
            [
              {
                text: "Not now",
                onPress: () => router.back(),
                style: "cancel",
              },
              {
                text: "See membership",
                onPress: () => router.replace("/coop"),
              },
            ],
          );
          return;
        }
        if (current) setPresentation(current);
        setViewOriginal(!current);
        setReady(true);
      })
      .catch(() => {
        if (alive)
          Alert.alert("Could not load styles", "Please try again in a moment.");
      });

    return () => {
      alive = false;
      if (!completed.current) {
        trackFlowAbandoned(
          "customize_profile",
          Date.now() - startedAt.current,
          lastStep.current,
          { surface: "customize" },
        );
      }
    };
  }, [router]);

  function chooseAccent(accent: Accent) {
    setPresentation((current) => ({ ...current, accent }));
    setViewOriginal(false);
    lastStep.current = "accent";
    trackFlowStep("customize_profile", "accent", { surface: "customize" });
  }

  function chooseBackground(background: ProfileBackground) {
    setPresentation((current) => ({ ...current, background }));
    setViewOriginal(false);
    lastStep.current = "background";
    trackFlowStep("customize_profile", "background", { surface: "customize" });
  }

  // --- SAVE: null means the fixed, accessible original presentation. ---
  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    lastStep.current = "save";
    trackFlowStep("customize_profile", "save", { surface: "customize" });
    try {
      await saveProfilePresentation(viewOriginal ? null : presentation);
      trackProduct("profile_customized", {
        enabled: !viewOriginal,
        accent: viewOriginal ? undefined : presentation.accent,
        background: viewOriginal ? undefined : presentation.background,
      });
      completed.current = true;
      trackFlowCompleted("customize_profile", Date.now() - startedAt.current, {
        surface: "customize",
        flow_step: "save",
      });
      router.back();
    } catch {
      Alert.alert(
        "Could not save style",
        "Your profile was not changed. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title="Customize profile"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="customize"
        backAnalyticsId={CUSTOMIZE.top_nav.back}
        titleAnalyticsId={CUSTOMIZE.top_nav.page_title}
      />
      <ScreenBody tabBarInset={false}>
        <AnalyticsRegion
          analyticsId={CUSTOMIZE.style.intro_body}
          interactive={false}
        >
          <Text className="mb-5 font-sans-sb text-[13px] leading-snug text-ink-mute">
            Change the presentation, not the facts. Your profile sections stay
            in the same order and keep the same privacy settings.
          </Text>
        </AnalyticsRegion>

        {/* ACCENT: approved DESIGN.md colors only. */}
        <Text className="mb-2 font-pixel text-[18px] text-ink">Accent</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {ACCENTS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              accent={option.id}
              selected={!viewOriginal && presentation.accent === option.id}
              onPress={() => chooseAccent(option.id)}
              analyticsId={CUSTOMIZE.style.accent_option}
              analyticsProps={{ accent: option.id }}
            />
          ))}
        </View>

        {/* BACKGROUND: token choices keep contrast predictable and URLs out. */}
        <Text className="mb-2 font-pixel text-[18px] text-ink">Background</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {BACKGROUNDS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              accent={presentation.accent}
              selected={!viewOriginal && presentation.background === option.id}
              onPress={() => chooseBackground(option.id)}
              analyticsId={CUSTOMIZE.style.background_option}
              analyticsProps={{ background: option.id }}
            />
          ))}
        </View>

        {/* PREVIEW: a small sample, never a second editable profile layout. */}
        <AnalyticsRegion
          analyticsId={CUSTOMIZE.style.preview}
          interactive={false}
        >
          <View
            className={cn(
              "mb-5 rounded-card border border-ink-line p-3",
              BACKGROUND_CLASS[
                viewOriginal ? "default" : presentation.background
              ],
            )}
          >
            <ColorCard accent={viewOriginal ? "purple" : presentation.accent}>
              <Text className="font-pixel text-[20px] text-onaccent">
                Your profile
              </Text>
              <Text className="mt-1 font-sans-sb text-[13px] text-onaccent/85">
                Core widgets stay fixed and easy to find.
              </Text>
            </ColorCard>
          </View>
        </AnalyticsRegion>

        <View className="mb-5 flex-row items-center justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text className="font-sans-b text-[14px] text-ink">
              View original
            </Text>
            <Text className="font-sans-md text-[12px] text-ink-mute">
              Clear custom presentation on save
            </Text>
          </View>
          <Toggle
            checked={viewOriginal}
            onChange={setViewOriginal}
            label="View original"
            analyticsId={CUSTOMIZE.actions.view_original}
          />
        </View>

        <ButtonPrimary
          full
          onPress={() => void save()}
          disabled={!ready}
          loading={saving}
          analyticsId={CUSTOMIZE.actions.save}
        >
          Save profile style
        </ButtonPrimary>
        <View className="h-8" />
      </ScreenBody>
    </Screen>
  );
}
