// ============================================
// WHAT THIS FILE DOES (plain English):
// The emoji strip that slides out sideways from the smiley button on a story.
// Tap the smiley, a row of emoji unrolls to the left of it; scroll it and tap
// one to send it as a reply. The "+" at the end lets you make your own sticker
// out of a photo you take, and your own stickers show up first afterwards.
//
// It is its own analytics SURFACE (sticker_tray, parent = story) so we can
// tell "opened the tray and sent nothing" from "never opened it".
// ACCESSIBILITY: the strip is a real horizontal list with labelled buttons,
// and the whole thing collapses back with one tap.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import { STICKER_TRAY } from '@bridger/shared';
import { AnalyticsRegion, SurfaceHost, withAnalyticsPress } from '@bridger/ui';
import { EMOJI_STICKERS, listCustomStickers, type CustomSticker } from '../../data/stickers';

type Props = {
  open: boolean;
  onClose: () => void;
  /** send this emoji as a sticker reply */
  onPickEmoji: (emoji: string) => void;
  /** send one of your own stickers */
  onPickCustom: (sticker: CustomSticker) => void;
  /** open the little studio where you make a new sticker */
  onCreateSticker: () => void;
  /** bumped by the parent after a new sticker is saved, so the strip refreshes */
  refreshKey?: number;
};

export function StickerTray({
  open,
  onClose,
  onPickEmoji,
  onPickCustom,
  onCreateSticker,
  refreshKey = 0
}: Props) {
  const [mine, setMine] = useState<CustomSticker[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);
  // 0 = tucked behind the button, 1 = fully unrolled
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    void listCustomStickers().then(setMine);
  }, [refreshKey, open]);

  // --- THE UNROLL: slides out from the button and fades in together ---
  useEffect(() => {
    if (reduceMotion) {
      reveal.setValue(open ? 1 : 0);
      return;
    }
    const anim = Animated.spring(reveal, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 90
    });
    anim.start();
    return () => anim.stop();
  }, [open, reveal, reduceMotion]);

  if (!open) return null;

  return (
    <SurfaceHost surface="sticker_tray" parentScreen="story" open={open}>
      {/* Tapping anywhere off the strip rolls it back up. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close stickers"
        onPress={withAnalyticsPress(STICKER_TRAY.picker.dismiss, onClose)}
        className="absolute inset-0"
      />

      <Animated.View
        style={{
          position: 'absolute',
          right: 62,
          top: '50%',
          marginTop: -26,
          maxWidth: '76%',
          opacity: reveal,
          transform: [
            {
              translateX: reveal.interpolate({
                inputRange: [0, 1],
                outputRange: [28, 0]
              })
            }
          ]
        }}
      >
        <AnalyticsRegion
          analyticsId={STICKER_TRAY.picker.strip}
          interactive={false}
          className="overflow-hidden rounded-full border-2 border-ink bg-white"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-row items-center gap-1 px-2 py-1.5"
          >
            {/* Make your own — first, so it is easy to find the first time. */}
            <Pressable
              onPress={withAnalyticsPress(STICKER_TRAY.picker.custom_sticker, onCreateSticker)}
              accessibilityRole="button"
              accessibilityLabel="Make your own sticker"
              className="h-11 w-11 items-center justify-center rounded-full bg-purple active:opacity-90"
            >
              <PlusIcon size={20} color="#FFFFFF" strokeWidth={3} />
            </Pressable>

            {/* Your own stickers sit ahead of the standard emoji. */}
            {mine.map((s) => (
              <Pressable
                key={s.id}
                onPress={withAnalyticsPress(
                  STICKER_TRAY.picker.emoji,
                  () => onPickCustom(s),
                  { analyticsProps: { method: 'custom_sticker' } }
                )}
                accessibilityRole="button"
                accessibilityLabel="Send your sticker"
                className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-ink-line active:opacity-90"
              >
                <Image
                  source={{ uri: s.uri }}
                  accessibilityIgnoresInvertColors
                  style={{ width: 44, height: 44, borderRadius: 22, resizeMode: 'cover' }}
                />
              </Pressable>
            ))}

            {EMOJI_STICKERS.map((e) => (
              <Pressable
                key={e}
                onPress={withAnalyticsPress(
                  STICKER_TRAY.picker.emoji,
                  () => onPickEmoji(e),
                  { analyticsProps: { method: 'sticker' } }
                )}
                accessibilityRole="button"
                accessibilityLabel={`Send ${e}`}
                className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F1ECFF]"
              >
                <Text className="text-[24px]">{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </AnalyticsRegion>
      </Animated.View>
    </SurfaceHost>
  );
}
