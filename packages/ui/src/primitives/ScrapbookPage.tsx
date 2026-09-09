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
  renderMedia,
  analyticsIds
}: {
  element: ScrapbookElement;
  pageWidth: number;
  pageHeight: number;
  compose: boolean;
  selected: boolean;
  onPress?: (element: ScrapbookElement) => void;
  renderMedia?: Props['renderMedia'];
  analyticsIds?: ScrapbookPageAnalyticsIds;
}) {
  const left = element.x * pageWidth;
  const top = element.y * pageHeight;
  const boxW = Math.max(1, element.width * pageWidth);
  const boxH = Math.max(1, element.height * pageHeight);
  const isMedia = element.type === 'photo' || element.type === 'video';
  const isCaption = element.type === 'text' && element.data.role === 'caption';
  const isDate = element.type === 'date';
  const text = typeof element.data.text === 'string' ? element.data.text : '';

  // Empty captions: only the compose screen shows the dashed placeholder, and
  // only when the template wants it (simple pages hide it).
  if (isCaption && !text.trim()) {
    if (!compose || element.data.visibleWhenEmpty === false) return null;
  }
  if (!isMedia && !isCaption && !isDate && element.type !== 'text') {
    // Later phases (stickers, maps, people) render here. Nothing yet.
    return null;
  }

  const frame = (element.data.frame as 'none' | 'polaroid' | 'thin' | undefined) ?? 'none';
  const analyticsId = isMedia
    ? analyticsIds?.photoSlot
    : isCaption
      ? analyticsIds?.captionSlot
      : isDate
        ? analyticsIds?.stamp
        : undefined;

  const label = isMedia
    ? `${element.type === 'video' ? 'Video' : 'Photo'}${
        typeof element.slot === 'number' ? ` ${element.slot + 1}` : ''
      }`
    : isCaption
      ? text.trim()
        ? `Caption: ${text}`
        : String(element.data.placeholder ?? 'Add a caption')
      : isDate
        ? `Date ${text}`
        : text;

  // Tiny thumbnails (page strips, move targets) cannot show readable words:
  // draw the caption as a soft bar and skip the date stamp entirely.
  const tiny = pageWidth < 90;
  if (tiny && isDate) return null;
  const body = isMedia ? (
    <MediaBody element={element} boxW={boxW} boxH={boxH} frame={frame} renderMedia={renderMedia} />
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

  const common = {
    position: 'absolute' as const,
    left,
    top,
    width: boxW,
    height: boxH,
    transform: element.rotation ? [{ rotate: `${element.rotation}deg` }] : undefined,
    zIndex: element.zIndex
  };

  if (!compose) {
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
  frame: 'none' | 'polaroid' | 'thin';
  renderMedia?: Props['renderMedia'];
}) {
  // Frames eat a little of the box: thin = hairline white, polaroid = white
  // mat with a chunky bottom lip (like a real instant print).
  const pad = frame === 'polaroid' ? boxW * 0.05 : frame === 'thin' ? Math.max(2, boxW * 0.015) : 0;
  const lip = frame === 'polaroid' ? boxW * 0.16 : 0;
  const innerW = Math.max(1, boxW - pad * 2);
  const innerH = Math.max(1, boxH - pad * 2 - lip);
  const custom = renderMedia?.(element, { width: innerW, height: innerH });

  return (
    <View
      style={{
        width: boxW,
        height: boxH,
        padding: pad,
        paddingBottom: pad + lip,
        backgroundColor: frame === 'none' ? 'transparent' : '#FFFFFF',
        borderRadius: frame === 'none' ? 0 : 2,
        borderWidth: frame === 'thin' ? 1 : 0,
        borderColor: 'rgba(28,27,22,0.12)'
      }}
    >
      <View
        style={{ width: innerW, height: innerH, overflow: 'hidden', backgroundColor: '#E6E2D8' }}
      >
        {custom ??
          (element.uri ? (
            <Image
              source={{ uri: element.uri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
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
  const fontSize = Math.max(9, pageWidth * TEXT_SCALE[size]);
  const align = (element.data.align as 'left' | 'center' | 'right' | undefined) ?? 'left';
  const onPhoto = element.data.onPhoto === true;
  const isDate = element.type === 'date';
  const empty = !text.trim();
  const color =
    typeof element.data.color === 'string'
      ? element.data.color
      : onPhoto
        ? '#FFFFFF'
        : '#1C1B16';

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
        justifyContent: onPhoto ? 'flex-end' : 'flex-start',
        padding: onPhoto ? pageWidth * 0.02 : 0,
        borderRadius: onPhoto ? 10 : 0,
        backgroundColor: onPhoto ? 'rgba(0,0,0,0.55)' : 'transparent'
      }}
    >
      <Text
        className={cn(element.data.font === 'pixel' ? 'font-pixel' : 'font-sans-sb')}
        style={{ fontSize, lineHeight: fontSize * 1.3, color, textAlign: align }}
      >
        {text}
      </Text>
    </View>
  );
}
