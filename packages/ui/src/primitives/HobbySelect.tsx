// ============================================
// WHAT THIS FILE DOES (plain English):
// The hobbies picker: search, category groups, colorful chips, and "+ Add your
// own." Tapping a chip jiggles it like jelly and sprays that hobby's emoji
// upward. Custom hobbies you type stay on the list until you remove them.
// Analytics: chip taps use hobby_select (never the hobby name). Search never
// logs what you typed. Category titles log dead_click if someone taps them.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { PlusIcon, XIcon } from 'lucide-react-native';
import { PROFILE, trackProduct } from '@bridger/shared';
import { TextField } from './Field';
import { SearchField } from './SearchField';
import { NATIVE_DRIVER, useReduceMotion } from '../lib/whimsy';
import { cn } from '../lib/cn';
import { AnalyticsRegion, withAnalyticsPress } from '../lib/analytics';
import type { HobbyBurstOrigin } from './HobbyEmojiBurst';

export type HobbyOption = {
  id: string;
  label: string;
  emoji?: string;
  group?: string;
  groupEmojis?: string[];
  custom?: boolean;
};

type CustomHobby = { id: string; label: string; emoji: string };

type Props = {
  questionId: string;
  options: HobbyOption[];
  selected: string[];
  onChange: (id: string, value: string | string[]) => void;
  onBurst: (emoji: string, origin: HobbyBurstOrigin) => void;
};

type Grouped = {
  name: string;
  emojis: string[];
  hobbies: HobbyOption[];
};

function groupOptions(options: HobbyOption[]): Grouped[] {
  const order: string[] = [];
  const map = new Map<string, Grouped>();
  for (const o of options) {
    const name = o.group ?? 'More';
    if (!map.has(name)) {
      order.push(name);
      map.set(name, { name, emojis: o.groupEmojis ?? [], hobbies: [] });
    }
    map.get(name)!.hobbies.push(o);
  }
  return order.map((name) => map.get(name)!);
}

export function HobbySelect({
  questionId,
  options,
  selected,
  onChange,
  onBurst
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customHobbies, setCustomHobbies] = useState<CustomHobby[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [jellying, setJellying] = useState<Set<string>>(new Set());

  const catalog = useMemo(() => {
    const extras: HobbyOption[] = customHobbies.map((h) => ({
      id: h.id,
      label: h.label,
      emoji: h.emoji,
      group: 'Yours',
      groupEmojis: ['✨'],
      custom: true
    }));
    return [...options, ...extras];
  }, [options, customHobbies]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groups = groupOptions(catalog).map((g) => ({
      ...g,
      hobbies: q
        ? g.hobbies.filter((h) => h.label.toLowerCase().includes(q))
        : g.hobbies
    }));
    return groups.filter((g) => g.hobbies.length > 0);
  }, [catalog, searchQuery]);

  const toggle = (hobby: HobbyOption, origin: HobbyBurstOrigin) => {
    const picked = selected.includes(hobby.id);
    if (hobby.emoji) onBurst(hobby.emoji, origin);
    setJellying((prev) => new Set(prev).add(hobby.id));
    setTimeout(() => {
      setJellying((prev) => {
        const next = new Set(prev);
        next.delete(hobby.id);
        return next;
      });
    }, 1200);

    const next = picked
      ? selected.filter((id) => id !== hobby.id)
      : [...selected, hobby.id];
    onChange(questionId, next);
    if (!picked) {
      trackProduct('module_item_added', { module: 'hobbies', items_added: 1 });
    }
  };

  const addCustom = () => {
    const name = customName.trim();
    const emoji = customEmoji.trim();
    if (!name || !emoji) return;
    const id = `custom-${Date.now()}`;
    const hobby: CustomHobby = { id, label: name, emoji };
    setCustomHobbies((prev) => [...prev, hobby]);
    onChange(questionId, [...selected, id]);
    onChange(`customLabel:${id}`, name);
    onChange(`customEmoji:${id}`, emoji);
    trackProduct('module_item_added', { module: 'hobbies', items_added: 1 });
    setCustomName('');
    setCustomEmoji('');
    setShowCustomInput(false);
  };

  const removeCustom = (hobby: CustomHobby) => {
    setCustomHobbies((prev) => prev.filter((h) => h.id !== hobby.id));
    onChange(
      questionId,
      selected.filter((id) => id !== hobby.id)
    );
  };

  return (
    <View className="gap-4">
      <SearchField
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search hobbies"
        analyticsId={PROFILE.module.hobby_search}
      />

      {filtered.map((group) => (
        <View key={group.name} className="gap-2">
          <AnalyticsRegion
            analyticsId={PROFILE.module.hobby_category}
            interactive={false}
            accessibilityLabel={`${group.name} hobbies`}
          >
            <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
              {group.emojis.join(' ')} {group.name}
            </Text>
          </AnalyticsRegion>
          <View className="flex-row flex-wrap gap-2">
            {group.hobbies.map((hobby) => (
              <HobbyChip
                key={hobby.id}
                hobby={hobby}
                picked={selected.includes(hobby.id)}
                jellying={jellying.has(hobby.id)}
                onToggle={toggle}
                onRemove={
                  hobby.custom
                    ? () =>
                        removeCustom({
                          id: hobby.id,
                          label: hobby.label,
                          emoji: hobby.emoji ?? '✨'
                        })
                    : undefined
                }
              />
            ))}
          </View>
        </View>
      ))}

      {showCustomInput ? (
        <View className="gap-2 rounded-2xl border border-ink-line bg-surface px-3.5 py-3">
          <Text className="font-sans-b text-[13px] text-ink">Add your own</Text>
          <TextField
            label="Hobby name"
            value={customName}
            onChange={setCustomName}
            placeholder="Bouldering"
            analyticsId={PROFILE.module.hobby_custom_name}
          />
          <TextField
            label="Emoji"
            value={customEmoji}
            onChange={setCustomEmoji}
            placeholder="🧗"
            analyticsId={PROFILE.module.hobby_custom_emoji}
          />
          <Pressable
            onPress={withAnalyticsPress(PROFILE.module.hobby_custom_save, addCustom)}
            accessibilityRole="button"
            accessibilityLabel="Save custom hobby"
            accessibilityState={{ disabled: !customName.trim() || !customEmoji.trim() }}
            className="min-h-[44px] items-center justify-center rounded-full bg-ink px-4"
          >
            <Text className="font-sans-b text-[14px] text-canvas">Add hobby</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={withAnalyticsPress(PROFILE.module.hobby_add_own, () =>
            setShowCustomInput(true)
          )}
          accessibilityRole="button"
          accessibilityLabel="Add your own hobby"
          className="min-h-[44px] flex-row items-center justify-center gap-1.5 rounded-full border border-ink-line bg-surface px-4"
        >
          <PlusIcon size={16} color="#1C1B16" strokeWidth={2.6} />
          <Text className="font-sans-b text-[14px] text-ink">Add your own</Text>
        </Pressable>
      )}
    </View>
  );
}

