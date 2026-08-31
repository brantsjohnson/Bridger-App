// ============================================
// WHAT THIS FILE DOES (plain English):
// One Inside Joke sticky note. Front shows the quote + whose words they are.
// Tap flips to the credits (who posted it, where, when). The dog-ear cuts the
// bottom-right corner open and folds a light triangle inward over the cut.
// Pass analyticsId so a flip is named; noteBodyAnalyticsId tags the quote for
// dead_click when someone taps the text expecting more.
// ============================================
import React, { useState } from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import type { InsideJoke } from '@bridger/shared';
import {
  ACCENTS,
  Avatar,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { personById } from '../../data/people';

const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'] as const;
/** Size of the dog-ear square in the bottom-right corner. */
const FOLD = 22;

export function InsideJokeNote({
  joke,
  index = 0,
  analyticsId
}: {
  joke: InsideJoke;
  index?: number;
  /** Interactive flip (tap → meta). */
  analyticsId?: string;
  /**
   * Callers may still pass this. The quote lives inside the flip button, so
   * we cannot wrap it in a second Pressable (web forbids button-in-button).
   */
  noteBodyAnalyticsId?: string;
}) {
  const token = ACCENTS[joke.accent];
  const c = useThemeColors();
  const [meta, setMeta] = useState(false);
  const quoted = joke.quotedId ? personById(joke.quotedId) : null;
  const poster = joke.postedById ? personById(joke.postedById) : null;
  const tagged = joke.taggedIds?.length ?? 0;

  /*
    Dog-ear: think of a FOLD×FOLD square in the bottom-right.
    - The outer half (what used to be the light triangle) is cut away so the
      page shows through — on web via clip-path; on native a canvas-colored
      triangle covers that half.
    - The inner half is the fold flap: same triangle flipped over the long
      edge so it points into the card (light = underside of the paper).
  */
  // clipPath is web-only; cast because RN's ViewStyle types omit it.
  const notchClip: ViewStyle | undefined =
    Platform.OS === 'web'
      ? ({
          clipPath: `polygon(0% 0%, 100% 0%, 100% calc(100% - ${FOLD}px), calc(100% - ${FOLD}px) 100%, 0% 100%)`
        } as ViewStyle)
      : undefined;

  return (
    <View
      className={cn('relative w-full p-4 pb-6', token.bg, TILTS[index % TILTS.length])}
      style={notchClip}
    >
      {/* Native fallback: paint the outer half with the page color so the
          corner looks empty (web uses clip-path above instead). */}
      {Platform.OS !== 'web' ? (
        <View
          accessible={false}
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderBottomWidth: FOLD,
            borderLeftWidth: FOLD,
            borderBottomColor: c.canvas,
            borderLeftColor: 'transparent'
          }}
        />
      ) : null}

      {/* Inner fold — flipped over the hypotenuse, pointing into the note. */}
      <View
        accessible={false}
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderTopWidth: FOLD,
          borderRightWidth: FOLD,
          borderTopColor: 'rgba(255,255,255,0.55)',
          borderRightColor: 'transparent'
        }}
      />

      <Pressable
        onPress={withAnalyticsPress(analyticsId, () => setMeta((v) => !v))}
        accessibilityRole="button"
        accessibilityState={{ expanded: meta }}
        accessibilityLabel={meta ? 'Hide details' : 'Who posted this'}
        className="w-full"
      >
        {meta ? (
          <View className="gap-2">
            <Credit label="Said by" value={quoted?.name ?? joke.fromName} textClass={token.text} />
            {poster ? (
              <Credit
                label="Posted by"
                value={`${poster.id === 'me' ? 'You' : poster.name}${joke.postedAt ? ` · ${joke.postedAt}` : ''}`}
                textClass={token.text}
              />
            ) : null}
            {joke.eventName ? (
              <Credit label="Where" value={joke.eventName} textClass={token.text} />
            ) : null}
            {tagged > 0 ? (
              <Credit
                label="Also in it"
                value={`${tagged} ${tagged === 1 ? 'person' : 'people'}`}
                textClass={token.text}
              />
            ) : null}
          </View>
        ) : (
          <>
            {/*
              Quote is plain text, not AnalyticsRegion. That helper is a
              Pressable, and nesting it here made web put <button> inside
              <button>. The flip Pressable already records the tap.
            */}
            <Text
              accessible={false}
              className={cn('font-sans-b text-[14px] leading-snug', token.text)}
            >
              “{joke.text}”
            </Text>
            <View className="mt-2.5 flex-row items-center gap-2 pr-5">
              {quoted ? (
                <Avatar
                  name={quoted.name}
                  emoji={quoted.emoji}
                  accent={quoted.accent}
                  personId={quoted.id}
                  size="xs"
                />
              ) : null}
              <Text numberOfLines={1} className={cn('flex-1 font-sans-b text-[11px] opacity-75', token.text)}>
                {joke.fromName}
                {joke.eventName ? ` · ${joke.eventName}` : ''}
              </Text>
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
}

function Credit({
  label,
  value,
  textClass
}: {
  label: string;
  value: string;
  textClass: string;
}) {
  return (
    <View>
      <Text className={cn('font-sans-b text-[11px] opacity-60', textClass)}>{label}</Text>
      <Text className={cn('font-sans-b text-[13px]', textClass)}>{value}</Text>
    </View>
  );
}

/**
 * Blank sticky note with a +. Shows on an empty Inside Jokes wall so the
 * page still feels like something you can fill in (not a dead void).
 * Square + half-column width (same pattern as Favorites / Current Obsession).
 */
export function AddNoteTile({
  label = 'Add an Inside Joke',
  onPress,
  analyticsId
}: {
  label?: string;
  onPress?: () => void;
  analyticsId?: string;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'w-full items-center justify-center gap-1.5 border-2 border-dashed border-ink/25 bg-[#FFF6C8] p-4 active:bg-[#FFEFA8]',
        '-rotate-1'
      )}
      style={{ aspectRatio: 1 }}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-purple">
        {/* Icon + (not a Text "+") so font metrics cannot shove it off-center. */}
        <PlusIcon size={18} color="#FFFFFF" strokeWidth={3} />
      </View>
      <Text className="text-center font-sans-b text-[13px] text-ink-soft">{label}</Text>
    </Pressable>
  );
}
