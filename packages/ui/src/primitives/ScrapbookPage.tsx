// ============================================
// WHAT THIS FILE DOES (plain English):
// Draws one Scrapbook page: a portrait 8.5 x 11 sheet with photos, the caption,
// and the little date stamp placed by fractions of the page (0 to 1). The
// same component draws the page on the compose screen (where you can tap a
// photo or the caption), in the story player, in thumbnails, and later on
// paper. Videos are drawn by whoever owns the video player: pass renderMedia
// so this package never depends on expo-video.
//
// ACCESSIBILITY: every photo slot, the caption slot, and the stamp get a role
// + label. Empty caption slots read their placeholder. In view mode the whole
// page is one image-like region with a summary label.
// ============================================
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import {
  SCRAPBOOK_ASPECT_RATIO,
  collageFontFamily,
  collageFontIsCaps,
  sortedElements,
  type ScrapbookElement,
  type ScrapbookPage as ScrapbookPageModel
} from '@bridger/shared';
import { cn } from '../lib/cn';
import { withAnalyticsPress } from '../lib/analytics';

/** Which analytics ids fire when parts of the page are tapped (compose only). */
export type ScrapbookPageAnalyticsIds = {
  canvas?: string;
  photoSlot?: string;
  captionSlot?: string;
  stamp?: string;
};

