// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the colorful "start this section" button we show on an empty
// profile module (Hobbies, Places, About me, Current Obsession, …). Instead
// of a plain gray dashed box that looks broken, it shows a colored tint
// background, a bright round "+" badge, and clear text like "Add hobbies" so
// it reads like every other colorful container in the app and obviously
// invites a tap. (Each module passes its own accent color so the profile
// stays lively; analytics fire through the shared withAnalyticsPress wrapper.)
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import { ACCENTS, cn, withAnalyticsPress, type Accent } from '@bridger/ui';

// --- THE CARD: what the user taps to begin filling an empty section ---
export function ProfileAddCard({
  label,
  helper,
  emoji,
  accent = 'purple',
  analyticsId,
  onPress,
  accessibilityLabel,
  minHeight = 84,
  fullWidth = true
}: {
  /** The main call to action, e.g. "Add hobbies". */
  label: string;
  /** Optional one-line hint under the label, e.g. "Pick a few things you like". */
  helper?: string;
  /** Optional emoji shown on the right to hint at the section. */
  emoji?: string;
  /** Which palette color to tint this card, so modules look distinct. */
  accent?: Accent;
  /** The screen.section.element id this tap logs against. */
  analyticsId: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** How tall the card should be at minimum. */
  minHeight?: number;
  /** Fill the row (default) or size to content. */
  fullWidth?: boolean;
}) {
  // THIS SECTION DOES: grab the color bundle (tint wash + solid hex) for the accent.
  const token = ACCENTS[accent];

  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, () => onPress?.())}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      className={cn(
        'flex-row items-center gap-3 rounded-card px-4 py-4 active:opacity-90',
        fullWidth ? 'w-full' : 'self-start',
        token.tint
      )}
      style={{ minHeight }}
    >
      {/* THE BADGE: a bright round "+" so it clearly says "add something". */}
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: token.hex }}
      >
        <PlusIcon size={24} color="#FFFFFF" strokeWidth={3} />
      </View>

      {/* THE TEXT: the action plus an optional plain-English hint. */}
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[15px] text-ink">{label}</Text>
        {helper ? (
          <Text numberOfLines={2} className="mt-0.5 font-sans-sb text-[12px] text-ink-mute">
            {helper}
          </Text>
        ) : null}
      </View>

      {/* THE EMOJI: a soft visual hint for what this section is about. */}
      {emoji ? <Text className="text-[24px]">{emoji}</Text> : null}
    </Pressable>
  );
}
