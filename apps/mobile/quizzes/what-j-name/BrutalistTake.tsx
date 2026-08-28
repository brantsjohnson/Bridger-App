// ============================================
// WHAT THIS FILE DOES (plain English):
// The take look for this fun quiz: big sharp blocks on a solid white page
// (no drifting grid). The question stays navy. Each answer gets its own
// Bridger accent so the options read as different. Tap explodes that answer's
// emojis from the middle of the tile (same gravity burst as hobbies). Reduce
// Motion skips it. Leave is always an X in the top-right (no back arrow).
// Commentary screens are a different beat: vivid yellow, free-standing copy,
// Continue at the bottom.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'lucide-react-native';
import { QUIZ, trackDeadClick } from '@bridger/shared';
import {
  ACCENT_HEX,
  ButtonPrimary,
  HobbyEmojiBurst,
  Screen,
  withAnalyticsPress
} from '@bridger/ui';
import { MANIFEST } from './manifest';

/** Deep navy for the question slab. White gutters sit between the blocks. */
const NAVY = '#001146';
const INK = '#1C1B16';
/** Vivid amber canvas for commentary (not a dusty wash). */
const COMMENTARY_YELLOW = '#FFC21A';
const GUTTER = 8;
/** Beat after the explode before we flip to commentary. */
const ADVANCE_MS = 500;
/** One exploding shower that sits above the quiz, so it can keep falling
 *  after we flip to commentary or the next question. */
export type LiveBurst = {
  key: number;
  emojis: readonly string[];
  origin: { x: number; y: number };
};

export function EmojiBurstLayer({
  bursts,
  onDone
}: {
  bursts: LiveBurst[];
  onDone: (key: number) => void;
}) {
  if (bursts.length === 0) return null;
  // Sits on top of whatever screen is up. pointerEvents none so Continue still works.
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 80 }]}>
      {bursts.map((b) => (
        <HobbyEmojiBurst
          key={b.key}
          play
          emoji={[...b.emojis]}
          origin={b.origin}
          count={18}
          power="boom"
          onDone={() => onDone(b.key)}
        />
      ))}
    </View>
  );
}

/** One color + text ink + burst mix per option, cycling Bridger accents. */
const TILE_LOOKS = [
  { bg: ACCENT_HEX.purple, fg: '#FFFFFF', emojis: ['💜', '✨', '🎉'] },
  { bg: ACCENT_HEX.coral, fg: INK, emojis: ['🔥', '💥', '🎉'] },
  { bg: ACCENT_HEX.teal, fg: INK, emojis: ['💚', '✨', '🌊'] },
  { bg: ACCENT_HEX.amber, fg: INK, emojis: ['⭐️', '✨', '🎉'] },
  { bg: ACCENT_HEX.pink, fg: '#FFFFFF', emojis: ['💖', '✨', '🎀'] },
  { bg: ACCENT_HEX.blue, fg: '#FFFFFF', emojis: ['💙', '✨', '⚡'] },
  { bg: ACCENT_HEX.green, fg: INK, emojis: ['🌿', '✨', '🎉'] }
] as const;

export type BrutalistOption = {
  key: string;
  label: string;
  sub?: string;
  selected?: boolean;
  /** Optional picture parked on the right (extra-brain Yes / No). */
  image?: ImageSourcePropType;
  /** What flies out when you tap this tile. */
  emojis?: readonly string[];
};

type ShellProps = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
};

