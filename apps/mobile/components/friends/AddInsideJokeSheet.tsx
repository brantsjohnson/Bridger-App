// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen "Add an Inside Joke." You type on a square sticky note, pick its
// color, search a friend who said it, and optionally tag an event. Co-op
// members can add one photo (the note then flips quote and photo). Close is
// the X. Post lands the note on Friends (newest) and on both walls.
//
// PRIVACY: we never log the joke text or search words. Product event only
// fires after the save works (counts and bools, no names).
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraIcon, ImagePlusIcon, XIcon } from 'lucide-react-native';
import {
  ADD_INSIDE_JOKE_SHEET,
  trackProduct,
  trackUi,
  type Accent,
  type Person
} from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  Avatar,
  ButtonPrimary,
  SearchField,
  SurfaceHost,
  SynthGrid,
  cn,
  useGridColor,
  useReduceMotion,
  useResponsiveLayout,
  useSurfaceAct,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import type { AddInsideJokeInput } from '../../data/insideJokes';
import { useQuotePhotoFlip } from './useQuotePhotoFlip';
import { listEvents } from '../../data/events';
import { listFriends } from '../../data/friends';
import { getMembership } from '../../data/coop';
import { personById, personExists } from '../../data/people';
import { pickAttachedPhoto } from '../../lib/pick-image';
import { stickyNoteFontSize, stickyNoteLineHeight } from './stickyNoteFont';

const NOTE_COLORS: Accent[] = ['amber', 'pink', 'teal', 'green', 'blue'];

/** The joke field that lives on the front of the square note. */
function ComposerQuoteInput({
  inputRef,
  text,
  setText,
  token,
  onFocus,
  onBlur
}: {
  inputRef: React.RefObject<TextInput | null>;
  text: string;
  setText: (next: string) => void;
  token: (typeof ACCENTS)[Accent];
  onFocus: () => void;
  onBlur: () => void;
}) {
  // THIS SECTION DOES: watch the note size so the type can grow or shrink to fill it.
  const [area, setArea] = useState({ w: 0, h: 0 });
  const fontSize = stickyNoteFontSize(text, area.w, area.h);
  const lineHeight = stickyNoteLineHeight(fontSize);

  return (
    <View
      className="flex-1"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        const w = Math.round(width);
        const h = Math.round(height);
        if (w !== area.w || h !== area.h) setArea({ w, h });
      }}
    >
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder="Tap the note and type the joke"
        placeholderTextColor={
          token.text === 'text-white'
            ? 'rgba(255,255,255,0.55)'
            : 'rgba(28,27,22,0.4)'
        }
        multiline
        textAlignVertical="top"
        accessibilityLabel="The joke"
        onFocus={onFocus}
        onBlur={onBlur}
        className={cn('font-sans-b', token.text)}
        style={{ flex: 1, padding: 0, fontSize, lineHeight }}
      />
    </View>
  );
}

export function AddInsideJokeSheet({
  open,
  onClose,
  onAdd,
  parentScreen = 'friends',
  defaultQuotedId
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: AddInsideJokeInput) => void | Promise<void>;
  parentScreen?: 'friends' | 'profile';
  /** When opened from a friend's wall, start with them as "who said it". */
  defaultQuotedId?: string;
}) {
  return (
    <SurfaceHost surface="add_inside_joke_sheet" parentScreen={parentScreen} open={open}>
      <Composer
        open={open}
        onClose={onClose}
        onAdd={onAdd}
        defaultQuotedId={defaultQuotedId}
      />
    </SurfaceHost>
  );
}

