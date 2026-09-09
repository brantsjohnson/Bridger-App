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
// LOOK: one big photo square up top (plain white box with a clear plus when
// empty), a filter picker row right under it (Pop art / X-ray / Comic / Sepia),
// then the two typing boxes. All the paint comes from the shared onboarding parts.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, Text, View } from 'react-native';
import { ONBOARDING, trackUi } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep, useOnboardingBodyScroll } from './OnboardingStep';
import { PhotoFilterPicker, type PhotoFilterKey } from './PhotoFilterPicker';
import { FilteredPhoto, isServerPhotoFilter } from './photo-filters/FilteredPhoto';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBField } from './onboarding-ui';
import { isDemoMode } from '../../lib/demo';
import { bakeClientPhotoFilter } from '../../lib/client-photo-filters';
import { bakeServerPhotoFilter } from '../../lib/photo-filters';
import type { PhotoSource } from '../../data/onboarding';

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
  onFilteredBakeChange,
  onChangeFirst,
  onChangeLast,
  onPickPhoto,
  onNext,
  onBack,
  layout = 'full',
  ask,
  blurb,
  cta,
  skipLabel,
  onSkip
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
   * Reports the bake result: filtered media id (live), original media id, and
   * a preview URL (demo data-URL or signed link). Null clears all three.
   */
  onFilteredBakeChange: (bake: {
    mediaId: string | null;
    originalMediaId: string | null;
    previewUrl: string | null;
  } | null) => void;
  onChangeFirst: (v: string) => void;
  onChangeLast: (v: string) => void;
  onPickPhoto: (s: PhotoSource) => void;
  onNext: () => void;
  onBack: () => void;
  /** full = Old confirm screen. photo = New photo-only screen. */
  layout?: 'full' | 'photo';
  ask?: string;
  blurb?: string;
  cta?: string;
  skipLabel?: string;
  onSkip?: () => void;
}) {
  // THIS SECTION DOES: slide name fields up when the keyboard covers them.
  const { ensureVisible } = useOnboardingBodyScroll();

  // THIS SECTION DOES: server-baked looks (Pop art, Comic, X-ray, Sepia). We
  // cache each result per photo + filter so switching pills does not re-run
  // the work each time. Pop art still shows the Warhol grid as an instant
  // preview while this bake finishes for the saved avatar.
  const [bakedUrl, setBakedUrl] = useState<string | null>(null);
  const [bakedLoading, setBakedLoading] = useState(false);
  const bakedCache = useRef<
    Map<string, { url: string; mediaId: string; originalMediaId: string }>
  >(new Map());
  // Keep the latest "report bake up" callback without re-triggering the effect.
  const reportRef = useRef(onFilteredBakeChange);
  reportRef.current = onFilteredBakeChange;

  // THIS SECTION DOES: decide if we can move on. Name + photo are required.
  // Server looks may still be baking in the background; Continue stays on so a
  // slow filter never traps anyone (we finish the bake on Continue if needed).
  const hasPhoto = Boolean(photoUri || photoEmoji);
  const ready =
    layout === 'photo'
      ? true
      : first.trim().length > 0 && last.trim().length > 0 && hasPhoto;
  const cameraLabel = photoSource === 'camera' && hasPhoto ? 'Retake' : 'Take a photo';

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
      setBakedLoading(false);
      setBakedUrl(cached.url);
      reportRef.current({
        mediaId: cached.mediaId || null,
        originalMediaId: cached.originalMediaId || null,
        previewUrl: cached.url
      });
      return;
    }

    let cancelled = false;
    setBakedLoading(true);
    setBakedUrl(null);

    const finish = (
      url: string | null,
      mediaId: string | null,
      originalMediaId: string | null
    ) => {
      if (cancelled) return;
      if (url) {
        bakedCache.current.set(cacheKey, {
          url,
          mediaId: mediaId ?? '',
          originalMediaId: originalMediaId ?? ''
        });
        setBakedUrl(url);
      } else {
        setBakedUrl(null);
      }
      reportRef.current(
        url || mediaId
          ? {
              mediaId,
              originalMediaId,
              previewUrl: url
            }
          : null
      );
      setBakedLoading(false);
    };

    // THIS SECTION DOES: never leave Comic / X-ray spinning forever. A hung
    // upload or slow ImageMagick used to trap the preview on a spinner.
    const BAKE_TIMEOUT_MS = 20000;
    const timeoutId = setTimeout(() => {
      if (__DEV__) {
        console.warn('[photo-filter] bake timed out', serverFilter);
      }
      finish(null, null, null);
    }, BAKE_TIMEOUT_MS);

    const finishOnce = (
      url: string | null,
      mediaId: string | null,
      originalMediaId: string | null
    ) => {
      clearTimeout(timeoutId);
      finish(url, mediaId, originalMediaId);
    };

    if (isDemoMode()) {
      if (Platform.OS !== 'web') {
        // Native demo: try the live API when signed in; otherwise clear spinner.
        bakeServerPhotoFilter(photoUri, serverFilter)
          .then((res) => finishOnce(res.url, res.mediaId, res.originalMediaId))
          .catch(() => {
            bakeClientPhotoFilter(photoUri, serverFilter)
              .then((url) => finishOnce(url, null, null))
              .catch(() => finishOnce(null, null, null));
          });
        return () => {
          cancelled = true;
          clearTimeout(timeoutId);
        };
      }
      bakeClientPhotoFilter(photoUri, serverFilter)
        .then((url) => finishOnce(url, null, null))
        .catch(() => finishOnce(null, null, null));
      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    }

    bakeServerPhotoFilter(photoUri, serverFilter)
      .then((res) => finishOnce(res.url, res.mediaId, res.originalMediaId))
      .catch((err) => {
        // Surface a quiet failure so a missing API never looks like a broken filter.
        if (__DEV__) {
          console.warn('[photo-filter] bake failed', serverFilter, err);
        }
        finishOnce(null, null, null);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
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
      ask={ask ?? 'Confirm your details'}
      blurb={blurb}
      cta={cta ?? 'Continue'}
      ctaDisabled={!ready}
      scrollBody
      continueAnalyticsId={
        layout === 'photo' ? ONBOARDING.confirm_profile.photo_square : undefined
      }
      onContinue={() => {
        if (layout === 'photo' && !hasPhoto) {
          openPhotoSheet();
          return;
        }
        onNext();
      }}
      skipLabel={skipLabel}
      skipAnalyticsId={
        layout === 'photo' ? ONBOARDING.confirm_profile.photo_skip : undefined
      }
      onSkip={onSkip}
      onBack={onBack}
    >
      <View style={{ gap: 28 }}>
        {/* THIS SECTION DOES: photo square (with a required * in New) plus looks. */}
        <View style={{ gap: 12, alignSelf: 'stretch' }}>
          {layout === 'photo' ? (
            <Text
              className="font-sans-sb text-[13px]"
              style={{ color: OB.navy }}
              accessibilityLabel="Profile photo, required"
            >
              Profile photo *
            </Text>
          ) : null}
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.confirm_profile.photo_square, openPhotoSheet)}
            accessibilityRole="button"
            accessibilityLabel={
              hasPhoto
                ? 'Change profile photo, required'
                : 'Add a profile photo, required'
            }
            accessibilityHint="Required. You can add one later with the skip link."
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

        {layout === 'photo' ? null : (
          <View style={{ gap: 18 }}>
            <OBField
              label="First name"
              required
              value={first}
              onChange={onChangeFirst}
              placeholder="Yo"
              autoCapitalize="words"
              analyticsId={ONBOARDING.confirm_profile.first_input}
              onFocusExtra={(anchor) => ensureVisible(anchor)}
            />
            <OBField
              label="Last name"
              required
              value={last}
              onChange={onChangeLast}
              placeholder="Mamma"
              autoCapitalize="words"
              analyticsId={ONBOARDING.confirm_profile.last_input}
              onFocusExtra={(anchor) => ensureVisible(anchor)}
            />
          </View>
        )}
      </View>
    </OnboardingStep>
  );
}
