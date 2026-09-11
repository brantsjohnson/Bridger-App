// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friends roster grouped by Close / Friends / Acquaintances. In Edit mode
// you drag a whole row into another dashed group on web and on phone (same
// pan gesture). A short tap still opens Move-to… if you prefer picking.
// Dropping on a new circle calls onDropTier — that is the real retier outcome.
// ============================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Text,
  View,
  useWindowDimensions,
  type View as RNView
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import type { Tier } from '@bridger/shared';
import { FRIENDS, TIER_LABEL } from '@bridger/shared';
import { SectionTitle, cn } from '@bridger/ui';
import type { RosterSection } from '../../data/friends';
import { FriendRow, type FriendRowPerson } from './FriendRow';

const TIER_DESCRIPTIONS: Record<Tier, string> = {
  close: 'Your innermost circle. They see the most of your profile and updates.',
  friend: 'Your main circle. They see most of what you share.',
  acquaintance: 'People you know a little. They see the least of your profile.',
  none: 'Private, visible only to you.'
};

type SectionLayout = { y: number; height: number };

export function FriendsRoster({
  sections,
  editing,
  onOpenPerson,
  onOpenStory,
  onOpenMove,
  onDropTier,
  onDraggingChange
}: {
  sections: RosterSection[];
  editing: boolean;
  onOpenPerson: (person: FriendRowPerson) => void;
  onOpenStory: (person: FriendRowPerson) => void;
  /** Accessibility fallback: open the Move-to sheet */
  onOpenMove: (person: FriendRowPerson) => void;
  onDropTier: (person: FriendRowPerson, tier: Tier) => void;
  /** Parent freezes page scroll while a drag is in progress */
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overTier, setOverTier] = useState<Tier | null>(null);
  const [ghost, setGhost] = useState<FriendRowPerson | null>(null);

  const layouts = useRef<Partial<Record<Tier, SectionLayout>>>({});
  const sectionRefs = useRef<Partial<Record<Tier, RNView | null>>>({});
  const dragIdRef = useRef<string | null>(null);
  const didDragRef = useRef(false);
  const peopleById = useRef<Record<string, FriendRowPerson>>({});

  peopleById.current = Object.fromEntries(
    sections.flatMap((s) => s.people.map((p) => [p.id, p]))
  );

  // Ghost uses window coordinates so a Modal can follow the finger / pointer.
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);

  const ghostStyle = useAnimatedStyle(() => ({
    left: ghostX.value,
    top: ghostY.value
  }));

  const measureSections = useCallback(() => {
    for (const section of sections) {
      sectionRefs.current[section.tier]?.measureInWindow((_x, y, _w, h) => {
        layouts.current[section.tier] = { y, height: h };
      });
    }
  }, [sections]);

  const tierAtY = useCallback(
    (absoluteY: number): Tier | null => {
      for (const section of sections) {
        const L = layouts.current[section.tier];
        if (L && absoluteY >= L.y && absoluteY <= L.y + L.height) {
          return section.tier;
        }
      }
      return null;
    },
    [sections]
  );

  const beginDrag = useCallback(
    (person: FriendRowPerson, absoluteX: number, absoluteY: number) => {
      measureSections();
      didDragRef.current = true;
      dragIdRef.current = person.id;
      setDragId(person.id);
      setGhost(person);
      ghostX.value = absoluteX - Math.min(160, windowWidth * 0.4);
      ghostY.value = absoluteY - 36;
      setOverTier(person.tier ?? null);
      onDraggingChange?.(true);
    },
    [ghostX, ghostY, measureSections, onDraggingChange, windowWidth]
  );

  const moveDrag = useCallback(
    (absoluteX: number, absoluteY: number) => {
      // Remeasure so drop zones stay accurate if the page shifted.
      measureSections();
      ghostX.value = absoluteX - Math.min(160, windowWidth * 0.4);
      ghostY.value = absoluteY - 36;
      setOverTier(tierAtY(absoluteY));
    },
    [ghostX, ghostY, measureSections, tierAtY, windowWidth]
  );

  const endDrag = useCallback(
    (absoluteY: number) => {
      const id = dragIdRef.current;
      const person = id ? peopleById.current[id] : null;
      measureSections();
      const target = tierAtY(absoluteY);
      dragIdRef.current = null;
      setDragId(null);
      setGhost(null);
      setOverTier(null);
      onDraggingChange?.(false);
      if (person && target && target !== person.tier) {
        onDropTier(person, target);
      }
      // Keep didDrag true briefly so the trailing tap does not open Move-to.
      setTimeout(() => {
        didDragRef.current = false;
      }, 50);
    },
    [measureSections, onDraggingChange, onDropTier, tierAtY]
  );

  const cancelDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    setGhost(null);
    setOverTier(null);
    onDraggingChange?.(false);
    didDragRef.current = false;
  }, [onDraggingChange]);

  const tryOpenMove = useCallback(
    (person: FriendRowPerson) => {
      // If this press was part of a drag, ignore the tap.
      if (didDragRef.current) return;
      onOpenMove(person);
    },
    [onOpenMove]
  );

  // First visible tier sits tight under Your circle / search. Later ones keep air.
  const firstVisible = sections.findIndex((s) => s.people.length > 0 || editing);

  return (
    <View>
      {sections.map((section, index) => {
        if (section.people.length === 0 && !editing) return null;
        const isOver = editing && overTier === section.tier;

        return (
          <View
            key={section.tier}
            ref={(node) => {
              sectionRefs.current[section.tier] = node;
            }}
            onLayout={() => {
              sectionRefs.current[section.tier]?.measureInWindow((_x, y, _w, h) => {
                layouts.current[section.tier] = { y, height: h };
              });
            }}
            className={cn(
              'rounded-2xl',
              index === firstVisible ? 'mt-1' : 'mt-7',
              editing && 'border border-dashed border-ink/20 p-3',
              isOver && 'border-solid border-purple bg-purple/10'
            )}
          >
            <SectionTitle
              title={TIER_LABEL[section.tier]}
              description={TIER_DESCRIPTIONS[section.tier]}
              infoAnalyticsId={FRIENDS.roster.info}
              parentScreen="friends"
              section="roster"
              analyticsProps={{ tier: section.tier }}
              count={section.people.length}
              className="mb-2"
            />

            <View className="gap-2.5">
              {section.people.length === 0 && editing ? (
                <Text className="py-3 text-center font-sans-sb text-[12px] text-ink-mute">
                  Drop someone here
                </Text>
              ) : null}

              {section.people.map((p, i) => (
                <DraggableFriendRow
                  key={p.id}
                  person={p}
                  index={i}
                  editing={editing}
                  dragging={dragId === p.id}
                  onOpenPerson={() => onOpenPerson(p)}
                  onOpenStory={() => onOpenStory(p)}
                  onOpenMove={() => tryOpenMove(p)}
                  onDragBegin={(x, y) => beginDrag(p, x, y)}
                  onDragMove={moveDrag}
                  onDragEnd={endDrag}
                  onDragCancel={cancelDrag}
                />
              ))}
            </View>
          </View>
        );
      })}

      {/* Floating preview above the page so ScrollView cannot clip it. */}
      <Modal visible={!!ghost} transparent animationType="none" statusBarTranslucent>
        <View pointerEvents="none" style={{ flex: 1 }}>
          {ghost ? (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: Math.min(windowWidth - 40, 360),
                  zIndex: 100,
                  opacity: 0.95,
                  // Web: show grab cursor while the ghost follows the pointer.
                  ...(Platform.OS === 'web' ? ({ cursor: 'grabbing' } as object) : null)
                },
                ghostStyle
              ]}
            >
              <FriendRow person={ghost} editing dragging />
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

