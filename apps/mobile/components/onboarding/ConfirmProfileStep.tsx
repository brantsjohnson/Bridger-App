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
// plus), a filter picker row right under it (Pop art / X-ray / Comic / Sepia),
// then the two typing boxes. All the paint comes from the shared onboarding parts.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, Text, View } from 'react-native';
import { ONBOARDING, trackUi } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { PhotoFilterPicker, type PhotoFilterKey } from './PhotoFilterPicker';
import { FilteredPhoto, isServerPhotoFilter } from './photo-filters/FilteredPhoto';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBField, OBGridPatch } from './onboarding-ui';
import { isDemoMode } from '../../lib/demo';
import { bakeClientPhotoFilter } from '../../lib/client-photo-filters';
import { bakeServerPhotoFilter } from '../../lib/photo-filters';
import type { PhotoSource } from '../../data/onboarding';

/** Graph paper step inside the photo square. */
const GRID_STEP = 28;

export function ConfirmProfileStep({
  step,
  total,
  first,
  last,
  photoSource,
  photoUri,
  photoEmoji,
  photoFilter,
  onChangePhotoFilter,
  onFilteredMediaIdChange,
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
  /** Which look is picked in the row under the photo. */
  photoFilter: PhotoFilterKey;
  onChangePhotoFilter: (filter: PhotoFilterKey) => void;
  /**
   * Reports the media id to save as the avatar: the server-baked picture when a
   * server look (Comic or X-ray) is ready, or null to save the plain photo instead.
   */
  onFilteredMediaIdChange: (mediaId: string | null) => void;
  onChangeFirst: (v: string) => void;
  onChangeLast: (v: string) => void;
  onPickPhoto: (s: PhotoSource) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // THIS SECTION DOES: decide if we can move on. A friend needs to recognize you,
  // so all three are required now: first name, last name, AND a photo.
  const hasPhoto = Boolean(photoUri || photoEmoji);
  const ready = first.trim().length > 0 && last.trim().length > 0 && hasPhoto;
  // THIS SECTION DOES: measure the photo box so the grid paper fills the full width.
  const [photoSize, setPhotoSize] = useState(0);
  const cameraLabel = photoSource === 'camera' && hasPhoto ? 'Retake' : 'Take a photo';

  // THIS SECTION DOES: server-rendered looks (Comic, X-ray, Sepia). We cache each
  // result per photo + filter so switching pills does not re-run the work each time.
  const [bakedUrl, setBakedUrl] = useState<string | null>(null);
  const [bakedLoading, setBakedLoading] = useState(false);
  const bakedCache = useRef<Map<string, { url: string; mediaId: string }>>(new Map());
  // Keep the latest "report id up" callback without re-triggering the effect.
  const reportRef = useRef(onFilteredMediaIdChange);
  reportRef.current = onFilteredMediaIdChange;

  // THIS SECTION DOES: when a server look is picked, bake it. Live users hit the
  // API; demo web (localhost:8090) paints in the browser instead.
  useEffect(() => {
    const serverFilter = isServerPhotoFilter(photoFilter) ? photoFilter : null;

    if (!serverFilter || !photoUri) {
      setBakedUrl(null);
      reportRef.current(null);
      return;
    }

    const cacheKey = `${photoUri}:${serverFilter}`;
    const cached = bakedCache.current.get(cacheKey);
    if (cached) {
      setBakedUrl(cached.url);
      reportRef.current(cached.mediaId || null);
      return;
    }

    let cancelled = false;
    setBakedLoading(true);
    setBakedUrl(null);

    const finish = (url: string | null, mediaId: string | null) => {
      if (cancelled) return;
      if (url) {
        bakedCache.current.set(cacheKey, { url, mediaId: mediaId ?? '' });
        setBakedUrl(url);
      } else {
        setBakedUrl(null);
      }
      reportRef.current(mediaId);
      setBakedLoading(false);
    };

    if (isDemoMode()) {
      if (Platform.OS !== 'web') {
        finish(null, null);
        return;
      }
      bakeClientPhotoFilter(photoUri, serverFilter)
        .then((url) => finish(url, null))
        .catch(() => finish(null, null));
      return () => {
        cancelled = true;
      };
    }

    bakeServerPhotoFilter(photoUri, serverFilter)
      .then((res) => finish(res.url, res.mediaId))
      .catch((err) => {
        // Surface a quiet failure so a missing API never looks like a broken filter.
        if (__DEV__) {
          console.warn('[photo-filter] bake failed', serverFilter, err);
        }
        finish(null, null);
      });

    return () => {
      cancelled = true;
    };
  }, [photoFilter, photoUri]);

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

    // Web: Alert.alert silently no-ops (no dialog module). The browser file
    // chooser is the upload path anyway (camera uses the same chooser on web).
    if (Platform.OS === 'web') {
      trackUi('click', ONBOARDING.confirm_profile.upload);
      onPickPhoto('library');
      return;
    }

    // Android: the system Alert sheet is the closest native-feeling menu.
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
      scrollBody
      onContinue={onNext}
      onBack={onBack}
    >
      <View style={{ gap: 28 }}>
        {/* THIS SECTION DOES: photo square plus the filter picker tucked right under it. */}
        <View style={{ gap: 12, alignSelf: 'stretch' }}>
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.confirm_profile.photo_square, openPhotoSheet)}
            onLayout={(e) => setPhotoSize(e.nativeEvent.layout.width)}
            accessibilityRole="button"
            accessibilityLabel={
              hasPhoto ? 'Change profile photo' : 'Add a profile photo'
            }
            style={{
              alignSelf: 'stretch',
              aspectRatio: 1,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: OB.paper,
              borderWidth: OB_BORDER,
              borderColor: OB.navy
            }}
          >
            {photoUri || photoEmoji ? null : photoSize > 0 ? (
              <OBGridPatch size={photoSize} step={GRID_STEP} left={0} top={0} />
            ) : null}
            {photoUri ? (
              <FilteredPhoto
                uri={photoUri}
                filter={photoFilter}
                bakedUrl={bakedUrl}
                bakedLoading={bakedLoading}
                accessibilityLabel="Your selected profile photo"
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

          <PhotoFilterPicker value={photoFilter} onChange={onChangePhotoFilter} />
        </View>

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
