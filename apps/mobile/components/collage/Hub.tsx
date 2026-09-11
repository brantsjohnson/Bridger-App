// ============================================
// WHAT THIS FILE DOES (plain English):
// The "+" sheet on the collage editor. One tap adds a kind of piece:
// words, camera, camera roll, voice, a friend tag, a layout, paper, or
// a cut-out. Camera roll is allowed here (the ZIP said no; product says yes).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CameraIcon,
  ImagesIcon,
  LayoutGridIcon,
  MicIcon,
  PaletteIcon,
  ScissorsIcon,
  TypeIcon,
  UserPlusIcon
} from 'lucide-react-native';
import { COLLAGE_HUB } from '@bridger/shared';
import { Sheet, withAnalyticsPress } from '@bridger/ui';

export type HubAction =
  | 'text'
  | 'camera'
  | 'roll'
  | 'voice'
  | 'people'
  | 'layout'
  | 'paper'
  | 'cutout';

const ITEMS: Array<{
  id: HubAction;
  label: string;
  Icon: typeof TypeIcon;
  analyticsId: string;
}> = [
  { id: 'text', label: 'Text', Icon: TypeIcon, analyticsId: COLLAGE_HUB.grid.text },
  { id: 'camera', label: 'Camera', Icon: CameraIcon, analyticsId: COLLAGE_HUB.grid.camera },
  { id: 'roll', label: 'Camera roll', Icon: ImagesIcon, analyticsId: COLLAGE_HUB.grid.roll },
  { id: 'voice', label: 'Voice', Icon: MicIcon, analyticsId: COLLAGE_HUB.grid.voice },
  { id: 'people', label: 'Tag a friend', Icon: UserPlusIcon, analyticsId: COLLAGE_HUB.grid.people },
  { id: 'layout', label: 'Layout', Icon: LayoutGridIcon, analyticsId: COLLAGE_HUB.grid.layout },
  { id: 'paper', label: 'Paper', Icon: PaletteIcon, analyticsId: COLLAGE_HUB.grid.paper },
  { id: 'cutout', label: 'Cut out', Icon: ScissorsIcon, analyticsId: COLLAGE_HUB.grid.cutout }
];

export function Hub({
  open,
  onClose,
  onPick
}: {
  open: boolean;
  onClose: () => void;
  onPick: (action: HubAction) => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add to the page"
      surface="collage_hub"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_HUB.chrome.dismiss}
    >
      <View
        accessibilityRole="none"
        accessibilityLabel="Add to the page"
        className="flex-row flex-wrap justify-between px-1 pb-4"
      >
        {ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={withAnalyticsPress(item.analyticsId, () => {
              onPick(item.id);
              onClose();
            })}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            className="mb-4 w-[23%] items-center"
            style={{ minHeight: 72 }}
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F1E7]">
              <item.Icon size={22} color="#1C1B16" strokeWidth={2.2} />
            </View>
            <Text className="mt-1 text-center font-sans-md text-[11px] text-ink">
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
