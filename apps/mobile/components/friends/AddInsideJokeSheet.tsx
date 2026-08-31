// ============================================
// WHAT THIS FILE DOES (plain English):
// Sheet to write a new Inside Joke: the quote, who said it, and where it
// happened. Tagging people lands the note on their walls too. Posts through
// the insideJokes data layer.
// Analytics: on post, emit inside_joke_posted with tagged counts only
// (never the joke text or people's names).
// ============================================
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { ADD_INSIDE_JOKE_SHEET, trackProduct, type Person } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  Avatar,
  ButtonPrimary,
  ButtonSecondary,
  Sheet,
  TextField,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import type { AddInsideJokeInput } from '../../data/insideJokes';
import { listEvents } from '../../data/events';
import { listFriends } from '../../data/friends';

const SHEET_SCROLL_MAX = Math.round(Dimensions.get('window').height * 0.72);

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
  /** Optional free-typed place / event name. */
  const [whereText, setWhereText] = useState('');
  /** Optional chip from a recent event (fills where when picked). */
  const [eventChip, setEventChip] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [eventNames, setEventNames] = useState<string[]>([]);

  // THIS SECTION DOES: load real friends + recent events whenever the sheet opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const [friends, events] = await Promise.all([
        listFriends().catch(() => [] as Person[]),
        listEvents().catch(() => [])
      ]);
      if (cancelled) return;
      setPeople(friends);
      setEventNames(
        events
          .map((e) => e.title?.trim())
          .filter((t): t is string => Boolean(t))
          .slice(0, 6)
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const reset = () => {
    setText('');
    setTagged([]);
    setWhereText('');
    setEventChip(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const resolvedWhere = whereText.trim() || eventChip || undefined;

  const save = () => {
    if (!text.trim()) return;
    void onAdd({
      text: text.trim(),
      taggedIds: tagged,
      eventName: resolvedWhere
    });
    // Outcome only: counts and bools, never the joke text or names.
    trackProduct('inside_joke_posted', {
      tagged_people: tagged.length,
      tagged_event: !!resolvedWhere
    });
    close();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Add an Inside Joke"
      surface="add_inside_joke_sheet"
      parentScreen="friends"
      dismissAnalyticsId={ADD_INSIDE_JOKE_SHEET.close}
    >
      {/* Tall panel so Who said it + Where always have room to tap */}
      <ScrollView
        style={{ maxHeight: SHEET_SCROLL_MAX }}
        contentContainerStyle={{ paddingBottom: 8, minHeight: 420 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-5">
          <TextField
            label="The quote"
            multiline
            value={text}
            onChange={setText}
            placeholder="Bread is just a warm friend."
            analyticsId={ADD_INSIDE_JOKE_SHEET.quote_input}
          />

          {/* THIS SECTION DOES: pick who said the line (friends you can tag) */}
          <View>
            <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
              Who said it
            </Text>
            {people.length === 0 ? (
              <AnalyticsRegion
                analyticsId={ADD_INSIDE_JOKE_SHEET.who_empty}
                interactive={false}
              >
                <Text className="font-sans-sb text-[13px] leading-snug text-ink-mute">
                  No friends to tag yet. Add people on Friends, then come back.
                </Text>
              </AnalyticsRegion>
            ) : (
              <View className="flex-row flex-wrap gap-1.5">
                {people.map((p) => {
                  const on = tagged.includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={withAnalyticsPress(ADD_INSIDE_JOKE_SHEET.who_chip, () =>
                        setTagged((t) =>
                          on ? t.filter((id) => id !== p.id) : [...t, p.id]
                        )
                      )}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`Tag ${p.name}`}
                      className={cn(
                        'min-h-[44px] flex-row items-center gap-1.5 rounded-full border py-1 pl-1 pr-3',
                        on
                          ? 'border-purple bg-purple'
                          : 'border-ink-line bg-surface active:bg-ink/5'
                      )}
                    >
                      <Avatar
                        name={p.name}
                        emoji={p.emoji}
                        accent={p.accent}
                        personId={p.id}
                        size="xs"
                      />
                      <Text
                        className={cn(
                          'font-sans-b text-[12px]',
                          on ? 'text-white' : 'text-ink'
                        )}
                      >
                        {p.name.split(' ')[0]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* THIS SECTION DOES: type a place, or tap a recent event chip */}
          <View>
            <TextField
              label="Where it happened"
              value={whereText}
              onChange={(v) => {
                setWhereText(v);
                // Typing clears a chip pick so the typed place wins.
                if (v.trim()) setEventChip(null);
              }}
              placeholder="Kitchen table, Sketch night…"
              analyticsId={ADD_INSIDE_JOKE_SHEET.where_input}
            />
            {eventNames.length > 0 ? (
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {eventNames.map((title) => {
                  const on = eventChip === title && !whereText.trim();
                  return (
                    <Pressable
                      key={title}
                      onPress={withAnalyticsPress(
                        ADD_INSIDE_JOKE_SHEET.where_event_chip,
                        () => {
                          setEventChip(on ? null : title);
                          setWhereText('');
                        }
                      )}
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
                      <Text
                        className={cn(
                          'font-sans-b text-[12px]',
                          on ? ACCENTS.teal.text : 'text-ink'
                        )}
                      >
                        {title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View className="gap-2 pt-1">
            <ButtonPrimary
              full
              size="lg"
              analyticsId={ADD_INSIDE_JOKE_SHEET.post}
              onPress={save}
              disabled={!text.trim()}
            >
              Post it
            </ButtonPrimary>
            <ButtonSecondary
              full
              tone="ghost"
              analyticsId={ADD_INSIDE_JOKE_SHEET.never_mind}
              onPress={close}
            >
              Never mind
            </ButtonSecondary>
          </View>
        </View>
      </ScrollView>
    </Sheet>
  );
}
