// ============================================
// WHAT THIS FILE DOES (plain English):
// The five recap questions as a swipeable deck. Swipe left/right to move
// between them, or tap a segment in the little bar on top to jump straight to
// one. Skipping a question is the normal thing to do here, not a mistake, so
// there is no "you must answer this" gate — you just move on. A segment turns
// green once you have recorded an answer for that question.
//
// ACCESSIBILITY: each segment is a button that says which question it is and
// whether it is recorded; the current one is announced. Swiping is a plain
// horizontal scroll so VoiceOver / TalkBack can page through it too.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckIcon
} from 'lucide-react-native';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { cn, withAnalyticsPress } from '@bridger/ui';

/** Soft lavender wash on each question card (same as the recorder chrome). */
const CARD_BG = '#EDE6FF';

export function QuestionCarousel({
  questions,
  index,
  onIndexChange,
  answered,
  segmentAnalyticsId
}: {
  questions: string[];
  /** Which question is showing right now. */
  index: number;
  /** Called when a swipe or a segment tap lands on a new question. */
  onIndexChange: (i: number) => void;
  /** Indexes that already have a recorded take (turn green). */
  answered: number[];
  /** Analytics id for tapping a segment to jump (method = swipe|tap). */
  segmentAnalyticsId: string;
}) {
  const scroller = useRef<ScrollView>(null);
  // Width of one page, measured once we know how wide the deck is.
  const [width, setWidth] = useState(0);
  // True while WE are scrolling the deck (so we do not echo it back as a swipe).
  const programmatic = useRef(false);

  // THIS SECTION DOES: when the parent moves the index (segment tap), slide the
  // deck to match. Guarded so it does not fight a real finger swipe.
  useEffect(() => {
    if (width <= 0) return;
    programmatic.current = true;
    scroller.current?.scrollTo({ x: index * width, animated: true });
    // Clear the guard after the animation would have settled.
    const t = setTimeout(() => {
      programmatic.current = false;
    }, 320);
    return () => clearTimeout(t);
  }, [index, width]);

  // THIS SECTION DOES: after a finger swipe settles, tell the parent which
  // question we landed on (unless we moved the deck ourselves).
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (programmatic.current || width <= 0) return;
    const landed = Math.round(e.nativeEvent.contentOffset.x / width);
    if (landed !== index) onIndexChange(landed);
  };

  return (
    <View>
      {/* THE MAP: one segment per question. Green = recorded. Tap to jump. */}
      <View className="flex-row items-center gap-1.5">
        {questions.map((q, i) => {
          const isAnswered = answered.includes(i);
          const isCurrent = i === index;
          return (
            <Pressable
              key={`${q}-${i}`}
              onPress={withAnalyticsPress(
                segmentAnalyticsId,
                () => onIndexChange(i),
                { analyticsProps: { method: 'tap', page_index: i } }
              )}
              accessibilityRole="button"
              accessibilityState={{ selected: isCurrent }}
              accessibilityLabel={`Question ${i + 1}${isAnswered ? ', recorded' : ''}`}
              hitSlop={8}
              className="min-h-[16px] flex-1 justify-center py-1.5"
            >
              <View
                className={cn(
                  'h-2 w-full rounded-full',
                  isAnswered ? 'bg-success' : isCurrent ? 'bg-purple' : 'bg-ink/15'
                )}
              />
            </Pressable>
          );
        })}
      </View>

      {/* THE DECK: a paged horizontal scroller, one question card per page. */}
      <View
        className="mt-3"
        onLayout={(e: LayoutChangeEvent) =>
          setWidth(Math.max(1, e.nativeEvent.layout.width))
        }
      >
        {width > 0 ? (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            // Start on the current question without an animation flash.
            contentOffset={{ x: index * width, y: 0 }}
          >
            {questions.map((q, i) => {
              const isAnswered = answered.includes(i);
              return (
                <View key={`${q}-${i}`} style={{ width }}>
                  <View
                    className="mx-0.5 items-center rounded-2xl px-5 py-6"
                    style={{ backgroundColor: CARD_BG }}
                  >
                    <View className="flex-row items-center gap-1.5">
                      <Text className="font-sans-b text-[11px] uppercase tracking-wide text-onaccent/55">
                        Q{i + 1} of {questions.length}
                      </Text>
                      {isAnswered ? (
                        <View className="flex-row items-center gap-1 rounded-full bg-success px-2 py-[3px]">
                          <CheckIcon size={11} color="#FFFFFF" strokeWidth={3} />
                          <Text className="font-sans-b text-[10px] text-white">Recorded</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="mt-1.5 text-center font-sans-b text-[19px] leading-snug text-onaccent">
                      {q}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {/* The plain-English rule: moving on is fine, answering all five is not required. */}
      <Text className="mt-2 text-center font-sans-b text-[11px] text-ink-mute">
        Swipe to move on · skip anything you don't want to answer
      </Text>
    </View>
  );
}
