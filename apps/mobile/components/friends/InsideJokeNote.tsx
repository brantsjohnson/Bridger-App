// ============================================
// WHAT THIS FILE DOES (plain English):
// One square Inside Joke sticky note. The front shows the quote. If there is
// a photo, the note slowly flips between the quote and the photo. Tap still
// shows who posted it. The dog-ear folds the bottom-right corner.
//
// ACCESSIBILITY: Reduce Motion does not auto-flip. Tap cycles quote, photo,
// then credits. We never log the joke text or the picture.
// ============================================
import React, { useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  Text,
  View,
  type ViewStyle
} from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import type { Accent, InsideJoke, Person } from '@bridger/shared';
import {
  ACCENTS,
  Avatar,
  cn,
  useReduceMotion,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { personById } from '../../data/people';
import { stickyNoteFontSize, stickyNoteLineHeight } from './stickyNoteFont';
import { useQuotePhotoFlip } from './useQuotePhotoFlip';

const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'] as const;
/** Size of the dog-ear square in the bottom-right corner. */
const FOLD = 22;

type Face = 'quote' | 'photo' | 'credits';

export function InsideJokeNote({
  joke,
  index = 0,
  analyticsId
}: {
  joke: InsideJoke;
  index?: number;
  /** Interactive flip (tap → next face / credits). */
  analyticsId?: string;
  /**
   * Callers may still pass this. The quote lives inside the flip button, so
   * we cannot wrap it in a second Pressable (web forbids button-in-button).
   */
  noteBodyAnalyticsId?: string;
}) {
  const token = ACCENTS[joke.accent];
  const c = useThemeColors();
  const reduce = useReduceMotion();
  const hasPhoto = Boolean(joke.photoUri);
  const [face, setFace] = useState<Face>('quote');
  const [box, setBox] = useState(0);
  const quoted = joke.quotedId ? personById(joke.quotedId) : null;
  const poster = joke.postedById ? personById(joke.postedById) : null;
  const tagged = joke.taggedIds?.length ?? 0;
  const { quoteRotate, photoRotate, quoteOpacity, photoOpacity } = useQuotePhotoFlip(
    hasPhoto && !reduce && face !== 'credits'
  );

  /*
    Dog-ear: think of a FOLD×FOLD square in the bottom-right.
    - The outer half is cut away so the page shows through.
    - The inner half is the fold flap pointing into the card.
  */
  const notchClip: ViewStyle | undefined =
    Platform.OS === 'web'
      ? ({
          clipPath: `polygon(0% 0%, 100% 0%, 100% calc(100% - ${FOLD}px), calc(100% - ${FOLD}px) 100%, 0% 100%)`
        } as ViewStyle)
      : undefined;

  const pageIndex = face === 'credits' ? 2 : face === 'photo' ? 1 : 0;

  const onTap = () => {
    if (hasPhoto && reduce) {
      setFace((now) =>
        now === 'quote' ? 'photo' : now === 'photo' ? 'credits' : 'quote'
      );
      return;
    }
    setFace((now) => (now === 'credits' ? 'quote' : 'credits'));
  };

  const label =
    face === 'credits'
      ? 'Hide details'
      : hasPhoto && reduce
        ? face === 'quote'
          ? 'Show photo'
          : 'Who posted this'
        : 'Who posted this';

  return (
    <View
      className={cn('relative w-full overflow-hidden', token.bg, TILTS[index % TILTS.length])}
      style={[{ aspectRatio: 1 }, notchClip]}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && w !== box) setBox(w);
      }}
    >
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
        onPress={withAnalyticsPress(analyticsId, onTap, {
          analyticsProps: { page_index: pageIndex }
        })}
        accessibilityRole="button"
        accessibilityState={{ expanded: face === 'credits' }}
        accessibilityLabel={label}
        className="h-full w-full"
      >
        {face === 'credits' ? (
          <View className="h-full w-full justify-center gap-2 p-4 pr-6">
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
        ) : hasPhoto && reduce && face === 'photo' ? (
          <PhotoFace joke={joke} />
        ) : hasPhoto && box > 0 && !reduce ? (
          <View style={{ width: box, height: box, overflow: 'hidden' }}>
            <View
              style={{ position: 'absolute', left: 0, top: 0, width: box, height: box }}
              pointerEvents="none"
            >
              <Animated.View
                style={{
                  opacity: quoteOpacity,
                  backfaceVisibility: 'hidden',
                  transform: [{ perspective: 900 }, { rotateY: quoteRotate }]
                }}
              >
                <View style={{ width: box, height: box }}>
                  <QuoteFace joke={joke} quoted={quoted} token={token} />
                </View>
              </Animated.View>
            </View>
            <View
              style={{ position: 'absolute', left: 0, top: 0, width: box, height: box }}
              pointerEvents="none"
            >
              <Animated.View
                style={{
                  opacity: photoOpacity,
                  backfaceVisibility: 'hidden',
                  transform: [{ perspective: 900 }, { rotateY: photoRotate }]
                }}
              >
                <View style={{ width: box, height: box }}>
                  <PhotoFace joke={joke} />
                </View>
              </Animated.View>
            </View>
          </View>
        ) : (
          <QuoteFace joke={joke} quoted={quoted} token={token} />
        )}
      </Pressable>
    </View>
  );
}

function QuoteFace({
  joke,
  quoted,
  token
}: {
  joke: InsideJoke;
  quoted: Person | null;
  token: (typeof ACCENTS)[Accent];
}) {
  // THIS SECTION DOES: measure the quote area (above the name row) and size the type to fill it.
  const [area, setArea] = useState({ w: 0, h: 0 });
  const display = `“${joke.text}”`;
  const fontSize = stickyNoteFontSize(display, area.w, area.h);
  const lineHeight = stickyNoteLineHeight(fontSize);

  return (
    <View className="h-full w-full justify-between p-4 pb-6">
      <View
        className="min-h-0 flex-1"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          const w = Math.round(width);
          const h = Math.round(height);
          if (w !== area.w || h !== area.h) setArea({ w, h });
        }}
      >
        <Text
          accessible={false}
          className={cn('font-sans-b', token.text)}
          style={{ fontSize, lineHeight }}
        >
          {display}
        </Text>
      </View>
      <View className="mt-2 flex-row items-center gap-2 pr-5">
        {quoted ? (
          <Avatar
            name={quoted.name}
            emoji={quoted.emoji}
            accent={quoted.accent}
            personId={quoted.id}
            size="xs"
          />
        ) : null}
        <Text numberOfLines={1} className={cn('flex-1 font-sans-b text-[13px] opacity-75', token.text)}>
          {joke.fromName}
          {joke.eventName ? ` · ${joke.eventName}` : ''}
        </Text>
      </View>
    </View>
  );
}

function PhotoFace({ joke }: { joke: InsideJoke }) {
  return (
    <View className="h-full w-full">
      <Image
        source={{ uri: joke.photoUri ?? '' }}
        accessibilityLabel="Photo on this joke"
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0 px-3 pb-5 pt-6"
        style={{ backgroundColor: 'rgba(28,27,22,0.35)' }}
      >
        <Text numberOfLines={1} className="font-sans-b text-[11px] text-white">
          {joke.fromName}
        </Text>
      </View>
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
        <PlusIcon size={18} color="#FFFFFF" strokeWidth={3} />
      </View>
      <Text className="text-center font-sans-b text-[13px] text-ink-soft">{label}</Text>
    </Pressable>
  );
}
