// ============================================
// WHAT THIS FILE DOES (plain English):
// Co-op Theme + Layout customize. Members pick accent, background, font,
// light/dark, and reorder movable modules. Preview, then save. Header and
// tabs stay anchored. Modules with data can move but not be removed here.
// "View original" clears presentation so the accessible default returns.
// Code-tier CSS/HTML is not on this screen (admin-gated, later).
// ============================================
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Accent, MovableModule, ProfileFont } from "@bridger/shared";
import {
  CUSTOMIZE,
  MOVABLE_MODULE_ORDER,
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
  withAnalyticsPress,
} from "@bridger/ui";
import { getMembership } from "../../data/coop";
import {
  defaultPresentation,
  getProfilePresentation,
  saveProfilePresentation,
  withAccent,
  withBackgroundToken,
  withFont,
  type ProfileBackground,
  type ProfilePresentation,
} from "../../data/profile-presentation";

const FONTS: Array<{ id: ProfileFont; label: string }> = [
  { id: "clean", label: "Clean" },
  { id: "serif", label: "Serif" },
  { id: "pixel", label: "Pixel" },
  { id: "mono", label: "Mono" },
  { id: "round", label: "Round" },
];

const MODES: Array<{ id: "light" | "dark"; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const LAYOUT_LABELS: Record<MovableModule, string> = {
  mutuals: "Mutuals",
  top5: "Top 5",
  aboutMe: "About me",
  upcoming: "Upcoming",
  obsession: "Current Obsession",
  favorites: "Favorites",
  hobbies: "Hobbies",
  places: "Places",
  whereMet: "Where you met",
  recommendations: "Recommendations",
  timeline: "Life timeline",
  greatestHits: "Greatest hits",
};

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
  { id: "grid", label: "Soft gradient" },
];

const BACKGROUND_CLASS: Record<ProfileBackground, string> = {
  default: "bg-surface",
  eggshell: "bg-canvas",
  ink: "bg-[#0E0E0E]",
  grid: "bg-purple/15",
};

