// ============================================
// WHAT THIS FILE DOES (plain English):
// The shell every Home widget shares — pixel title on top, body below. In Edit
// mode you can resize (half / full) and reorder with up/down (the Magic Patterns
// drag-and-drop, adapted for phones). The title uses SectionTitle so a dashed
// underline + short "what is this?" bubble is available on every widget.
// ============================================
import React from 'react';
import { Pressable, View } from 'react-native';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  Maximize2Icon,
  Minimize2Icon
} from 'lucide-react-native';
import { PixelHeading, RADIUS, Reveal, SectionTitle, cn, useThemeColors } from '@bridger/ui';

export type WidgetSize = 'half' | 'full';

export function HomeWidget({
  title,
  description,
  infoAnalyticsId,
  section,
  action,
  size,
  editing,
  onToggleSize,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  index = 0,
  instant = false,
  showDot = false,
  dotColor,
  children
}: {
  title: string;
  /** Short explanation shown when the title is tapped / hovered. */
  description?: string;
  /** Taxonomy id for the info trigger. */
  infoAnalyticsId?: string;
  /** Section name stamped on analytics (this_week, quiz…). */
  section?: string;
  action?: React.ReactNode;
  size: WidgetSize;
  editing: boolean;
  onToggleSize?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** position down the page — widgets arrive one after another, not all at once */
  index?: number;
  /** Skip the arrive motion when Home was already painted. */
  instant?: boolean;
  /** Little "new here" dot beside the widget title. */
  showDot?: boolean;
  /** Fill color for showDot (Home teal by default via SectionTitle). */
  dotColor?: string;
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  const hasInfo = Boolean(description && infoAnalyticsId);

  return (
    // The widget's LAYOUT is written as real styles, not Tailwind classes: this
    // is an animated wrapper, and class names don't reliably land on those. Half
    // widgets stretch to match the taller neighbor in their row.
    <Reveal
      index={index}
      instant={instant}
      style={[
        { minWidth: 0, flexDirection: 'column' },
        size === 'full'
          ? { width: '100%' }
          : { width: '48%', alignSelf: 'stretch' },
        editing ? EDIT_FRAME : null
      ]}
    >
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
          {editing ? <GripVerticalIcon size={16} color={ACCENT_PURPLE} strokeWidth={2.6} /> : null}
          {hasInfo ? (
            <SectionTitle
              title={title}
              description={description!}
              infoAnalyticsId={infoAnalyticsId!}
              parentScreen="home"
              section={section}
              numberOfLines={1}
              className="min-w-0 flex-1"
              showDot={showDot}
              dotColor={dotColor}
            />
          ) : (
            <PixelHeading size="md" numberOfLines={1} className="flex-shrink">
              {title}
            </PixelHeading>
          )}
        </View>

        {editing ? (
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={onMoveUp}
              disabled={!canMoveUp}
              accessibilityRole="button"
              accessibilityLabel={`Move ${title} up`}
              className={cn(
                'h-7 w-7 items-center justify-center rounded-full border border-ink-line bg-surface',
                !canMoveUp && 'opacity-30'
              )}
            >
              <ChevronUpIcon size={14} color={c.ink} strokeWidth={3} />
            </Pressable>
            <Pressable
              onPress={onMoveDown}
              disabled={!canMoveDown}
              accessibilityRole="button"
              accessibilityLabel={`Move ${title} down`}
              className={cn(
                'h-7 w-7 items-center justify-center rounded-full border border-ink-line bg-surface',
                !canMoveDown && 'opacity-30'
              )}
            >
              <ChevronDownIcon size={14} color={c.ink} strokeWidth={3} />
            </Pressable>
            <Pressable
              onPress={onToggleSize}
              accessibilityRole="button"
              accessibilityLabel={size === 'full' ? 'Make half width' : 'Make full width'}
              className="h-7 w-7 items-center justify-center rounded-full border border-ink-line bg-surface"
            >
              {size === 'full' ? (
                <Minimize2Icon size={14} color={c.ink} strokeWidth={3} />
              ) : (
                <Maximize2Icon size={14} color={c.ink} strokeWidth={3} />
              )}
            </Pressable>
          </View>
        ) : (
          action
        )}
      </View>

      {/* flex-1 fills whatever height the row stretched this shell to */}
      <View className="min-h-0 flex-1">{children}</View>
    </Reveal>
  );
}

const ACCENT_PURPLE = '#6B2FEA';

/** The dashed purple frame that appears around a widget while rearranging. */
const EDIT_FRAME = {
  borderRadius: RADIUS.card,
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: 'rgba(107, 47, 234, 0.4)',
  padding: 10
} as const;