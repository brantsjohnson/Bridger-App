// ============================================
// WHAT THIS FILE DOES (plain English):
// Type a line of words, pick a real font, drag a slider to set the size (the
// number shows right on the slider), and mix any color you want with the
// rainbow picker. The preview at the top always shows exactly how it will look
// on the page. Tap Done to drop it on the page, where you can drag it around.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent
} from 'react-native';
import {
  COLLAGE_FONTS,
  COLLAGE_TEXT,
  COLLAGE_TEXT_COLORS,
  collageFontFamily,
  collageFontIsCaps,
  type ScrapbookElement
} from '@bridger/shared';
import {
  ButtonPrimary,
  Sheet,
  SpectrumColorPicker,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import { useCollageColors } from '../../hooks/useCollageColors';

// The size the slider can reach. Body text floors at a readable size.
const MIN_SIZE = 12;
const MAX_SIZE = 96;

export function TextComposer({
  open,
  onClose,
  initial,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  initial?: { text?: string; fontPx?: number; color?: string; textBg?: boolean; font?: ScrapbookElement['data']['font'] };
  onSave: (next: {
    text: string;
    fontPx: number;
    color: string;
    textBg: boolean;
    font: ScrapbookElement['data']['font'];
  }) => void;
}) {
  const [text, setText] = useState(initial?.text ?? '');
  const [fontPx, setFontPx] = useState(initial?.fontPx ?? 28);
  const [color, setColor] = useState(initial?.color ?? '#1C1B16');
  const [textBg, setTextBg] = useState(initial?.textBg ?? false);
  const [font, setFont] = useState<ScrapbookElement['data']['font']>(initial?.font ?? 'sans');
  const { recents, remember } = useCollageColors();

  useEffect(() => {
    if (!open) return;
    setText(initial?.text ?? '');
    setFontPx(initial?.fontPx ?? 28);
    setColor(initial?.color ?? '#1C1B16');
    setTextBg(initial?.textBg ?? false);
    setFont(initial?.font ?? 'sans');
  }, [open, initial]);

  // The preview mirrors the real page: same font, size feel, caps, and color.
  const previewFamily = collageFontFamily(font);
  const previewCaps = collageFontIsCaps(font);
  const previewText = text.trim() ? (previewCaps ? text.toUpperCase() : text) : 'Type something…';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add words"
      surface="collage_text"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_TEXT.chrome.dismiss}
      footer={
        <ButtonPrimary
          analyticsId={COLLAGE_TEXT.chrome.done}
          onPress={() => {
            if (text.trim()) {
              onSave({ text: text.trim(), fontPx, color, textBg, font });
            }
            onClose();
          }}
        >
          Done
        </ButtonPrimary>
      }
    >
      {/* LIVE PREVIEW: shows the real font, size, caps, and color. */}
      <View className="mb-4 rounded-[22px] px-4 py-6" style={{ backgroundColor: '#F4F1E7' }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type something…"
          placeholderTextColor="rgba(28,27,22,0.35)"
          accessibilityLabel="Collage text"
          autoFocus
          multiline
          className="text-center"
          style={{
            fontFamily: previewFamily,
            fontSize: fontPx,
            lineHeight: fontPx * 1.25,
            color,
            letterSpacing: previewCaps ? 1.4 : 0,
            minHeight: 56,
            textTransform: previewCaps ? 'uppercase' : 'none'
          }}
        />
      </View>

      {/* SIZE SLIDER: drag to size; the number rides on the handle. */}
      <SizeSlider value={fontPx} onChange={setFontPx} />

      {/* FONTS: each chip is drawn in its own real typeface. */}
      <Text accessible={false} className="mb-2 mt-4 font-sans-md text-[13px] text-ink/60">
        Font
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {COLLAGE_FONTS.map((f) => {
          const on = font === f.font;
          return (
            <Pressable
              key={f.id}
              onPress={withAnalyticsPress(COLLAGE_TEXT.tools.font, () => setFont(f.font), {
                analyticsProps: { font: f.font }
              })}
              accessibilityRole="button"
              accessibilityLabel={`Font ${f.id}`}
              accessibilityState={{ selected: on }}
              className={cn(
                'h-12 min-w-[52px] items-center justify-center rounded-xl border px-3',
                on ? 'border-ink bg-white' : 'border-transparent bg-eggshell'
              )}
            >
              <Text style={{ fontFamily: collageFontFamily(f.font), fontSize: 20, color: '#1C1B16' }}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* COLOR: a full spectrum, not five dots. Mixed colors get remembered. */}
      <Text accessible={false} className="mb-2 font-sans-md text-[13px] text-ink/60">
        Color
      </Text>
      <SpectrumColorPicker
        value={color}
        onChange={setColor}
        onCommit={remember}
        presets={COLLAGE_TEXT_COLORS}
        recents={recents}
        analyticsId={COLLAGE_TEXT.tools.color}
        spectrumAnalyticsId={COLLAGE_TEXT.tools.spectrum}
      />

      {/* BOX: a soft card behind the words for photo backdrops. */}
      <Pressable
        onPress={withAnalyticsPress(COLLAGE_TEXT.tools.box, () => setTextBg((v) => !v))}
        accessibilityRole="button"
        accessibilityState={{ selected: textBg }}
        accessibilityLabel="Box behind the words"
        className={cn(
          'mt-4 h-11 items-center justify-center rounded-full',
          textBg ? 'bg-ink' : 'bg-eggshell'
        )}
      >
        <Text className={cn('font-sans-b', textBg ? 'text-white' : 'text-ink')}>Box behind words</Text>
      </Pressable>
    </Sheet>
  );
}

// THIS SECTION DOES: a drag-to-size slider that shows the current number on the
// handle, so the size label always sits right next to the size control.
function SizeSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [w, setW] = useState(0);
  const wRef = useRef(0);
  wRef.current = w;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromX = (x: number) => {
    const width = wRef.current || 1;
    const t = Math.min(1, Math.max(0, x / width));
    onChangeRef.current(Math.round(MIN_SIZE + t * (MAX_SIZE - MIN_SIZE)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX)
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const t = (value - MIN_SIZE) / (MAX_SIZE - MIN_SIZE);
  const handleLeft = Math.min(Math.max(0, w * t - 20), Math.max(0, w - 40));

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text accessible={false} className="font-sans-md text-[13px] text-ink/60">
          Size
        </Text>
        <Text className="font-sans-b text-[13px] text-ink">{value}</Text>
      </View>
      <View
        onLayout={onLayout}
        {...pan.panHandlers}
        className="h-11 justify-center"
        accessibilityRole="adjustable"
        accessibilityLabel={`Text size ${value}`}
      >
        {/* the track */}
        <View className="h-1.5 w-full rounded-full bg-eggshell">
          <View className="h-1.5 rounded-full bg-ink" style={{ width: `${t * 100}%` }} />
        </View>
        {/* the handle with the live number on it */}
        <View
          pointerEvents="none"
          className="absolute h-10 w-10 items-center justify-center rounded-full bg-ink"
          style={{ left: handleLeft }}
        >
          <Text className="font-sans-b text-[12px] text-white">{value}</Text>
        </View>
      </View>
    </View>
  );
}