type Props = {
  page: ScrapbookPageModel;
  /**
   * How wide to draw. Height follows the page's aspect ratio. When omitted the
   * page fills its parent's width (measured with onLayout).
   */
  width?: number;
  /** compose = tappable slots + placeholders; view = nothing tappable. */
  mode?: 'compose' | 'view';
  /** Highlight this element (compose). */
  selectedElementId?: string | null;
  onPressElement?: (element: ScrapbookElement) => void;
  /** Tapped the paper with nothing under the finger. */
  onPressCanvas?: () => void;
  /** Let the app draw video (or anything special) for a media element. */
  renderMedia?: (element: ScrapbookElement, box: { width: number; height: number }) => React.ReactNode;
  /** Play a voice note. Used in the player and on the editor chip. */
  onPressVoice?: (element: ScrapbookElement) => void;
  analyticsIds?: ScrapbookPageAnalyticsIds;
  /** Screen-reader summary in view mode, e.g. "Maya's page, 3 photos". */
  accessibilityLabel?: string;
  /** Rounded paper corners (compose + player); 0 for print / thumbnails. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

/** Text sizes as a fraction of page width so words scale with the page. */
const TEXT_SCALE = { sm: 0.034, md: 0.046, lg: 0.06 } as const;

export function ScrapbookPage({
  page,
  width,
  mode = 'view',
  selectedElementId,
  onPressElement,
  onPressCanvas,
  renderMedia,
  onPressVoice,
  analyticsIds,
  accessibilityLabel,
  radius = 12,
  style,
  className
}: Props) {
  // THIS SECTION DOES: learn how wide we are so fractions become pixels.
  const [measured, setMeasured] = useState(0);
  const w = width ?? measured;
  const ratio = page.aspectRatio || SCRAPBOOK_ASPECT_RATIO;
  const h = w / ratio;
  const onLayout = (e: LayoutChangeEvent) => {
    if (width === undefined) setMeasured(e.nativeEvent.layout.width);
  };

  const bg =
    page.background.kind === 'solid' && page.background.color
      ? page.background.color
      : '#F4F1E7';
  const compose = mode === 'compose';

  // THIS SECTION DOES: the paper. In view mode it is one accessible region.
  return (
    <View
      onLayout={onLayout}
      accessible={!compose}
      accessibilityRole={compose ? undefined : 'image'}
      accessibilityLabel={compose ? undefined : accessibilityLabel}
      className={cn('relative overflow-hidden', className)}
      style={[
        {
          width: width ?? '100%',
          height: w ? h : undefined,
          aspectRatio: w ? undefined : ratio,
          backgroundColor: bg,
          borderRadius: radius
        },
        style
      ]}
    >
      {compose ? (
        <Pressable
          onPress={withAnalyticsPress(analyticsIds?.canvas, onPressCanvas, {
            interactive: false
          })}
          accessibilityRole="none"
          accessibilityLabel="Page"
          className="absolute inset-0"
        />
      ) : null}

      {w > 0
        ? sortedElements(page).map((el) => (
            <ElementView
              key={el.id}
              element={el}
              pageWidth={w}
              pageHeight={h}
              compose={compose}
              selected={selectedElementId === el.id}
              onPress={onPressElement}
              onPressVoice={onPressVoice}
              renderMedia={renderMedia}
              analyticsIds={analyticsIds}
            />
          ))
        : null}
    </View>
  );
}

// THIS SECTION DOES: one element, positioned and rotated inside the page.
function ElementView({
  element,
  pageWidth,
  pageHeight,
  compose,
  selected,
  onPress,
  onPressVoice,
  renderMedia,
  analyticsIds
}: {
  element: ScrapbookElement;
  pageWidth: number;
  pageHeight: number;
  compose: boolean;
  selected: boolean;
  onPress?: (element: ScrapbookElement) => void;
  onPressVoice?: Props['onPressVoice'];
  renderMedia?: Props['renderMedia'];
  analyticsIds?: ScrapbookPageAnalyticsIds;
}) {
  const left = element.x * pageWidth;
  const top = element.y * pageHeight;
  const boxW = Math.max(1, element.width * pageWidth);
  const boxH = Math.max(1, element.height * pageHeight);
  const isMedia =
    element.type === 'photo' || element.type === 'video' || element.type === 'cutout';
  const isCaption = element.type === 'text' && element.data.role === 'caption';
  const isDate = element.type === 'date';
  const isVoice = element.type === 'voice';
  const isPerson = element.type === 'person';
  const isFreeText = element.type === 'text' && !isCaption;
  const text = typeof element.data.text === 'string' ? element.data.text : '';

  // Empty captions: only the compose screen shows the dashed placeholder, and
  // only when the template wants it (simple pages hide it).
  if (isCaption && !text.trim()) {
    if (!compose || element.data.visibleWhenEmpty === false) return null;
  }
  if (!isMedia && !isCaption && !isDate && !isFreeText && !isVoice && !isPerson) {
    return null;
  }

  const frame = (element.data.frame as string | undefined) ?? 'none';
  const analyticsId = isMedia
    ? analyticsIds?.photoSlot
    : isCaption
      ? analyticsIds?.captionSlot
      : isDate
        ? analyticsIds?.stamp
        : undefined;

  const label = isMedia
    ? `${element.type === 'video' ? 'Video' : element.type === 'cutout' ? 'Cutout' : 'Photo'}${
        typeof element.slot === 'number' ? ` ${element.slot + 1}` : ''
      }`
    : isCaption
      ? text.trim()
        ? `Caption: ${text}`
        : String(element.data.placeholder ?? 'Add a caption')
      : isDate
        ? `Date ${text}`
        : isVoice
          ? 'Voice note'
          : isPerson
            ? 'Tagged friends'
            : text;

  // Tiny thumbnails (page strips, move targets) cannot show readable words:
  // draw the caption as a soft bar and skip the date stamp entirely.
  const tiny = pageWidth < 90;
  if (tiny && isDate) return null;
  const tilt = tiltTransform(element.data.tilt as string | undefined);
  const extraRotate = extraTiltDegrees(element.data.tilt as string | undefined);

  const body = isMedia ? (
    <MediaBody element={element} boxW={boxW} boxH={boxH} frame={frame} renderMedia={renderMedia} />
  ) : isVoice ? (
    <VoiceBody element={element} pageWidth={pageWidth} />
  ) : isPerson ? (
    <PersonBody element={element} />
  ) : tiny ? (
    text.trim() ? (
      <View
        style={{
          width: '70%',
          height: Math.max(1, boxH * 0.18),
          marginTop: boxH * 0.1,
          backgroundColor: 'rgba(28,27,22,0.35)',
          borderRadius: 1
        }}
      />
    ) : null
  ) : (
    <TextBody element={element} pageWidth={pageWidth} compose={compose} />
  );

  const transform: Array<{ rotate: string } | { skewX: string } | { skewY: string }> = [];
  if (element.rotation || extraRotate) {
    transform.push({ rotate: `${(element.rotation ?? 0) + extraRotate}deg` });
  }
  if (tilt) transform.push(...tilt);
  const common: ViewStyle = {
    position: 'absolute',
    left,
    top,
    width: boxW,
    height: boxH,
    transform,
    zIndex: element.zIndex
  };

  // View mode still lets a voice chip play. Everything else stays a picture.
  if (!compose) {
    if (isVoice && onPressVoice) {
      return (
        <Pressable
          onPress={() => onPressVoice(element)}
          accessibilityRole="button"
          accessibilityLabel="Play voice note"
          style={common}
        >
          {body}
        </Pressable>
      );
    }
    return <View style={common}>{body}</View>;
  }

  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress ? () => onPress(element) : undefined, {
        analyticsProps: { element_type: element.type }
      })}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={common}
      className={cn(selected && 'rounded-md')}
    >
      {body}
      {selected ? (
        <View
          pointerEvents="none"
          className="absolute -inset-1 rounded-md border-2 border-[#1D6FE8]"
        />
      ) : null}
    </Pressable>
  );
}

