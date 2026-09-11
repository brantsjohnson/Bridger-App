// ============================================
// WHAT THIS FILE DOES (plain English):
// Edit one piece: frame, colour look, extra tilt, or swap / copy / delete.
// The page behind this sheet already shows the change.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  COLLAGE_LAYER,
  type CollageFilter,
  type CollageFrame,
  type CollageTilt,
  type ScrapbookElement
} from '@bridger/shared';
import { ButtonPrimary, Sheet, cn, withAnalyticsPress } from '@bridger/ui';

type Tab = 'more' | 'tilt' | 'colour' | 'frame';

const FRAMES: Array<{ id: CollageFrame; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'tape', label: 'Tape' },
  { id: 'film', label: 'Film' },
  { id: 'torn', label: 'Torn' }
];
const FILTERS: Array<{ id: CollageFilter; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'mono', label: 'Mono' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'retro', label: 'Retro' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'sepia', label: 'Sepia' }
];
const TILTS: Array<{ id: CollageTilt; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'pivot', label: 'Pivot' },
  { id: 'wave', label: 'Wave' },
  { id: 'slide', label: 'Slide' },
  { id: 'swivel', label: 'Swivel' },
  { id: 'rotate', label: 'Rotate' }
];

export function LayerEdit({
  open,
  onClose,
  element,
  onPatch,
  onSwap,
  onDuplicate,
  onDelete
}: {
  open: boolean;
  onClose: () => void;
  element: ScrapbookElement | null;
  onPatch: (data: ScrapbookElement['data']) => void;
  onSwap: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<Tab>('frame');
  if (!element) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit piece"
      surface="collage_layer"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_LAYER.chrome.dismiss}
      footer={
        <ButtonPrimary analyticsId={COLLAGE_LAYER.chrome.done} onPress={onClose}>
          Done
        </ButtonPrimary>
      }
    >
      <View className="mb-3 flex-row gap-2">
        {(['more', 'tilt', 'colour', 'frame'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={withAnalyticsPress(
              t === 'more'
                ? COLLAGE_LAYER.tabs.more
                : t === 'tilt'
                  ? COLLAGE_LAYER.tabs.tilt
                  : t === 'colour'
                    ? COLLAGE_LAYER.tabs.colour
                    : COLLAGE_LAYER.tabs.frame,
              () => setTab(t)
            )}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === t }}
            accessibilityLabel={t}
            className={cn(
              'h-11 flex-1 items-center justify-center rounded-full',
              tab === t ? 'bg-white' : 'bg-eggshell'
            )}
          >
            <Text className="font-sans-md capitalize text-ink">{t === 'more' ? '···' : t}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'more' ? (
        <View className="gap-2">
          <Row id={COLLAGE_LAYER.pick.swap} label="Swap photo" onPress={onSwap} />
          <Row id={COLLAGE_LAYER.pick.duplicate} label="Duplicate" onPress={onDuplicate} />
          <Row id={COLLAGE_LAYER.pick.delete} label="Delete" onPress={onDelete} danger />
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {(tab === 'frame' ? FRAMES : tab === 'colour' ? FILTERS : TILTS).map((opt) => {
            const current =
              tab === 'frame'
                ? element.data.frame
                : tab === 'colour'
                  ? element.data.filter
                  : element.data.tilt;
            const on = (current ?? 'none') === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={withAnalyticsPress(COLLAGE_LAYER.pick.option, () => {
                  if (tab === 'frame') onPatch({ frame: opt.id as CollageFrame });
                  if (tab === 'colour') onPatch({ filter: opt.id as CollageFilter });
                  if (tab === 'tilt') onPatch({ tilt: opt.id as CollageTilt });
                }, { analyticsProps: { option: opt.id } })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={opt.label}
                className={cn(
                  'h-11 min-w-[72px] items-center justify-center rounded-xl px-3',
                  on ? 'bg-ink' : 'bg-eggshell'
                )}
              >
                <Text className={cn('font-sans-md', on ? 'text-white' : 'text-ink')}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

function Row({
  id,
  label,
  onPress,
  danger
}: {
  id: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(id, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[44px] justify-center rounded-2xl bg-eggshell px-3"
    >
      <Text className={cn('font-sans-sb', danger ? 'text-[#D64A3A]' : 'text-ink')}>{label}</Text>
    </Pressable>
  );
}
