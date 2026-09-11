// ============================================
// WHAT THIS FILE DOES (plain English):
// Pick the paper color, or a whole pack (paper + photo frames + colour look).
// The live page behind the sheet already updates as you tap.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  COLLAGE_PACKS,
  COLLAGE_PAPER,
  COLLAGE_PAPERS,
  paperIdFromColor
} from '@bridger/shared';
import { Sheet, SpectrumColorPicker, cn, withAnalyticsPress } from '@bridger/ui';
import type { useScrapbookDraft } from '../../hooks/useScrapbookDraft';
import { useCollageColors } from '../../hooks/useCollageColors';

export function PaperSheet({
  open,
  onClose,
  draft
}: {
  open: boolean;
  onClose: () => void;
  draft: ReturnType<typeof useScrapbookDraft>;
}) {
  const current = paperIdFromColor(draft.page.background.color);
  const bgColor = draft.page.background.color ?? '#F4F1E7';
  const { recents, remember } = useCollageColors();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Paper"
      surface="collage_paper"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_PAPER.chrome.dismiss}
    >
      <Text
        accessible={false}
        className="mb-2 font-pixel text-[10px] uppercase tracking-widest text-ink/55"
      >
        Paper
      </Text>
      <View className="flex-row flex-wrap gap-2 pb-4">
        {COLLAGE_PAPERS.map((p) => {
          const on = current === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={withAnalyticsPress(COLLAGE_PAPER.swatch.paper, () => draft.setPaper(p.id), {
                analyticsProps: { paper: p.id }
              })}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={p.label}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: p.color,
                borderWidth: on ? 3 : 1,
                borderColor: on ? '#0E0E0E' : 'rgba(28,27,22,0.2)'
              }}
            />
          );
        })}
      </View>
      <Text
        accessible={false}
        className="mb-2 font-pixel text-[10px] uppercase tracking-widest text-ink/55"
      >
        Or mix your own
      </Text>
      <View className="pb-4">
        <SpectrumColorPicker
          value={bgColor}
          onChange={(hex) => draft.setBackground(hex)}
          onCommit={remember}
          presets={COLLAGE_PAPERS.map((p) => p.color)}
          recents={recents}
          analyticsId={COLLAGE_PAPER.swatch.paper}
          spectrumAnalyticsId={COLLAGE_PAPER.swatch.spectrum}
        />
      </View>
      <Text
        accessible={false}
        className="mb-2 font-pixel text-[10px] uppercase tracking-widest text-ink/55"
      >
        Or a whole pack
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {COLLAGE_PACKS.map((pack) => (
          <Pressable
            key={pack.id}
            onPress={withAnalyticsPress(COLLAGE_PAPER.swatch.pack, () => draft.setPack(pack), {
              analyticsProps: { pack_id: pack.id }
            })}
            accessibilityRole="button"
            accessibilityLabel={`${pack.title}. ${pack.subtitle}`}
            className={cn('mr-2 rounded-full border px-3 py-2')}
            style={{ minHeight: 44, borderColor: 'rgba(28,27,22,0.2)' }}
          >
            <Text className="font-pixel text-[11px] text-ink">{pack.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Sheet>
  );
}