export default function CustomizeProfileScreen() {
  const router = useRouter();
  const [presentation, setPresentation] = useState<ProfilePresentation>(
    defaultPresentation(),
  );
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
    setPresentation((current) => withAccent(current, accent));
    setViewOriginal(false);
    lastStep.current = "accent";
    trackFlowStep("customize_profile", "accent", { surface: "customize" });
  }

  function chooseBackground(background: ProfileBackground) {
    setPresentation((current) => withBackgroundToken(current, background));
    setViewOriginal(false);
    lastStep.current = "background";
    trackFlowStep("customize_profile", "background", { surface: "customize" });
  }

  function chooseFont(font: ProfileFont) {
    setPresentation((current) => withFont(current, font));
    setViewOriginal(false);
    lastStep.current = "font";
    trackFlowStep("customize_profile", "font", { surface: "customize" });
  }

  function chooseMode(mode: "light" | "dark") {
    setPresentation((current) => ({ ...current, mode }));
    setViewOriginal(false);
    lastStep.current = "mode";
    trackFlowStep("customize_profile", "mode", { surface: "customize" });
  }

  /** Move a layout module up one slot (header + tabs stay anchored off-list). */
  function moveModule(index: number, dir: -1 | 1) {
    setPresentation((current) => {
      const order = [...(current.layoutOrder ?? [...MOVABLE_MODULE_ORDER])];
      const next = index + dir;
      if (next < 0 || next >= order.length) return current;
      const tmp = order[index];
      order[index] = order[next];
      order[next] = tmp;
      return { ...current, layoutOrder: order };
    });
    setViewOriginal(false);
    lastStep.current = "layout";
    trackFlowStep("customize_profile", "layout", { surface: "customize" });
  }

  // --- SAVE: null means the fixed, accessible original presentation. ---
  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    lastStep.current = "save";
    trackFlowStep("customize_profile", "save", { surface: "customize" });
    try {
      await saveProfilePresentation(viewOriginal ? null : presentation);
      const dwell = Date.now() - startedAt.current;
      trackProduct("profile_customized", {
        enabled: !viewOriginal,
        accent: viewOriginal ? undefined : presentation.accent,
        background: viewOriginal ? undefined : presentation.background,
      });
      // Product events fire on confirmed save only (never on the first chip tap).
      if (!viewOriginal) {
        trackProduct("profile_theme_saved", {
          accent: presentation.accent,
          background: presentation.background,
          font: presentation.fontId ?? presentation.font,
          mode: presentation.mode,
          dwell_ms: dwell,
        });
        trackProduct("profile_layout_saved", {
          module_count: (presentation.layoutOrder ?? MOVABLE_MODULE_ORDER)
            .length,
          dwell_ms: dwell,
        });
      }
      completed.current = true;
      trackFlowCompleted("customize_profile", dwell, {
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

  const activeFont = presentation.fontId ?? presentation.font ?? "clean";
  const activeMode = presentation.mode ?? "light";

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
            Change the look, not the facts. Theme colors and fonts restyle the
            page. Layout reorders modules. Header and tabs stay put. Privacy
            tiers never change here.
          </Text>
        </AnalyticsRegion>

        {/* ACCENT / PALETTE: approved DESIGN.md colors only. */}
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

        {/* BACKGROUND: color / gradient tokens (image assetId later). */}
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

        {/* FONT: allowlisted Bridger-hosted display fonts only. */}
        <Text className="mb-2 font-pixel text-[18px] text-ink">Font</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {FONTS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              accent={presentation.accent}
              selected={!viewOriginal && activeFont === option.id}
              onPress={() => chooseFont(option.id)}
              analyticsId={CUSTOMIZE.style.font_option}
              analyticsProps={{ font: option.id }}
            />
          ))}
        </View>

        {/* MODE: light / dark for the themed page. */}
        <Text className="mb-2 font-pixel text-[18px] text-ink">Mode</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {MODES.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              accent={presentation.accent}
              selected={!viewOriginal && activeMode === option.id}
              onPress={() => chooseMode(option.id)}
              analyticsId={CUSTOMIZE.style.mode_option}
              analyticsProps={{ mode: option.id }}
            />
          ))}
        </View>

        {/* LAYOUT: reorder movable modules only (header + tabs stay anchored). */}
        <Text className="mb-2 font-pixel text-[18px] text-ink">Layout order</Text>
        <Text className="mb-3 font-sans-sb text-[12px] text-ink-mute">
          Header and tabs stay at the top. Modules with data can move but cannot
          be removed here.
        </Text>
        <View className="mb-6 gap-2">
          {(presentation.layoutOrder ?? [...MOVABLE_MODULE_ORDER]).map(
            (mod, index) => (
              <View
                key={mod}
                className="min-h-[48px] flex-row items-center justify-between rounded-card border border-ink-line bg-surface px-3"
              >
                <Pressable
                  onPress={withAnalyticsPress(
                    CUSTOMIZE.layout.module_row,
                    () => undefined,
                  )}
                  accessibilityRole="text"
                  accessibilityLabel={LAYOUT_LABELS[mod]}
                  className="min-w-0 flex-1"
                >
                  <Text className="font-sans-b text-[14px] text-ink">
                    {LAYOUT_LABELS[mod]}
                  </Text>
                </Pressable>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={withAnalyticsPress(CUSTOMIZE.layout.reorder, () =>
                      moveModule(index, -1),
                    )}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${LAYOUT_LABELS[mod]} up`}
                    disabled={index === 0}
                    className="h-10 w-10 items-center justify-center rounded-full border border-ink-line"
                  >
                    <Text className="font-sans-b text-[14px] text-ink">↑</Text>
                  </Pressable>
                  <Pressable
                    onPress={withAnalyticsPress(CUSTOMIZE.layout.reorder, () =>
                      moveModule(index, 1),
                    )}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${LAYOUT_LABELS[mod]} down`}
                    disabled={
                      index ===
                      (presentation.layoutOrder ?? MOVABLE_MODULE_ORDER)
                        .length -
                        1
                    }
                    className="h-10 w-10 items-center justify-center rounded-full border border-ink-line"
                  >
                    <Text className="font-sans-b text-[14px] text-ink">↓</Text>
                  </Pressable>
                </View>
              </View>
            ),
          )}
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
                Theme and layout only. Facts stay where they belong.
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
