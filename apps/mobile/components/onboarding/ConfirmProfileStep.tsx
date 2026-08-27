// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 2 — "Confirm your details." One screen that gathers the three things a
// friend needs to recognize you: first name, last name, and a profile photo.
// Name is required (Continue stays off until both are filled); the photo can be
// taken in-app or uploaded (the one upload exception, stories stay capture-only)
// and is skippable. The permission dialog is shown in context (only when you tap
// Take a photo / Upload), never at launch; the picked photo previews right here.
// ============================================
import React from 'react';
import { Image, Text, View } from 'react-native';
import { CameraIcon, ImageIcon, PlusIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { ButtonSecondary, TextField } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import type { PhotoSource } from '../../data/onboarding';

/** Square avatar preview size. */
const PHOTO_PX = 96;

export function ConfirmProfileStep({
  step,
  total,
  first,
  last,
  photoSource,
  photoUri,
  photoEmoji,
  onChangeFirst,
  onChangeLast,
  onPickPhoto,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  first: string;
  last: string;
  photoSource: PhotoSource | null;
  photoUri: string | null;
  photoEmoji?: string | null;
  onChangeFirst: (v: string) => void;
  onChangeLast: (v: string) => void;
  onPickPhoto: (s: PhotoSource) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // Name is the one required answer, so Continue waits for both fields.
  const ready = first.trim().length > 0 && last.trim().length > 0;

  return (
    <OnboardingStep
      step={step}
      total={total}
      ask="Confirm your details"
      accent="purple"
      ctaDisabled={!ready}
      onContinue={onNext}
      onBack={onBack}
    >
      <View className="gap-5">
        {/* THIS SECTION DOES: photo on the left, Take / Upload on the right. */}
        <View className="flex-row items-center gap-4">
          <View
            className={`h-24 w-24 items-center justify-center overflow-hidden rounded-card border-2 border-onaccent/25 ${
              photoUri ? 'bg-onaccent/10' : photoSource || photoEmoji ? 'bg-purple' : 'bg-onaccent/10'
            }`}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                accessibilityLabel="Your selected profile photo"
                resizeMode="cover"
                style={{ width: PHOTO_PX, height: PHOTO_PX }}
              />
            ) : photoEmoji ? (
              <Text className="text-[48px]" accessibilityLabel="Your emoji avatar">
                {photoEmoji}
              </Text>
            ) : (
              <PlusIcon size={28} color="#1C1B16" strokeWidth={2.4} accessible={false} />
            )}
          </View>
          <View className="flex-1 gap-2">
            <ButtonSecondary
              full
              tone={photoSource === 'camera' ? 'outline' : 'solid'}
              icon={<CameraIcon size={16} strokeWidth={2.5} />}
              analyticsId={
                photoSource === 'camera'
                  ? ONBOARDING.confirm_profile.retake
                  : ONBOARDING.confirm_profile.take
              }
              onPress={() => onPickPhoto('camera')}
              accessibilityLabel={photoSource === 'camera' ? 'Retake photo' : 'Take a photo'}
            >
              {photoSource === 'camera' ? 'Retake' : 'Take a photo'}
            </ButtonSecondary>
            <ButtonSecondary
              full
              icon={<ImageIcon size={16} strokeWidth={2.5} />}
              analyticsId={ONBOARDING.confirm_profile.upload}
              onPress={() => onPickPhoto('library')}
              accessibilityLabel="Upload a photo"
            >
              Upload
            </ButtonSecondary>
          </View>
        </View>

        {/* THE NAME: first + last, the only required answers. */}
        <View className="gap-3">
          <TextField
            label="First name"
            labelTone="onaccent"
            value={first}
            onChange={onChangeFirst}
            placeholder="Brant"
            analyticsId={ONBOARDING.confirm_profile.first_input}
          />
          <TextField
            label="Last name"
            labelTone="onaccent"
            value={last}
            onChange={onChangeLast}
            placeholder="Kim"
            analyticsId={ONBOARDING.confirm_profile.last_input}
          />
        </View>
      </View>
    </OnboardingStep>
  );
}