// THIS SECTION DOES: a photo or video inside its optional frame.
function MediaBody({
  element,
  boxW,
  boxH,
  frame,
  renderMedia
}: {
  element: ScrapbookElement;
  boxW: number;
  boxH: number;
  frame: string;
  renderMedia?: Props['renderMedia'];
}) {
  // Frames eat a little of the box. Polaroid has a chunky bottom lip.
  // Tape / film / torn / shadow match the collage handoff recipes.
  const pad =
    frame === 'polaroid'
      ? boxW * 0.05
      : frame === 'thin'
        ? Math.max(2, boxW * 0.015)
        : frame === 'tape'
          ? boxW * 0.04
          : frame === 'film'
            ? boxW * 0.06
            : frame === 'torn'
              ? boxW * 0.03
              : 0;
  const topPad = frame === 'tape' ? boxW * 0.08 : pad;
  const lip = frame === 'polaroid' ? boxW * 0.16 : frame === 'film' ? boxW * 0.05 : 0;
  const innerW = Math.max(1, boxW - pad * 2);
  const innerH = Math.max(1, boxH - topPad - pad - lip);
  const custom = renderMedia?.(element, { width: innerW, height: innerH });
  const clip = (element.data.clip as string | undefined) ?? 'none';
  const showUri = (element.data.maskUri as string | undefined) || element.uri;
  const radius = clipRadius(clip, innerW);

  const bg =
    frame === 'none'
      ? 'transparent'
      : frame === 'film'
        ? '#111111'
        : frame === 'shadow'
          ? 'transparent'
          : '#FCFBF7';

  return (
    <View
      style={{
        width: boxW,
        height: boxH,
        paddingHorizontal: pad,
        paddingTop: topPad,
        paddingBottom: pad + lip,
        backgroundColor: bg,
        borderRadius: frame === 'none' || frame === 'shadow' ? 0 : 2,
        borderWidth: frame === 'thin' ? 1 : 0,
        borderColor: 'rgba(28,27,22,0.12)',
        shadowColor: frame === 'shadow' ? '#000' : undefined,
        shadowOpacity: frame === 'shadow' ? 0.35 : 0,
        shadowRadius: frame === 'shadow' ? 10 : 0,
        shadowOffset: frame === 'shadow' ? { width: 0, height: 6 } : undefined
      }}
    >
      {frame === 'tape' ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 4,
            left: boxW * 0.27,
            width: boxW * 0.46,
            height: 10,
            backgroundColor: 'rgba(239,217,160,0.9)',
            transform: [{ rotate: '-2deg' }]
          }}
        />
      ) : null}
      <View
        style={{
          width: innerW,
          height: innerH,
          overflow: 'hidden',
          backgroundColor: '#E6E2D8',
          borderRadius: radius
        }}
      >
        {custom ??
          (showUri ? (
            <View style={{ width: '100%', height: '100%' }}>
              <Image
                source={{ uri: showUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <FilterWash filter={element.data.filter as string | undefined} />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text accessible={false} className="text-[28px] opacity-50">
                {element.type === 'video' ? '🎥' : '📸'}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}

/** Soft colour wash so a filter reads on native (web can do real CSS later). */
function FilterWash({ filter }: { filter?: string }) {
  if (!filter || filter === 'none') return null;
  const wash =
    filter === 'mono'
      ? 'rgba(80,80,80,0.35)'
      : filter === 'sepia'
        ? 'rgba(180,130,60,0.28)'
        : filter === 'retro'
          ? 'rgba(200,150,80,0.18)'
          : filter === 'dramatic'
            ? 'rgba(0,0,0,0.22)'
            : filter === 'vibrant'
              ? 'rgba(255,80,120,0.08)'
              : 'transparent';
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', inset: 0, backgroundColor: wash }}
    />
  );
}

function clipRadius(clip: string, size: number): number {
  if (clip === 'circle' || clip === 'blob') return size / 2;
  if (clip === 'scallop' || clip === 'flower') return size * 0.28;
  if (clip === 'heart') return size * 0.22;
  return 0;
}

function extraTiltDegrees(tilt?: string): number {
  if (tilt === 'rotate') return -14;
  return 0;
}

function tiltTransform(tilt?: string): Array<{ skewX: string } | { skewY: string }> {
  if (tilt === 'wave') return [{ skewY: '-7deg' }];
  if (tilt === 'slide') return [{ skewX: '-12deg' }];
  return [];
}

// THIS SECTION DOES: a little voice chip so a recording has a home on the page.
function VoiceBody({
  element,
  pageWidth
}: {
  element: ScrapbookElement;
  pageWidth: number;
}) {
  const ms = typeof element.data.durationMs === 'number' ? element.data.durationMs : 0;
  const sec = Math.max(1, Math.round(ms / 1000));
  const hasWords = typeof element.data.transcript === 'string' && element.data.transcript.trim();
  return (
    <View
      className="h-full w-full flex-row items-center rounded-full px-3"
      style={{ backgroundColor: 'rgba(28,27,22,0.88)' }}
    >
      <Text accessible={false} style={{ fontSize: Math.max(12, pageWidth * 0.04) }}>
        🎙
      </Text>
      <Text
        className="ml-2 font-sans-md text-white"
        numberOfLines={1}
        style={{ fontSize: Math.max(10, pageWidth * 0.032), flex: 1 }}
      >
        {hasWords ? 'Voice note · words' : `${sec}s voice note`}
      </Text>
    </View>
  );
}

// THIS SECTION DOES: a quiet "with friends" chip. Names join on the phone.
function PersonBody({ element }: { element?: ScrapbookElement }) {
  const names = Array.isArray(element?.data.displayNames)
    ? (element.data.displayNames as string[]).filter(Boolean)
    : [];
  const label = names.length ? `With ${names.join(', ')}` : 'With friends';
  return (
    <View
      className="h-full w-full items-center justify-center rounded-full px-3"
      style={{ backgroundColor: 'rgba(29,111,232,0.16)', borderWidth: 1, borderColor: '#1D6FE8' }}
    >
      <Text className="font-sans-md text-[#1C1B16]" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// THIS SECTION DOES: caption, plain text, and the date stamp.
function TextBody({
  element,
  pageWidth,
  compose
}: {
  element: ScrapbookElement;
  pageWidth: number;
  compose: boolean;
}) {
  const text = typeof element.data.text === 'string' ? element.data.text : '';
  const size = (element.data.size as keyof typeof TEXT_SCALE | undefined) ?? 'md';
  const fontPx = typeof element.data.fontPx === 'number' ? element.data.fontPx : undefined;
  const fontSize = fontPx
    ? Math.max(10, pageWidth * (fontPx / 390))
    : Math.max(9, pageWidth * TEXT_SCALE[size]);
  const align = (element.data.align as 'left' | 'center' | 'right' | undefined) ?? 'left';
  const onPhoto = element.data.onPhoto === true;
  const boxed = element.data.textBg === true;
  const isDate = element.type === 'date';
  const empty = !text.trim();
  const color =
    typeof element.data.color === 'string'
      ? element.data.color
      : onPhoto
        ? '#FFFFFF'
        : '#1C1B16';
  // Each font key maps to a real, loaded typeface so the words on the page
  // look exactly like the chip the person tapped.
  const fontFamily = collageFontFamily(element.data.font as string | undefined);
  const isCaps = collageFontIsCaps(element.data.font as string | undefined);
  const letterSpacing = isCaps ? 1.4 : 0;
  const shown = isCaps ? text.toUpperCase() : text;

  if (isDate) {
    return (
      <View style={{ width: '100%', height: '100%', justifyContent: 'center' }}>
        <Text
          numberOfLines={1}
          className="font-sans-b uppercase"
          style={{
            fontSize: Math.max(8, pageWidth * 0.028),
            letterSpacing: 1.2,
            color: onPhoto ? '#FFFFFF' : 'rgba(28,27,22,0.62)',
            textShadowColor: onPhoto ? 'rgba(0,0,0,0.5)' : undefined,
            textShadowRadius: onPhoto ? 3 : undefined,
            textAlign: align
          }}
        >
          {text}
        </Text>
      </View>
    );
  }

  // Empty caption on the compose screen: a soft dashed slot with the hint.
  if (empty) {
    if (!compose) return null;
    return (
      <View
        className="flex-1 items-center justify-center rounded-md border border-dashed"
        style={{ borderColor: 'rgba(28,27,22,0.3)' }}
      >
        <Text
          className="font-sans-md"
          style={{ fontSize, color: 'rgba(28,27,22,0.45)', textAlign: 'center' }}
        >
          {String(element.data.placeholder ?? 'Add something…')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        justifyContent: onPhoto ? 'flex-end' : 'center',
        padding: onPhoto || boxed ? pageWidth * 0.02 : 0,
        borderRadius: onPhoto || boxed ? 10 : 0,
        backgroundColor: onPhoto
          ? 'rgba(0,0,0,0.55)'
          : boxed
            ? 'rgba(255,255,255,0.85)'
            : 'transparent'
      }}
    >
      <Text
        style={{
          fontFamily,
          fontSize,
          lineHeight: fontSize * 1.3,
          color,
          textAlign: align,
          letterSpacing
        }}
      >
        {shown}
      </Text>
    </View>
  );
}
