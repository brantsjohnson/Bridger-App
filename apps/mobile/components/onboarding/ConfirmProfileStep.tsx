// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 1 - "Confirm your details." One screen that gathers the three things a
// friend needs to recognize you: first name, last name, and a profile photo.
// Name is required (Continue stays off until both are filled); the photo can be
// taken in-app or uploaded (the one upload exception, stories stay capture-only)
// and is skippable. Tapping the big photo square opens the system action sheet
// (Take a photo / Upload), so permission is only asked in context, never at
// launch; the picked photo previews right here.
//
// LOOK: one big photo square up top (graph paper filling the box + a clear
// plus), then the two typing boxes. All the paint comes from the shared
// onboarding parts.
// ============================================
import React from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, Text, View } from 'react-native';
import { ONBOARDING, trackUi } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBField, OBGridPatch } from './onboarding-ui';
import type { PhotoSource } from '../../data/onboarding';

/** Big empty avatar square. Large enough to read as the main photo action. */
const PHOTO_PX = 168;
/** Graph paper step inside the square (smaller cells so the + still reads). */
const GRID_STEP = 28;

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
  const hasPhoto = Boolean(photoUri || photoEmoji);
  const cameraLabel = photoSource === 'camera' && hasPhoto ? 'Retake' : 'Take a photo';

  // THIS SECTION DOES: open the phone's own action sheet so Take a photo /
  // Upload are not sitting on the page. Camera / library permissions still
  // only fire after they pick one of those choices.
  const openPhotoSheet = () => {
    const pickCamera = () => {
      trackUi(
        'click',
        photoSource === 'camera' && hasPhoto
          ? ONBOARDING.confirm_profile.retake
          : ONBOARDING.confirm_profile.take
      );
      onPickPhoto('camera');
    };
    const pickUpload = () => {
      trackUi('click', ONBOARDING.confirm_profile.upload);
      onPickPhoto('library');
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', cameraLabel, 'Upload'],
          cancelButtonIndex: 0
        },
        (index) => {
          if (index === 1) pickCamera();
          if (index === 2) pickUpload();
        }
      );
      return;
    }

    // Android (and web): the system Alert sheet is the closest native-feeling
    // menu for the same two choices.
    Alert.alert('Add a photo', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: cameraLabel, onPress: pickCamera },
      { text: 'Upload', onPress: pickUpload }
    ]);
  };

  return (
    <OnboardingStep
      step={step}
      total={total}
      ask="Confirm your details"
      ctaDisabled={!ready}
      onContinue={onNext}
      onBack={onBack}
    >
      <View style={{ gap: 28 }}>
        {/* THIS SECTION DOES: one big tappable photo square. Empty = graph paper
            + plus. Filled = their picture. Tap opens Take photo / Upload. */}
        <Pressable
          onPress={withAnalyticsPress(ONBOARDING.confirm_profile.photo_square, openPhotoSheet)}
          accessibilityRole="button"
          accessibilityLabel={
            hasPhoto ? 'Change profile photo' : 'Add a profile photo'
          }
          style={{
            width: PHOTO_PX,
            height: PHOTO_PX,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: OB.paper,
            borderWidth: OB_BORDER,
            borderColor: OB.navy
          }}
        >
          {photoUri || photoEmoji ? null : (
            <OBGridPatch size={PHOTO_PX} step={GRID_STEP} left={0} top={0} />
          )}
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              accessibilityLabel="Your selected profile photo"
              resizeMode="cover"
              style={{ width: PHOTO_PX, height: PHOTO_PX }}
            />
          ) : photoEmoji ? (
            <Text className="text-[64px]" accessibilityLabel="Your emoji avatar">
              {photoEmoji}
            </Text>
          ) : (
            <Text
              style={{ fontSize: 48, lineHeight: 52, fontWeight: '600', color: OB.navy }}
              accessible={false}
            >
              +
            </Text>
          )}
        </Pressable>

        {/* THE NAME: first + last, the only required answers. */}
        <View style={{ gap: 18 }}>
          <OBField
            label="First name"
            value={first}
            onChange={onChangeFirst}
            placeholder="Brant"
            autoCapitalize="words"
            analyticsId={ONBOARDING.confirm_profile.first_input}
          />
          <OBField
            label="Last name"
            value={last}
            onChange={onChangeLast}
            placeholder="Kim"
            autoCapitalize="words"
            analyticsId={ONBOARDING.confirm_profile.last_input}
          />
        </View>
      </View>
    </OnboardingStep>
  );
}
