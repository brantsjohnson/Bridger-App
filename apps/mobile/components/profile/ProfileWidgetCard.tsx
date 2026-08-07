// ============================================
// WHAT THIS FILE DOES (plain English):
// A clear box around each profile section so every block reads as its own
// widget. In Edit mode it shows a pencil (edit contents) and optional up/down
// arrows so the owner can rearrange movable modules.
// ============================================
import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon } from 'lucide-react-native';
import { PROFILE } from '@bridger/shared';
import { useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { PROFILE_GUTTER } from './profileSpacing';

export function ProfileWidgetCard({
  children,
  editable,
  rearranging,
  onEditContent,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: {
  children: React.ReactNode;
  /** Show the pencil that opens this section's fill module. */
  editable?: boolean;
  /** Show up/down while the owner is rearranging. */
  rearranging?: boolean;
  onEditContent?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  const c = useThemeColors();
  const showChrome = (editable && onEditContent) || rearranging;

  return (
    <View style={{ paddingHorizontal: PROFILE_GUTTER }}>
      <View className="relative overflow-hidden rounded-card border border-ink-line bg-surface px-3.5 py-3.5">
        {showChrome ? (
          <View className="absolute right-2 top-2 z-10 flex-row items-center gap-1">
            {rearranging ? (
              <>
                <Pressable
                  disabled={!canMoveUp}
                  onPress={
                    canMoveUp
                      ? withAnalyticsPress(PROFILE.card.widget_reorder, () => onMoveUp?.(), {
                          analyticsProps: { method: 'up' }
                        })
                      : undefined
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Move section up"
                  accessibilityState={{ disabled: !canMoveUp }}
                  className="h-8 w-8 items-center justify-center rounded-full border border-ink-line bg-canvas active:opacity-80"
                  style={{ opacity: canMoveUp ? 1 : 0.35 }}
                >
                  <ChevronUpIcon size={16} color={c.ink} strokeWidth={2.6} />
                </Pressable>
                <Pressable
                  disabled={!canMoveDown}
                  onPress={
                    canMoveDown
                      ? withAnalyticsPress(PROFILE.card.widget_reorder, () => onMoveDown?.(), {
                          analyticsProps: { method: 'down' }
                        })
                      : undefined
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Move section down"
                  accessibilityState={{ disabled: !canMoveDown }}
                  className="h-8 w-8 items-center justify-center rounded-full border border-ink-line bg-canvas active:opacity-80"
                  style={{ opacity: canMoveDown ? 1 : 0.35 }}
                >
                  <ChevronDownIcon size={16} color={c.ink} strokeWidth={2.6} />
                </Pressable>
              </>
            ) : null}
            {editable && onEditContent ? (
              <Pressable
                onPress={withAnalyticsPress(PROFILE.card.widget_edit, () => onEditContent())}
                accessibilityRole="button"
                accessibilityLabel="Edit this section"
                className="h-8 w-8 items-center justify-center rounded-full border border-ink-line bg-canvas active:opacity-80"
              >
                <PencilIcon size={14} color={c.ink} strokeWidth={2.6} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {/* Extra top padding when chrome is present so titles clear the buttons. */}
        <View style={showChrome ? { paddingTop: 28 } : undefined}>{children}</View>
      </View>
    </View>
  );
}