/**
 * One roster row. In Edit mode the whole card is draggable (web + native)
 * via a pan gesture — not HTML5 DnD, which RN-web does not support well.
 */
function DraggableFriendRow({
  person,
  index,
  editing,
  dragging,
  onOpenPerson,
  onOpenStory,
  onOpenMove,
  onDragBegin,
  onDragMove,
  onDragEnd,
  onDragCancel
}: {
  person: FriendRowPerson;
  index: number;
  editing: boolean;
  dragging: boolean;
  onOpenPerson: () => void;
  onOpenStory: () => void;
  onOpenMove: () => void;
  onDragBegin: (absoluteX: number, absoluteY: number) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (absoluteY: number) => void;
  onDragCancel: () => void;
}) {
  // Pan wins once you move; a clean tap still opens Move-to…
  const composed = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(editing)
      .minDistance(6)
      .onStart((e) => {
        runOnJS(onDragBegin)(e.absoluteX, e.absoluteY);
      })
      .onUpdate((e) => {
        runOnJS(onDragMove)(e.absoluteX, e.absoluteY);
      })
      .onEnd((e) => {
        runOnJS(onDragEnd)(e.absoluteY);
      })
      .onFinalize((_e, success) => {
        if (!success) runOnJS(onDragCancel)();
      });

    const tap = Gesture.Tap()
      .enabled(editing)
      .onEnd(() => {
        runOnJS(onOpenMove)();
      });

    return Gesture.Exclusive(pan, tap);
  }, [editing, onDragBegin, onDragCancel, onDragEnd, onDragMove, onOpenMove]);

  const row = (
    <Animated.View
      // Web needs touch-action none so the browser does not scroll instead of drag.
      style={
        Platform.OS === 'web' && editing
          ? ({ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' } as object)
          : undefined
      }
    >
      <FriendRow
        person={person}
        index={index}
        editing={editing}
        dragging={dragging}
        onPress={onOpenPerson}
        onStory={onOpenStory}
      />
    </Animated.View>
  );

  if (!editing) return row;

  return <GestureDetector gesture={composed}>{row}</GestureDetector>;
}