function Composer({
  open,
  onClose,
  onAdd,
  defaultQuotedId
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: AddInsideJokeInput) => void | Promise<void>;
  defaultQuotedId?: string;
}) {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { gridColor } = useGridColor();
  const { contentMaxWidth } = useResponsiveLayout();
  const router = useRouter();
  const { markActed } = useSurfaceAct();

  const [text, setText] = useState('');
  const [accent, setAccent] = useState<Accent>('amber');
  const [who, setWho] = useState<Person | null>(null);
  const [whoQuery, setWhoQuery] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const [eventQuery, setEventQuery] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCoop, setIsCoop] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteFocused, setNoteFocused] = useState(false);
  const [box, setBox] = useState(0);
  const noteInput = useRef<TextInput>(null);
  const reduce = useReduceMotion();
  const flipOn = Boolean(photoUri) && !reduce && !noteFocused;
  const { quoteRotate, photoRotate, quoteOpacity, photoOpacity } =
    useQuotePhotoFlip(flipOn);

  // THIS SECTION DOES: load friends, events, and co-op when the page opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const [friends, ev, membership] = await Promise.all([
        listFriends().catch(() => [] as Person[]),
        listEvents().catch(() => []),
        getMembership().catch(() => ({ member: false }))
      ]);
      if (cancelled) return;
      setPeople(friends);
      setEvents(
        ev
          .map((e) => ({ id: e.id, title: (e.title ?? '').trim() }))
          .filter((e) => e.title)
      );
      setIsCoop(!!membership.member);
      if (defaultQuotedId) {
        const pre =
          friends.find((p) => p.id === defaultQuotedId) ??
          (personExists(defaultQuotedId) ? personById(defaultQuotedId) : null);
        setWho(pre);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, defaultQuotedId]);

  const reset = () => {
    setText('');
    setAccent('amber');
    setWho(null);
    setWhoQuery('');
    setEventId(null);
    setEventName(null);
    setEventQuery('');
    setPhotoUri(null);
    setSaving(false);
    setError(null);
    setNoteFocused(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const friendHits = useMemo(() => {
    const q = whoQuery.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [people, whoQuery]);

  const eventHits = useMemo(() => {
    const q = eventQuery.trim().toLowerCase();
    if (!q) return [];
    return events.filter((e) => e.title.toLowerCase().includes(q)).slice(0, 8);
  }, [events, eventQuery]);

  const token = ACCENTS[accent];

  const pickPhoto = (source: 'camera' | 'library') => {
    void (async () => {
      const picked = await pickAttachedPhoto(source);
      if (picked?.uri) setPhotoUri(picked.uri);
    })();
  };

  const openPhotoSheet = () => {
    if (!isCoop) {
      router.push('/coop');
      return;
    }
    const take = () => pickPhoto('camera');
    const upload = () => pickPhoto('library');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take a photo', 'Upload'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) take();
          if (index === 2) upload();
        }
      );
      return;
    }
    if (Platform.OS === 'web') {
      upload();
      return;
    }
    Alert.alert('Add a photo', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take a photo', onPress: take },
      { text: 'Upload', onPress: upload }
    ]);
  };

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        text: text.trim(),
        quotedId: who?.id,
        taggedIds: who ? [who.id] : [],
        eventName: eventName ?? undefined,
        eventId: eventId ?? undefined,
        accent,
        photoUri: photoUri ?? undefined
      });
      markActed();
      trackProduct('inside_joke_posted', {
        tagged_people: who ? 1 : 0,
        tagged_event: !!eventName,
        has_photo: !!photoUri
      });
      close();
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Could not post. Try again.');
    }
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={close}
    >
      <View className="flex-1 bg-canvas" style={{ backgroundColor: theme.canvas }}>
        <SynthGrid strength="normal" color={gridColor} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          // KEYBOARD (platform split): iOS lifts the content with padding.
          // Android is edge-to-edge on SDK 57, so the window no longer resizes
          // itself for the keyboard, which left the note field and "Post it"
          // hidden behind the keys. "height" shrinks the sheet to the room
          // above the keyboard so both stay reachable on the first tap. Matches
          // the other full-screen sheets (Activity capture, Comments).
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            className="flex-1"
            style={{
              width: '100%',
              maxWidth: contentMaxWidth,
              alignSelf: 'center',
              paddingTop: insets.top + 8
            }}
          >
            {/* THIS SECTION DOES: big title + a large close so this is a page, not a tiny sheet. */}
            <View className="flex-row items-center justify-between px-5 pb-3">
              <AnalyticsRegion
                analyticsId={ADD_INSIDE_JOKE_SHEET.never_mind}
                interactive={false}
              >
                <Text className="font-pixel text-[26px] text-ink">Add an Inside Joke</Text>
              </AnalyticsRegion>
              <Pressable
                onPress={withAnalyticsPress(ADD_INSIDE_JOKE_SHEET.close, close)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-11 w-11 items-center justify-center rounded-full bg-ink/5 active:opacity-80"
              >
                <XIcon size={22} color={theme.ink} strokeWidth={2.6} />
              </Pressable>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: Math.max(insets.bottom, 16) + 24,
                gap: 22
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* THIS SECTION DOES: the square sticky note you type on. A photo makes it flip. */}
              <Pressable
                onPress={withAnalyticsPress(ADD_INSIDE_JOKE_SHEET.sticky_note, () =>
                  noteInput.current?.focus()
                )}
                onLayout={(e) => {
                  const w = Math.round(e.nativeEvent.layout.width);
                  if (w > 0 && w !== box) setBox(w);
                }}
                accessibilityRole="none"
                accessibilityLabel="Sticky note. Tap to type the joke."
                className={cn('overflow-hidden', token.bg)}
                style={{ aspectRatio: 1, width: '100%', borderRadius: 4 }}
              >
                {photoUri && !reduce && box > 0 ? (
                  <View style={{ width: box, height: box, overflow: 'hidden' }}>
                    <View
                      style={{ position: 'absolute', left: 0, top: 0, width: box, height: box }}
                    >
                      <Animated.View
                        style={{
                          opacity: quoteOpacity,
                          backfaceVisibility: 'hidden',
                          transform: [{ perspective: 900 }, { rotateY: quoteRotate }]
                        }}
                      >
                        <View style={{ width: box, height: box, padding: 20 }}>
                          <ComposerQuoteInput
                            inputRef={noteInput}
                            text={text}
                            setText={setText}
                            token={token}
                            onFocus={() => {
                              setNoteFocused(true);
                              trackUi('focus', ADD_INSIDE_JOKE_SHEET.quote_input);
                            }}
                            onBlur={() => setNoteFocused(false)}
                          />
                        </View>
                      </Animated.View>
                    </View>
                    <View
                      pointerEvents="none"
                      style={{ position: 'absolute', left: 0, top: 0, width: box, height: box }}
                    >
                      <Animated.View
                        style={{
                          opacity: photoOpacity,
                          backfaceVisibility: 'hidden',
                          transform: [{ perspective: 900 }, { rotateY: photoRotate }]
                        }}
                      >
                        <Image
                          source={{ uri: photoUri }}
                          accessibilityLabel="Photo on this joke"
                          style={{ width: box, height: box }}
                          resizeMode="cover"
                        />
                      </Animated.View>
                    </View>
                  </View>
                ) : (
                  <View className="h-full w-full p-5">
                    {photoUri ? (
                      <Image
                        source={{ uri: photoUri }}
                        accessibilityLabel="Photo on this joke"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          opacity: 0.28
                        }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <ComposerQuoteInput
                      inputRef={noteInput}
                      text={text}
                      setText={setText}
                      token={token}
                      onFocus={() => {
                        setNoteFocused(true);
                        trackUi('focus', ADD_INSIDE_JOKE_SHEET.quote_input);
                      }}
                      onBlur={() => setNoteFocused(false)}
                    />
                  </View>
                )}
              </Pressable>

              {/* THIS SECTION DOES: pick the paper color. */}
              <View>
                <AnalyticsRegion
                  analyticsId={ADD_INSIDE_JOKE_SHEET.color_header}
                  interactive={false}
                >
                  <Text className="mb-3 font-sans-b text-[17px] text-ink">Note color</Text>
                </AnalyticsRegion>
                <View className="flex-row flex-wrap gap-3">
                  {NOTE_COLORS.map((key) => {
                    const on = accent === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={withAnalyticsPress(
                          ADD_INSIDE_JOKE_SHEET.color_swatch,
                          () => setAccent(key),
                          { analyticsProps: { option: key } }
                        )}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${ACCENTS[key].label} note`}
                        className="h-12 w-12 items-center justify-center"
                        style={{
                          backgroundColor: ACCENT_HEX_FALLBACK[key],
                          borderRadius: 999,
                          borderWidth: on ? 3 : 0,
                          borderColor: theme.ink
                        }}
                      />
                    );
                  })}
                </View>
              </View>

              {/* THIS SECTION DOES: a photo, only if they are in the co-op. */}
              <View>
                {photoUri ? (
                  <Pressable
                    onPress={withAnalyticsPress(ADD_INSIDE_JOKE_SHEET.photo_remove, () =>
                      setPhotoUri(null)
                    )}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-[20px] bg-ink/5 px-4"
                  >
                    <Text className="font-sans-b text-[16px] text-ink">Remove photo</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={withAnalyticsPress(
                      isCoop
                        ? ADD_INSIDE_JOKE_SHEET.photo_add
                        : ADD_INSIDE_JOKE_SHEET.photo_locked,
                      openPhotoSheet
                    )}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isCoop ? 'Add a photo' : 'Add a photo. Co-op perk. Opens join.'
                    }
                    className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-[20px] bg-ink/5 px-4"
                  >
                    {isCoop ? (
                      <CameraIcon size={20} color={theme.ink} strokeWidth={2.4} />
                    ) : (
                      <ImagePlusIcon size={20} color={theme.inkSoft} strokeWidth={2.4} />
                    )}
                    <Text className="font-sans-b text-[16px] text-ink">
                      {isCoop ? 'Add a photo' : 'Add a photo · Co-op'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* THIS SECTION DOES: search one friend who said the line. */}
              <View className="gap-3">
                <AnalyticsRegion
                  analyticsId={ADD_INSIDE_JOKE_SHEET.who_header}
                  interactive={false}
                >
                  <Text className="font-sans-b text-[17px] text-ink">Who said it</Text>
                </AnalyticsRegion>
                {who ? (
                  <Pressable
                    onPress={withAnalyticsPress(ADD_INSIDE_JOKE_SHEET.who_chip, () =>
                      setWho(null)
                    )}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${who.name}`}
                    className="min-h-[52px] flex-row items-center gap-3 rounded-[20px] bg-purple px-3"
                  >
                    <Avatar
                      name={who.name}
                      emoji={who.emoji}
                      accent={who.accent}
                      personId={who.id}
                      size="sm"
                    />
                    <Text className="flex-1 font-sans-b text-[17px] text-white">
                      {who.name}
                    </Text>
                    <XIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
                  </Pressable>
                ) : (
                  <>
                    <SearchField
                      value={whoQuery}
                      onChange={setWhoQuery}
                      placeholder="Search friends"
                      size="lg"
                      analyticsId={ADD_INSIDE_JOKE_SHEET.who_search}
                    />
                    {people.length === 0 ? (
                      <AnalyticsRegion
                        analyticsId={ADD_INSIDE_JOKE_SHEET.who_empty}
                        interactive={false}
                      >
                        <Text className="font-sans-sb text-[15px] leading-snug text-ink-mute">
                          No friends to tag yet. Add people on Friends, then come back.
                        </Text>
                      </AnalyticsRegion>
                    ) : whoQuery.trim() ? (
                      friendHits.length === 0 ? (
                        <Text className="font-sans-sb text-[15px] text-ink-mute">
                          No match. Try another name.
                        </Text>
                      ) : (
                        <View className="gap-2">
                          {friendHits.map((p) => (
                            <Pressable
                              key={p.id}
                              onPress={withAnalyticsPress(ADD_INSIDE_JOKE_SHEET.who_chip, () => {
                                setWho(p);
                                setWhoQuery('');
                              })}
                              accessibilityRole="button"
                              accessibilityLabel={`Tag ${p.name}`}
                              className="min-h-[52px] flex-row items-center gap-3 rounded-[20px] bg-surface px-3"
                            >
                              <Avatar
                                name={p.name}
                                emoji={p.emoji}
                                accent={p.accent}
                                personId={p.id}
                                size="sm"
                              />
                              <Text className="font-sans-b text-[17px] text-ink">{p.name}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )
                    ) : (
                      <Text className="font-sans-sb text-[15px] text-ink-mute">
                        Type a name to tag who said it.
                      </Text>
                    )}
                  </>
                )}
              </View>

              {/* THIS SECTION DOES: search an event instead of listing every one. */}
              <View className="gap-3">
                <AnalyticsRegion
                  analyticsId={ADD_INSIDE_JOKE_SHEET.event_header}
                  interactive={false}
                >
                  <Text className="font-sans-b text-[17px] text-ink">Tag an event</Text>
                </AnalyticsRegion>
                {eventName ? (
                  <Pressable
                    onPress={withAnalyticsPress(ADD_INSIDE_JOKE_SHEET.where_event_chip, () => {
                      setEventId(null);
                      setEventName(null);
                    })}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${eventName}`}
                    className="min-h-[52px] flex-row items-center justify-between rounded-[20px] bg-teal px-4"
                  >
                    <Text className="flex-1 font-sans-b text-[17px] text-onaccent">
                      {eventName}
                    </Text>
                    <XIcon size={18} color={theme.ink} strokeWidth={2.6} />
                  </Pressable>
                ) : (
                  <>
                    <SearchField
                      value={eventQuery}
                      onChange={setEventQuery}
                      placeholder="Search events"
                      size="lg"
                      analyticsId={ADD_INSIDE_JOKE_SHEET.event_search}
                    />
                    {eventQuery.trim() ? (
                      eventHits.length === 0 ? (
                        <Text className="font-sans-sb text-[15px] text-ink-mute">
                          No event matches that.
                        </Text>
                      ) : (
                        <View className="gap-2">
                          {eventHits.map((e) => (
                            <Pressable
                              key={e.id}
                              onPress={withAnalyticsPress(
                                ADD_INSIDE_JOKE_SHEET.where_event_chip,
                                () => {
                                  setEventId(e.id);
                                  setEventName(e.title);
                                  setEventQuery('');
                                }
                              )}
                              accessibilityRole="button"
                              accessibilityLabel={`Tag event ${e.title}`}
                              className="min-h-[52px] justify-center rounded-[20px] bg-surface px-4"
                            >
                              <Text className="font-sans-b text-[17px] text-ink">{e.title}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )
                    ) : (
                      <Text className="font-sans-sb text-[15px] text-ink-mute">
                        Type to find an event. Optional.
                      </Text>
                    )}
                  </>
                )}
              </View>

              {error ? (
                <Text className="text-center font-sans-b text-[15px] text-coral">{error}</Text>
              ) : null}

              <ButtonPrimary
                full
                size="lg"
                analyticsId={ADD_INSIDE_JOKE_SHEET.post}
                onPress={() => void save()}
                disabled={!text.trim() || saving}
                loading={saving}
              >
                Post it
              </ButtonPrimary>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Solid swatch colors so the picker is not class-name only. */
const ACCENT_HEX_FALLBACK: Record<Accent, string> = {
  purple: '#6B2FEA',
  coral: '#FF5A1F',
  teal: '#00A676',
  amber: '#FFB515',
  pink: '#FF3E8A',
  blue: '#1D6FE8',
  green: '#5FBF3A'
};
