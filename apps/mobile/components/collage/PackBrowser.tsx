// ============================================
// WHAT THIS FILE DOES (plain English):
// A list of collage packs. Tapping Use recodes the paper and the photos.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { COLLAGE_PACK_BROWSER, COLLAGE_PACKS, paperById } from '@bridger/shared';
import { Sheet, withAnalyticsPress } from '@bridger/ui';
import type { useScrapbookDraft } from '../../hooks/useScrapbookDraft';

export function PackBrowser({
  open,
  onClose,
  draft
}: {
  open: boolean;
  onClose: () => void;
  draft: ReturnType<typeof useScrapbookDraft>;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Packs"
      surface="collage_packs"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_PACK_BROWSER.chrome.dismiss}
    >
      {COLLAGE_PACKS.map((pack) => {
        const paper = paperById(pack.paperId);
        return (
          <View key={pack.id} className="mb-4">
            <Text className="font-sans-b text-[17px] text-ink">{pack.title}</Text>
            <Text className="mb-2 font-sans-md text-[12px] text-ink/55">{pack.subtitle}</Text>
            <View className="flex-row items-center">
              <View
                className="mr-3 h-16 w-12 rounded-md"
                style={{ backgroundColor: paper.color }}
                accessible={false}
              />
              <Pressable
                onPress={withAnalyticsPress(COLLAGE_PACK_BROWSER.list.use, () => {
                  draft.setPack(pack);
                  onClose();
                }, { analyticsProps: { pack_id: pack.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Use ${pack.title}`}
                className="h-11 items-center justify-center rounded-full bg-white px-4"
              >
                <Text className="font-sans-b text-ink">Use</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </Sheet>
  );
}