/** X in the top-right. Opens End quiz. Same control on take and commentary. */
function CloseBar({ onClose, color = NAVY }: { onClose: () => void; color?: string }) {
  return (
    <View className="flex-row items-center justify-end px-2 pb-2">
      <Pressable
        onPress={withAnalyticsPress(QUIZ.take.back, onClose)}
        accessibilityRole="button"
        accessibilityLabel="End quiz"
        className="h-11 w-11 items-center justify-center active:opacity-80"
      >
        <XIcon size={26} color={color} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

/** White page, no grid. X top-right, no back arrow. */
function BrutalistShell({ title, onBack, children }: ShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <Screen tone="plain" className="bg-white">
      <View className="flex-1 bg-white">
        <View
          className="flex-1 bg-white"
          accessibilityLabel={title}
          style={{ paddingTop: Math.max(insets.top, 8), paddingBottom: Math.max(insets.bottom, 8) }}
        >
          <CloseBar onClose={onBack} />
          {children}
        </View>
      </View>
    </Screen>
  );
}

/** One colored slab. Selected tiles keep their color and get a thick ink frame. */
function Tile({
  label,
  sub,
  selected,
  image,
  emojis,
  colorIndex,
  onPress,
  flex
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  image?: ImageSourcePropType;
  emojis?: readonly string[];
  colorIndex: number;
  onPress: (origin: { x: number; y: number }, emojis: readonly string[]) => void;
  flex?: number;
}) {
  const boxRef = useRef<View>(null);
  const look = TILE_LOOKS[colorIndex % TILE_LOOKS.length]!;
  const shower = emojis?.length ? emojis : look.emojis;
  const on = !!selected;

  // THIS SECTION DOES: measure the middle of the tile so emojis explode from there.
  const handlePress = () => {
    const fire = (origin: { x: number; y: number }) => onPress(origin, shower);
    const node = boxRef.current;
    if (!node?.measureInWindow) {
      fire({ x: 180, y: 320 });
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      fire({
        x: x + (width || 160) / 2,
        y: y + (height || 80) / 2
      });
    });
  };

  return (
    <View ref={boxRef} collapsable={false} style={{ flex: flex ?? 1 }}>
      <Pressable
        onPress={withAnalyticsPress(QUIZ.take.option, handlePress)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        accessibilityLabel={sub ? `${label}, ${sub}` : label}
        className="min-h-[44px] flex-1 flex-row items-center px-6 py-4 active:opacity-90"
        style={{
          backgroundColor: look.bg,
          borderWidth: on ? 4 : 0,
          borderColor: INK,
          justifyContent: image ? 'space-between' : 'center',
          gap: 16
        }}
      >
        {/* THIS SECTION DOES: words stay centered; a picture always sits in the same right slot. */}
        <View className="min-w-0 flex-1 items-center justify-center">
          <Text
            className="font-sans-b text-[20px] leading-tight"
            style={{ color: look.fg, textAlign: 'center' }}
          >
            {label}
          </Text>
          {sub ? (
            <Text
              className="mt-1 font-sans-sb text-[12px]"
              style={{ color: look.fg, opacity: 0.8, textAlign: 'center' }}
            >
              {sub}
            </Text>
          ) : null}
        </View>
        {image ? (
          <View
            accessible={false}
            style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}
          >
            <Image
              source={image}
              accessible={false}
              resizeMode="contain"
              style={{ width: 88, height: 88 }}
            />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

/** Question on top, answers in a large geometric grid. */
export function BrutalistTake({
  title,
  question,
  options,
  onBack,
  onSelect,
  onBurst,
  colorShift = 0,
  footer
}: {
  title: string;
  question: string;
  options: BrutalistOption[];
  onBack: () => void;
  onSelect: (key: string) => void;
  /** Start the explode. Parent keeps it on top so it outlives this screen. */
  onBurst?: (emojis: readonly string[], origin: { x: number; y: number }) => void;
  /** Slide the color wheel (rapid fire: a new pair every question). */
  colorShift?: number;
  footer?: React.ReactNode;
}) {
  const n = options.length;
  const compact = n > 4;
  // Multi-select (Part 3) already has a selected flag.
  const isMulti = options.some((o) => o.selected !== undefined);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    []
  );

  // A new question should start clean. Same box index is not "already picked."
  useEffect(() => {
    setFlashKey(null);
    pendingRef.current = false;
  }, [question]);

  // THIS SECTION DOES: explode now, then wait a half-second before flipping.
  // The emojis live on the parent so they keep falling over commentary.
  function handlePick(
    key: string,
    origin: { x: number; y: number },
    emojis: readonly string[]
  ) {
    if (!isMulti && pendingRef.current) return;
    onBurst?.(emojis, origin);
    setFlashKey(key);
    if (isMulti) {
      onSelect(key);
      return;
    }
    pendingRef.current = true;
    const t = setTimeout(() => {
      pendingRef.current = false;
      onSelect(key);
    }, ADVANCE_MS);
    timersRef.current.push(t);
  }

  return (
    <BrutalistShell title={title} onBack={onBack}>
      <View className="flex-1" style={{ gap: GUTTER, paddingHorizontal: GUTTER }}>
        <Pressable
          onPress={() => trackDeadClick(QUIZ.take.question)}
          accessibilityRole="header"
          accessibilityLabel={question}
          className="items-center justify-center px-5"
          style={{
            flex: compact ? 0 : 0.85,
            backgroundColor: NAVY,
            minHeight: compact ? 72 : 120,
            paddingVertical: compact ? 14 : 0
          }}
        >
          <Text
            className={`text-center font-sans-b leading-tight text-white ${compact ? 'text-[22px]' : 'text-[28px]'}`}
          >
            {question}
          </Text>
        </Pressable>

        {compact ? (
          <CompactAnswerGrid
            options={options}
            flashKey={flashKey}
            colorShift={colorShift}
            onPick={handlePick}
          />
        ) : (
            <AnswerGrid
            options={options}
            flashKey={flashKey}
            colorShift={colorShift}
            onPick={handlePick}
          />
        )}

        {footer}
      </View>
    </BrutalistShell>
  );
}

/** Lots of tiles (Part 3 friends): pairs fill the page. An odd last one stays
 *  the same size and sits in the middle of its row. */
function CompactAnswerGrid({
  options,
  flashKey,
  colorShift,
  onPick
}: {
  options: BrutalistOption[];
  flashKey: string | null;
  colorShift: number;
  onPick: (
    key: string,
    origin: { x: number; y: number },
    emojis: readonly string[]
  ) => void;
}) {
  const rows: BrutalistOption[][] = [];
  for (let i = 0; i < options.length; i += 2) {
    rows.push(options.slice(i, i + 2));
  }

  return (
    <View className="flex-1" style={{ gap: GUTTER }}>
      {rows.map((row, rowI) => {
        if (row.length === 2) {
          return (
            <View key={rowI} className="flex-1 flex-row" style={{ gap: GUTTER }}>
              {row.map((o, colI) => (
                <Tile
                  key={o.key}
                  label={o.label}
                  sub={o.sub}
                  image={o.image}
                  emojis={o.emojis}
                  selected={o.selected || o.key === flashKey}
                  colorIndex={rowI * 2 + colI + colorShift}
                  onPress={(origin, emojis) => onPick(o.key, origin, emojis)}
                />
              ))}
            </View>
          );
        }
        const o = row[0]!;
        return (
          <View key={rowI} className="flex-1 flex-row">
            <View style={{ flex: 1 }} />
            <View style={{ flex: 2 }}>
              <Tile
                label={o.label}
                sub={o.sub}
                image={o.image}
                emojis={o.emojis}
                selected={o.selected || o.key === flashKey}
                colorIndex={rowI * 2 + colorShift}
                onPress={(origin, emojis) => onPick(o.key, origin, emojis)}
              />
            </View>
            <View style={{ flex: 1 }} />
          </View>
        );
      })}
    </View>
  );
}

/** 1–4 answers share the leftover height. 2 stack. 3 is two-plus-one. 4 is 2×2. */
function AnswerGrid({
  options,
  flashKey,
  colorShift,
  onPick
}: {
  options: BrutalistOption[];
  flashKey: string | null;
  colorShift: number;
  onPick: (
    key: string,
    origin: { x: number; y: number },
    emojis: readonly string[]
  ) => void;
}) {
  const n = options.length;
  const renderTile = (o: BrutalistOption, i: number) => (
    <Tile
      key={o.key}
      label={o.label}
      sub={o.sub}
      image={o.image}
      emojis={o.emojis}
      selected={o.selected || o.key === flashKey}
      colorIndex={i + colorShift}
      onPress={(origin, emojis) => onPick(o.key, origin, emojis)}
    />
  );

  if (n <= 2) {
    return (
      <View className="flex-1" style={{ gap: GUTTER }}>
        {options.map((o, i) => renderTile(o, i))}
      </View>
    );
  }
  if (n === 3) {
    return (
      <View className="flex-1" style={{ gap: GUTTER }}>
        <View className="flex-1 flex-row" style={{ gap: GUTTER }}>
          {options.slice(0, 2).map((o, i) => renderTile(o, i))}
        </View>
        {renderTile(options[2]!, 2)}
      </View>
    );
  }
  const rows = [options.slice(0, 2), options.slice(2, 4)];
  return (
    <View className="flex-1" style={{ gap: GUTTER }}>
      {rows.map((row, rowI) => (
        <View key={rowI} className="flex-1 flex-row" style={{ gap: GUTTER }}>
          {row.map((o, colI) => renderTile(o, rowI * 2 + colI))}
        </View>
      ))}
    </View>
  );
}

/** Yellow beat between questions: free-standing copy, X to leave, Continue at the bottom. */
export function BrutalistMessage({
  title,
  text,
  onBack,
  onNext,
  nextLabel = 'Continue',
  display
}: {
  title: string;
  text: string;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  display?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Screen tone="plain" className="bg-white">
      <View
        className="flex-1"
        accessibilityLabel={title}
        style={{
          backgroundColor: COMMENTARY_YELLOW,
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: Math.max(insets.bottom, 8)
        }}
      >
        <CloseBar onClose={onBack} />

        {/* THIS SECTION DOES: the quip sits in the middle, no box around it. */}
        <Pressable
          onPress={() => trackDeadClick(QUIZ.take.commentary)}
          accessibilityRole="text"
          accessibilityLabel={text}
          className="flex-1 items-center justify-center px-7"
        >
          <Text
            className="text-center font-sans-b text-[28px] leading-tight"
            style={{ color: NAVY }}
          >
            {text}
          </Text>
          {display}
        </Pressable>

        {/* THIS SECTION DOES: Continue is the old-Windows silver bevel, parked at the bottom. */}
        <View className="px-3 pb-1">
          <ButtonPrimary
            full
            size="lg"
            analyticsId={QUIZ.take.next}
            accessibilityLabel={nextLabel}
            onPress={onNext}
          >
            {nextLabel}
          </ButtonPrimary>
        </View>
      </View>
    </Screen>
  );
}

export function BrutalistLoading({ onBack }: { onBack: () => void }) {
  return (
    <BrutalistMessage
      title={MANIFEST.title}
      text="Loading…"
      onBack={onBack}
      onNext={onBack}
      nextLabel="Back"
    />
  );
}

export { NAVY as BRUTAL_NAVY };
