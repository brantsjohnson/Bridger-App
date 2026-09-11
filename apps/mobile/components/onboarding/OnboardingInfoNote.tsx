// ============================================
// WHAT THIS FILE DOES (plain English):
// The little ⓘ on New-onboarding info screens. Tap it to read the proof
// behind a claim (no ads, how groups nest, what a co-op is). Closing without
// reading still counts as leaving the note.
//
// ACCESSIBILITY: the ⓘ is a button. The sheet has a title and a Close.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { ONBOARDING, dismissSurface, openSurface } from '@bridger/shared';
import { AnalyticsRegion, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { OB, OB_BORDER } from './onboarding-theme';

export function OnboardingInfoNote({
  label,
  body,
  ink
}: {
  label: string;
  body: string;
  /** Type color so the ⓘ stays readable on inverted info screens. */
  ink?: string;
}) {
  const theme = useThemeColors();
  const [open, setOpen] = useState(false);
  const openedAt = useRef(0);
  const color = ink ?? theme.ink;

  useEffect(() => {
    if (open) {
      openedAt.current = Date.now();
      openSurface('onboarding_info_note', 'onboarding');
    }
  }, [open]);

  const close = () => {
    dismissSurface('onboarding_info_note', {
      dwell_ms: Date.now() - openedAt.current
    });
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={withAnalyticsPress(ONBOARDING.chrome.info_note, () => setOpen(true), {
          analyticsProps: { method: 'tap' }
        })}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: OB_BORDER,
          borderColor: color,
          borderRadius: 999,
          backgroundColor: theme.surface
        }}
      >
        <Text className="font-sans-b text-[15px]" style={{ color }}>
          ⓘ
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close note"
          style={{
            flex: 1,
            backgroundColor: 'rgba(28,27,22,0.45)',
            justifyContent: 'center',
            paddingHorizontal: 24
          }}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              backgroundColor: theme.surface,
              borderWidth: OB_BORDER,
              borderColor: theme.ink,
              padding: 20,
              gap: 12
            }}
          >
            <AnalyticsRegion
              analyticsId={ONBOARDING.chrome.step_title}
              interactive={false}
            >
              <Text className="font-sans-b text-[16px]" style={{ color: theme.ink }}>
                {label}
              </Text>
            </AnalyticsRegion>
            <Text
              className="font-sans-sb text-[14px]"
              style={{ color: theme.inkSoft, lineHeight: 20 }}
            >
              {body}
            </Text>
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.chrome.skip, close)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: OB.pink
              }}
            >
              <Text className="font-sans-b text-[14px]" style={{ color: OB.onColor }}>
                Close
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
