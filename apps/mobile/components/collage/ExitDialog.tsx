// ============================================
// WHAT THIS FILE DOES (plain English):
// Asked when you leave the editor with something on the page: keep the
// draft for later (it already lives on this phone) or throw it away.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { COLLAGE_EXIT } from '@bridger/shared';
import { ButtonPrimary, ButtonSecondary, Sheet } from '@bridger/ui';

export function ExitDialog({
  open,
  onClose,
  onDiscard,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Save for later?"
      surface="collage_exit"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_EXIT.actions.save}
    >
      <Text
        accessibilityRole="text"
        className="mb-4 font-sans-md text-[15px] text-ink/70"
      >
        Drafts wait on the calendar day they belong to, and in the start cards.
      </Text>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <ButtonSecondary analyticsId={COLLAGE_EXIT.actions.discard} onPress={onDiscard}>
            Discard
          </ButtonSecondary>
        </View>
        <View className="flex-[1.4]">
          <ButtonPrimary analyticsId={COLLAGE_EXIT.actions.save} onPress={onSave}>
            Save for later
          </ButtonPrimary>
        </View>
      </View>
    </Sheet>
  );
}