function HobbyChip({
  hobby,
  picked,
  jellying,
  onToggle,
  onRemove
}: {
  hobby: HobbyOption;
  picked: boolean;
  jellying: boolean;
  onToggle: (hobby: HobbyOption, origin: HobbyBurstOrigin) => void;
  onRemove?: () => void;
}) {
  const ref = useRef<View>(null);

  const handlePress = () => {
    ref.current?.measureInWindow((x, y, w, h) => {
      onToggle(hobby, { x: x + w / 2, y: y + h / 2 });
    });
  };

  return (
    <View ref={ref} collapsable={false}>
      <JelloWrap active={jellying}>
        <Pressable
          onPress={withAnalyticsPress(PROFILE.module.hobby_select, handlePress)}
          accessibilityRole="button"
          accessibilityState={{ selected: picked }}
          accessibilityLabel={hobby.label}
          className={cn(
            'min-h-[44px] flex-row items-center gap-1.5 rounded-full border px-3.5 py-2.5',
            picked ? 'border-ink bg-green' : 'border-ink-line bg-surface'
          )}
        >
          {hobby.emoji ? (
            <Text accessible={false} className="text-[14px]">
              {hobby.emoji}
            </Text>
          ) : null}
          <Text
            className={cn(
              'font-sans-b text-[14px]',
              picked ? 'text-ink' : 'text-ink-soft'
            )}
          >
            {hobby.label}
          </Text>
          {onRemove ? (
            <Pressable
              onPress={withAnalyticsPress(PROFILE.module.hobby_custom_remove, onRemove)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${hobby.label}`}
              hitSlop={8}
              className="h-7 w-7 items-center justify-center"
            >
              <XIcon size={14} color="#1C1B16" strokeWidth={2.6} />
            </Pressable>
          ) : null}
        </Pressable>
      </JelloWrap>
    </View>
  );
}

/** Squash-and-stretch jiggle when a chip is tapped. Skips if Reduce Motion is on. */
function JelloWrap({
  active,
  children
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReduceMotion();
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active || reduce) return;
    const bounce = (x: number, y: number, ms: number) =>
      Animated.parallel([
        Animated.timing(scaleX, {
          toValue: x,
          duration: ms,
          useNativeDriver: NATIVE_DRIVER
        }),
        Animated.timing(scaleY, {
          toValue: y,
          duration: ms,
          useNativeDriver: NATIVE_DRIVER
        })
      ]);
    Animated.sequence([
      bounce(1.22, 0.78, 160),
      bounce(0.82, 1.18, 140),
      bounce(1.12, 0.9, 140),
      bounce(0.96, 1.06, 160),
      bounce(1.04, 0.97, 180),
      bounce(1, 1, 220)
    ]).start();
  }, [active, reduce, scaleX, scaleY]);

  return (
    <Animated.View style={{ transform: [{ scaleX }, { scaleY }] }}>
      {children}
    </Animated.View>
  );
}
