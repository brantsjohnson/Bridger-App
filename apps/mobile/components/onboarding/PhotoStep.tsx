// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 4 — your profile photo. The one place an upload is allowed (stories stay
// capture-only). Take one or upload; either way the same house filter is
// applied so every profile shares a look. Demo just simulates the pick.
// TODO (live): request camera / photo-library permission with a purpose string
// right here, in context, never at launch (see CURSOR-RULES.md).
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { CameraIcon, ImageIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { ButtonSecondary, Chip } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import type { PhotoSource } from '../../data/onboarding';

export function PhotoStep({
  step,
  total,
  source,
  onPick,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  source: PhotoSource | null;
  onPick: (s: PhotoSource) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="One look, everyone. Your version of it."
      ask="Add your photo"
      accent="pink"
      ctaDisabled={!source}
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="items-center">
        <View
          className={`h-52 w-52 items-center justify-center rounded-full border-2 border-ink ${
            source ? 'bg-pink' : 'bg-ink/[0.04]'
          }`}
        >
          <Text className="text-[60px]" accessible={false}>
            {source ? '🌸' : '📷'}
          </Text>
        </View>

        <View className="mt-4">
          <Chip label="House filter on" accent="pink" selected size="sm" />
        </View>

        <View className="mt-5 w-full flex-row gap-2.5">
          <View className="flex-1">
            <ButtonSecondary
              full
              size="lg"
              tone={source === 'camera' ? 'outline' : 'solid'}
              icon={<CameraIcon size={16} strokeWidth={2.5} />}
              analyticsId={source === 'camera' ? ONBOARDING.photo.retake : ONBOARDING.photo.take}
              onPress={() => onPick('camera')}
              accessibilityLabel={source === 'camera' ? 'Retake photo' : 'Take a photo'}
            >
              {source === 'camera' ? 'Retake' : 'Take one'}
            </ButtonSecondary>
          </View>
          <View className="flex-1">
            <ButtonSecondary
              full
              size="lg"
              icon={<ImageIcon size={16} strokeWidth={2.5} />}
              analyticsId={ONBOARDING.photo.upload}
              onPress={() => onPick('library')}
              accessibilityLabel="Upload a photo"
            >
              Upload
            </ButtonSecondary>
          </View>
        </View>
      </View>
    </OnboardingStep>
  );
}
