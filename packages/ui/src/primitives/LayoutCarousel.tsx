// ============================================
// WHAT THIS FILE DOES (plain English):
// The row of tiny page thumbnails under the Scrapbook page on the compose
// screen. Each thumb is a little drawing of where the photos and caption go.
// Tap one and the page changes right away (no Apply). Swipe to see more.
// No words on the thumbs on purpose; long-press shows the layout's name, and
// screen readers always hear it.
//
// Analytics: each thumb is `thumb` with method tap|swipe, page_index (its
// position), carousel_depth (how far they scrolled), layout_id, layout_family.
// ============================================
import React, { useRef } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from 'react-native';
import { SCRAPBOOK_ASPECT_RATIO, trackClick, trackUi, type LayoutTemplate } from '@bridger/shared';
import { cn } from '../lib/cn';

type Props = {
  layouts: LayoutTemplate[];
  selectedId?: string;
  onSelect: (layout: LayoutTemplate, index: number) => void;
  /** `post_composer.layouts.thumb` */
  analyticsId?: string;
  /** Thumb width in points (height follows the page ratio). */
  thumbWidth?: number;
  className?: string;
};

export function LayoutCarousel({
  layouts,
  selectedId,
  onSelect,
  analyticsId,
  thumbWidth = 46,
  className
}: Props) {
  const thumbH = thumbWidth / SCRAPBOOK_ASPECT_RATIO;
  const deepest = useRef(0);
  const [tooltip, setTooltip] = React.useState<string | null>(null);

  // THIS SECTION DOES: remember how far they scrolled so a later tap can say
  // "they swiped 2 screens to find this one".
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const depth = Math.round(x / Math.max(1, thumbWidth + 10));
    if (depth > deepest.current) {
      deepest.current = depth;
      if (analyticsId) {
        trackUi('swipe', analyticsId, { method: 'swipe', carousel_depth: depth });
      }
    }
  };

  return (
    <View className={cn('relative', className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, alignItems: 'center' }}
        accessibilityRole="tablist"
      >
        {layouts.map((layout, i) => {
          const selected = layout.id === selectedId;
          return (
            <Pressable
              key={layout.id}
              onPress={() => {
                if (analyticsId) {
                  trackClick(analyticsId, {
                    method: 'tap',
                    page_index: i,
                    carousel_depth: deepest.current,
                    layout_id: layout.id,
                    layout_family: layout.family
                  });
                }
                onSelect(layout, i);
              }}
              onLongPress={() => setTooltip(layout.label)}
              onPressOut={() => setTooltip(null)}
              accessibilityRole="tab"
              accessibilityLabel={`Layout: ${layout.label}, ${i + 1} of ${layouts.length}`}
              accessibilityState={{ selected }}
              // 44pt tall tap target even though the thumb is drawn smaller.
              style={{ minHeight: 44, justifyContent: 'center' }}
              className="active:opacity-80"
            >
              <LayoutThumb layout={layout} width={thumbWidth} height={thumbH} selected={selected} />
            </Pressable>
          );
        })}
      </ScrollView>
      {tooltip ? (
        <View
          pointerEvents="none"
          className="absolute -top-9 left-0 right-0 items-center"
          accessibilityLiveRegion="polite"
        >
          <View className="rounded-full bg-white px-3 py-1">
            <Text className="font-sans-b text-[11px] text-[#1C1B16]">{tooltip}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// THIS SECTION DOES: one tiny page. Photo slots are solid blocks, the caption
// is a couple of thin lines, the date stamp a dot. Selected = blue outline.
export function LayoutThumb({
  layout,
  width,
  height,
  selected
}: {
  layout: LayoutTemplate;
  width: number;
  height: number;
  selected?: boolean;
}) {
  return (
    <View
      accessible={false}
      style={{
        width,
        height,
        borderRadius: 4,
        backgroundColor: '#F4F1E7',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#1D6FE8' : 'rgba(255,255,255,0.35)',
        overflow: 'hidden'
      }}
    >
      {layout.slots.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: s.x * width,
            top: s.y * height,
            width: Math.max(2, s.width * width),
            height: Math.max(2, s.height * height),
            backgroundColor: s.frame === 'polaroid' ? '#FFFFFF' : '#8E8A7E',
            borderWidth: s.frame === 'thin' ? 1 : 0,
            borderColor: '#FFFFFF',
            transform: s.rotation ? [{ rotate: `${s.rotation}deg` }] : undefined
          }}
        >
          {s.frame === 'polaroid' ? (
            <View
              style={{
                position: 'absolute',
                left: '8%',
                right: '8%',
                top: '7%',
                bottom: '24%',
                backgroundColor: '#8E8A7E'
              }}
            />
          ) : null}
        </View>
      ))}
      {layout.captionVisibleWhenEmpty ? (
        <View
          style={{
            position: 'absolute',
            left: layout.caption.x * width,
            top: layout.caption.y * height,
            width: layout.caption.width * width,
            gap: 2
          }}
        >
          <View style={{ height: 2, width: '80%', backgroundColor: 'rgba(28,27,22,0.45)' }} />
          <View style={{ height: 2, width: '55%', backgroundColor: 'rgba(28,27,22,0.3)' }} />
        </View>
      ) : null}
    </View>
  );
}
