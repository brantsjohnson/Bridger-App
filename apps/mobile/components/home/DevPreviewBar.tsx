// ============================================
// WHAT THIS FILE DOES (plain English):
// A small bar at the top of Home when demo mode is on (not every local build)
// with two buttons so you can jump straight into the CRT intro or a fresh
// onboarding demo without hunting for hidden passwords. It never shows in
// production or for signed-in users who are not in demo mode.
// ============================================
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { HOME } from '@bridger/shared';
import { ButtonSecondary } from '@bridger/ui';
import { prepCrtIntroPreview, prepOnboardingPreview } from '../../lib/demo';

export function DevPreviewBar() {
  const router = useRouter();

  // THIS SECTION DOES: reset the welcome flag and open the CRT intro movie.
  async function onCrtIntro() {
    await prepCrtIntroPreview();
    router.replace('/welcome');
  }

  // THIS SECTION DOES: start a fresh onboarding run with a prefilled demo person.
  async function onOnboarding() {
    await prepOnboardingPreview();
    router.replace('/onboarding');
  }

  return (
    <View className="mb-4 rounded-2xl border-2 border-dashed border-ink/25 bg-ink/[0.04] px-4 py-3">
      <Text className="mb-2 font-sans-sb text-[11px] uppercase tracking-widest text-ink-mute">
        Dev preview
      </Text>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <ButtonSecondary
            full
            size="sm"
            onPress={() => void onCrtIntro()}
            accessibilityLabel="Play CRT intro"
            analyticsId={HOME.dev_preview.crt_intro}
          >
            CRT intro
          </ButtonSecondary>
        </View>
        <View className="flex-1">
          <ButtonSecondary
            full
            size="sm"
            onPress={() => void onOnboarding()}
            accessibilityLabel="Try onboarding flow"
            analyticsId={HOME.dev_preview.onboarding}
          >
            Onboarding
          </ButtonSecondary>
        </View>
      </View>
    </View>
  );
}
