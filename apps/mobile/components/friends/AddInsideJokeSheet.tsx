// ============================================
// WHAT THIS FILE DOES (plain English):
// Sheet to write a new Inside Joke: the quote, who was in it, and where it
// happened. Tagging people lands the note on their walls too. Posts through
// the insideJokes data layer.
// Analytics: on post, emit inside_joke_posted with tagged counts only
// (never the joke text or people's names).
// ============================================
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { trackProduct } from '@bridger/shared';
import {
  ACCENTS,
  Avatar,
  ButtonPrimary,
  ButtonSecondary,
  Sheet,
  TextField,
  cn
} from '@bridger/ui';
import type { AddInsideJokeInput } from '../../data/insideJokes';
import { recentEventNames, taggablePeople } from '../../data/pod';

export function AddInsideJokeSheet({
  open,
  onClose,
  onAdd
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: AddInsideJokeInput) => void | Promise<void>;
}) {
  const [text, setText] = useState('');
  const [tagged, setTagged] = useState<string[]>([]);
  const [eventName, setEventName] = useState<string | null>(null);
  const people = taggablePeople().slice(0, 6);
  const events = recentEventNames().slice(0, 3);

  const reset = () => {
    setText('');
    setTagged([]);
    setEventName(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = () => {
    if (!text.trim()) return;
    void onAdd({
      text: text.trim(),
      taggedIds: tagged,
      eventName: eventName ?? undefined
    });
    // Outcome only: counts and bools, never the joke text or names.
    trackProduct('inside_joke_posted', {
      tagged_people: tagged.length,
      tagged_event: !!eventName
    });
    close();
  };

  const shareLine = () => {
    const bits: string[] = [];
    if (tagged.length > 0) bits.push(`${tagged.length} tagged`);
    if (eventName) bits.push(`everyone at ${eventName}`);
    return bits.length > 0
      ? `Goes to ${bits.join(' and ')}. It lands on their walls too.`
      : 'Just yours until you tag someone.';
  };

  return (
    <Sheet open={open} onClose={close} title="Add an Inside Joke">
      <ScrollView
        className="max-h-[70vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View className="gap-4">
        <TextField
          label="The quote"
          multiline
          value={text}
          onChange={setText}
          placeholder="Bread is just a warm friend."
        />

        <View>
          <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
            Who was in it
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {people.map((p) => {
              const on = tagged.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    setTagged((t) => (on ? t.filter((id) => id !== p.id) : [...t, p.id]))
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Tag ${p.name}`}
                  className={cn(
                    'min-h-[44px] flex-row items-center gap-1.5 rounded-full border py-1 pl-1 pr-3',
                    on ? 'border-purple bg-purple' : 'border-ink-line bg-surface active:bg-ink/5'
                  )}
                >
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="xs" />
                  <Text className={cn('font-sans-b text-[12px]', on ? 'text-white' : 'text-ink')}>
                    {p.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
            Where it happened
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {events.map((title) => {
              const on = eventName === title;
              return (
                <Pressable
                  key={title}
                  onPress={() => setEventName(on ? null : title)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Tag event ${title}`}
                  className={cn(
                    'min-h-[36px] items-center justify-center rounded-full border px-3 py-1.5',
                    on
                      ? cn(ACCENTS.teal.bg, 'border-transparent')
                      : 'border-ink-line bg-surface active:bg-[#E6F7F0]'
                  )}
                >
                  <Text className={cn('font-sans-b text-[12px]', on ? ACCENTS.teal.text : 'text-ink')}>
                    {title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text className="font-sans-sb text-[12px] leading-snug text-ink-mute">{shareLine()}</Text>

        <View className="gap-2">
          <ButtonPrimary full size="lg" onPress={save} disabled={!text.trim()}>
            Post it
          </ButtonPrimary>
          <ButtonSecondary full tone="ghost" onPress={close}>
            Never mind
          </ButtonSecondary>
        </View>
      </View>
      </ScrollView>
    </Sheet>
  );
}
