// ============================================
// WHAT THIS FILE DOES (plain English):
// The Bucket List tab — a profile-only module. Each line is either a solo
// want or something to do with specific friends, is public or private, and
// can be checked off. The circular "+" and Edit live next to the title.
// Swipe left (or Edit mode) deletes a line; Edit mode also opens a sheet to
// change text / friends / privacy. Checking something off keeps it in place
// until you leave and come back; then it sits under Completed. Viewers never
// see private lines.
// Analytics: PROFILE.bucket_list.*; outcomes emit bucket_item_* product events
// (no item text in properties). Sheets are their own surfaces.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState
} from 'react-native';
import { CheckIcon, LockIcon, PlusIcon, TrashIcon } from 'lucide-react-native';
import type { BucketItem } from '@bridger/shared';
import { PROFILE, trackClick, trackProduct } from '@bridger/shared';
import {
  ACCENTS,
  Avatar,
  ButtonPrimary,
  ButtonSecondary,
  PixelHeading,
  Sheet,
  TextField,
  Toggle,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import type { AddBucketInput } from '../../data/profile';
import { listPeople, personById } from '../../data/people';

/** How wide the red Delete strip is when you swipe a row left. */
const DELETE_WIDTH = 80;

export function BucketList({
  items,
  loading = false,
  editable = false,
  empty = false,
  onAdd,
  onToggle,
  onUpdate,
  onDelete
}: {
  items: BucketItem[];
  /** true while the first load is in flight — used so Completed seeds after data arrives */
  loading?: boolean;
  editable?: boolean;
  empty?: boolean;
  onAdd: (input: AddBucketInput) => void | Promise<void>;
  onToggle: (id: string) => void | Promise<void>;
  onUpdate?: (id: string, input: AddBucketInput) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editItem, setEditItem] = useState<BucketItem | null>(null);
  const list = empty ? [] : items;

  // PRIVACY: a viewer never sees the private lines
  const shown = editable ? list : list.filter((i) => !i.isPrivate);

  // IDs that were already done when this visit started — those belong in Completed.
  // Just-checked items stay in the open list until you leave and come back.
  const seeded = useRef(false);
  const [baselineDoneIds, setBaselineDoneIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (loading || seeded.current) return;
    // Snapshot what's already done for this visit; fresh checks stay put until remount
    const visible = empty ? [] : editable ? items : items.filter((i) => !i.isPrivate);
    setBaselineDoneIds(new Set(visible.filter((i) => i.done).map((i) => i.id)));
    seeded.current = true;
  }, [loading, empty, editable, items]);

  const open = shown.filter((i) => !i.done || !baselineDoneIds.has(i.id));
  const completed = shown.filter((i) => i.done && baselineDoneIds.has(i.id));

  if (shown.length === 0 && !editable) {
    return <Text className="font-sans-sb text-[13px] text-ink-mute">Nothing on the list yet.</Text>;
  }

  function handleToggle(id: string) {
    const item = shown.find((i) => i.id === id);
    // If they uncheck something that was in Completed, drop it from the baseline
    // so checking it again keeps it in place until the next visit.
    if (item?.done) {
      setBaselineDoneIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      // Product outcome: they checked something off (no item text — PRIVACY).
      trackProduct('bucket_item_checked');
    }
    void onToggle(id);
  }

  /** Remove a line for good. method says swipe vs edit-mode trash vs edit sheet. */
  function handleDelete(id: string, method: 'swipe' | 'edit_mode' | 'sheet') {
    if (!onDelete) return;
    trackProduct('bucket_item_deleted', { method });
    void onDelete(id);
    if (editItem?.id === id) setEditItem(null);
  }

  function confirmDelete(id: string, method: 'swipe' | 'edit_mode' | 'sheet') {
    Alert.alert('Delete this item?', 'It will be gone for good.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDelete(id, method)
      }
    ]);
  }

  return (
    <View className="gap-2.5">
      {/* Title + Edit + circular add — add lives up here, not as a dashed row at the bottom */}
      <View className="mb-1 flex-row items-center justify-between gap-3">
        <PixelHeading size="md" className="min-w-0 flex-1">
          Bucket List
        </PixelHeading>
        {editable ? (
          <View className="flex-row items-center gap-2">
            {/* Edit lets you tap a row to change it, or tap trash / swipe to delete */}
            <ButtonSecondary
              size="sm"
              className="h-10"
              tone={editing ? 'solid' : 'light'}
              onPress={() => setEditing((v) => !v)}
              accessibilityLabel={editing ? 'Done editing bucket list' : 'Edit bucket list'}
              analyticsId={PROFILE.bucket_list.edit}
            >
              {editing ? 'Done' : 'Edit'}
            </ButtonSecondary>
            <Pressable
              onPress={withAnalyticsPress(PROFILE.bucket_list.add, () => setAdding(true))}
              accessibilityRole="button"
              accessibilityLabel="Add to your bucket list"
              className="h-11 w-11 items-center justify-center rounded-full bg-purple active:opacity-90"
            >
              <PlusIcon size={20} color="#1C1B16" strokeWidth={2.8} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {open.length === 0 && completed.length === 0 && editable ? (
        // Empty default: half-column square, same pattern as Favorites / Inside jokes.
        <Pressable
          onPress={withAnalyticsPress(PROFILE.bucket_list.add, () => setAdding(true))}
          accessibilityRole="button"
          accessibilityLabel="Add to your bucket list"
          className="items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-ink/25 bg-surface p-4 active:opacity-90"
          style={{ width: '47%', aspectRatio: 1 }}
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-purple">
            <PlusIcon size={18} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text className="text-center font-sans-b text-[13px] text-ink-soft">
            Add to bucket list
          </Text>
        </Pressable>
      ) : null}

      {editing && open.length + completed.length > 0 ? (
        <Text className="font-sans-sb text-[12px] text-ink-mute">
          Tap a row to edit it. Swipe left or tap the trash to delete.
        </Text>
      ) : null}

      {open.map((item) => (
        <Row
          key={item.id}
          item={item}
          editable={editable}
          editing={editing}
          onToggle={() => handleToggle(item.id)}
          onEdit={() => setEditItem(item)}
          onDeleteSwipe={() => confirmDelete(item.id, 'swipe')}
          onDeleteEdit={() => confirmDelete(item.id, 'edit_mode')}
        />
      ))}

      {completed.length > 0 ? (
        <View className="mt-4 gap-2.5">
          <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
            Completed
          </Text>
          {completed.map((item) => (
            <Row
              key={item.id}
              item={item}
              editable={editable}
              editing={editing}
              onToggle={() => handleToggle(item.id)}
              onEdit={() => setEditItem(item)}
              onDeleteSwipe={() => confirmDelete(item.id, 'swipe')}
              onDeleteEdit={() => confirmDelete(item.id, 'edit_mode')}
            />
          ))}
        </View>
      ) : null}

      <BucketItemSheet
        open={adding}
        mode="add"
        onClose={() => setAdding(false)}
        onSave={(input) => {
          // Product outcome: a new bucket line landed (no item text — PRIVACY).
          trackProduct('module_item_added', {
            module: 'bucket_list',
            friend_tagged: input.withIds.length > 0,
            visibility: input.isPrivate ? 'private' : 'public'
          });
          void onAdd(input);
        }}
      />

      <BucketItemSheet
        open={!!editItem}
        mode="edit"
        initial={
          editItem
            ? {
                text: editItem.text,
                withIds: editItem.withIds,
                isPrivate: editItem.isPrivate
              }
            : undefined
        }
        onClose={() => setEditItem(null)}
        onSave={(input) => {
          if (!editItem || !onUpdate) return;
          trackProduct('bucket_item_updated', {
            friend_tagged: input.withIds.length > 0,
            visibility: input.isPrivate ? 'private' : 'public'
          });
          void onUpdate(editItem.id, input);
          setEditItem(null);
        }}
        onDelete={
          editItem
            ? () => {
                const id = editItem.id;
                setEditItem(null);
                confirmDelete(id, 'sheet');
              }
            : undefined
        }
      />
    </View>
  );
}

/** One bucket line: swipe-to-delete (own list), check circle, text, friends, lock. */
function Row({
  item,
  editable,
  editing,
  onToggle,
  onEdit,
  onDeleteSwipe,
  onDeleteEdit
}: {
  item: BucketItem;
  editable: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDeleteSwipe: () => void;
  onDeleteEdit: () => void;
}) {
  const c = useThemeColors();
  const withPeople = item.withIds.map(personById);

  // Done look is strikethrough + muted text only — never opacity on the whole
  // row, or the coral Delete strip underneath would show through.
  const body = (
    <View className="flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3">
      <Pressable
        onPress={
          editable
            ? withAnalyticsPress(PROFILE.bucket_list.check_off, onToggle)
            : withAnalyticsPress(PROFILE.bucket_list.item, undefined, { interactive: false })
        }
        disabled={!editable}
        // ACCESSIBILITY: only YOUR list is a checkbox. On someone else's profile
        // the circle is just a status dot, so it must not announce as tickable.
        accessibilityRole={editable ? 'checkbox' : 'image'}
        accessibilityState={editable ? { checked: item.done } : undefined}
        accessibilityLabel={
          editable
            ? item.done
              ? `Undo ${item.text}`
              : `Mark ${item.text} done`
            : item.done
              ? `Done: ${item.text}`
              : `Not done yet: ${item.text}`
        }
        hitSlop={8}
        className={cn(
          'h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
          item.done ? 'border-green bg-green' : 'border-ink-line bg-surface'
        )}
      >
        {item.done ? <CheckIcon size={14} color="#1C1B16" strokeWidth={3.4} /> : null}
      </Pressable>

      {/* In Edit mode, tapping the text opens the edit sheet; otherwise it's just display */}
      <Pressable
        disabled={!editable || !editing}
        onPress={
          editing
            ? withAnalyticsPress(PROFILE.bucket_list.edit_item, onEdit)
            : withAnalyticsPress(PROFILE.bucket_list.item, undefined, { interactive: false })
        }
        accessibilityRole={editing ? 'button' : 'text'}
        accessibilityLabel={editing ? `Edit ${item.text}` : item.text}
        className="min-w-0 flex-1"
      >
        <Text
          numberOfLines={1}
          className={cn(
            'font-sans-b text-[14px]',
            item.done ? 'text-ink-mute line-through' : 'text-ink'
          )}
        >
          {item.text}
        </Text>
        {withPeople.length > 0 ? (
          <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
            with {withPeople.map((p) => p.name.split(' ')[0]).join(' & ')}
          </Text>
        ) : null}
      </Pressable>

      {withPeople.length > 0 && !editing ? (
        <View accessible={false} className="flex-row">
          {withPeople.slice(0, 3).map((p, i) => (
            <View key={p.id} style={{ marginLeft: i > 0 ? -8 : 0 }}>
              <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="xs" />
            </View>
          ))}
        </View>
      ) : null}

      {item.isPrivate && !editing ? (
        <LockIcon aria-label="Private" size={14} color={c.inkMute} strokeWidth={2.6} />
      ) : null}

      {/* Edit mode: trash is always visible so delete is not swipe-only */}
      {editable && editing ? (
        <Pressable
          onPress={withAnalyticsPress(PROFILE.bucket_list.delete, onDeleteEdit, {
            analyticsProps: { method: 'edit_mode' }
          })}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.text}`}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-coral/15 active:opacity-80"
        >
          <TrashIcon size={18} color={ACCENTS.coral.hex} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );

  if (!editable) return body;

  return (
    <SwipeToDelete
      onDelete={() => {
        // UI click + confirm; product event fires only if they confirm Delete
        trackClick(PROFILE.bucket_list.delete, { method: 'swipe' });
        onDeleteSwipe();
      }}
    >
      {body}
    </SwipeToDelete>
  );
}

/**
 * Swipe the row left to reveal Delete. Delete sits in a fixed-width slot to
 * the RIGHT of the card. At rest the outer clip hides it; a left swipe slides
 * the pair so Delete comes into view. (Must not wrap under the card — that is
 * what made the orange "Delete" tabs hang below each row on web.)
 */
function SwipeToDelete({
  children,
  onDelete
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);
  const startX = useRef(0);
  // Measure the visible row width so Delete can sit exactly past the right edge
  const [rowWidth, setRowWidth] = useState(0);

  const snapTo = (toValue: number, opened: boolean) => {
    openRef.current = opened;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      // Only claim the gesture once it's clearly a horizontal swipe
      onMoveShouldSetPanResponder: (_e: GestureResponderEvent, g: PanResponderGestureState) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderGrant: () => {
        startX.current = openRef.current ? -DELETE_WIDTH : 0;
      },
      onPanResponderMove: (_e, g) => {
        const next = Math.min(0, Math.max(-DELETE_WIDTH, startX.current + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        const current = startX.current + g.dx;
        // Fast left flick or past halfway → open Delete; further → delete now
        if (g.vx < -1.2 || current < -DELETE_WIDTH * 1.4) {
          snapTo(-DELETE_WIDTH, true);
          onDelete();
          // Reset after the alert path so the row isn't stuck open if they cancel
          snapTo(0, false);
          return;
        }
        if (current < -DELETE_WIDTH / 2 || g.vx < -0.4) {
          snapTo(-DELETE_WIDTH, true);
        } else {
          snapTo(0, false);
        }
      },
      onPanResponderTerminate: () => snapTo(openRef.current ? -DELETE_WIDTH : 0, openRef.current)
    })
  ).current;

  // Wait for a real width before mounting Delete — avoids a first paint where
  // flex wraps the coral strip under the card (the bug in the screenshot).
  const ready = rowWidth > 0;

  return (
    <View
      // Explicit overflow style: NativeWind alone does not always clip on web
      style={{ overflow: 'hidden', borderRadius: 20 }}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && w !== rowWidth) setRowWidth(w);
      }}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          // Track is wider than the viewport by exactly the Delete strip
          width: ready ? rowWidth + DELETE_WIDTH : undefined,
          transform: [{ translateX }]
        }}
        {...pan.panHandlers}
      >
        <View style={{ width: ready ? rowWidth : '100%' }}>{children}</View>
        {ready ? (
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete"
            style={{
              width: DELETE_WIDTH,
              backgroundColor: ACCENTS.coral.hex,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text className="font-sans-b text-[13px] text-onaccent">Delete</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

/** Shared add / edit form: text, optional friends, public/private. */
function BucketItemSheet({
  open,
  mode,
  initial,
  onClose,
  onSave,
  onDelete
}: {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: AddBucketInput;
  onClose: () => void;
  onSave: (input: AddBucketInput) => void;
  onDelete?: () => void;
}) {
  const [text, setText] = useState('');
  const [withIds, setWithIds] = useState<string[]>([]);
  const [isPrivate, setPrivate] = useState(false);
  const people = listPeople().slice(0, 6);
  const surface = mode === 'add' ? 'add_bucket_sheet' : 'edit_bucket_sheet';
  // Stable key so we re-seed when a different item opens, not on every parent render
  const seedKey = open
    ? `${mode}:${initial?.text ?? ''}:${initial?.isPrivate ? 1 : 0}:${(initial?.withIds ?? []).join(',')}`
    : '';

  // When the sheet opens, seed fields from the item (edit) or clear (add)
  useEffect(() => {
    if (!open) return;
    setText(initial?.text ?? '');
    setWithIds(initial?.withIds ? [...initial.withIds] : []);
    setPrivate(initial?.isPrivate ?? false);
    // seedKey captures the fields we care about; initial is read only when open flips
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional seed-on-open
  }, [open, seedKey]);

  const close = () => {
    setText('');
    setWithIds([]);
    setPrivate(false);
    onClose();
  };

  const save = () => {
    if (!text.trim()) return;
    onSave({ text: text.trim(), withIds, isPrivate });
    close();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={mode === 'add' ? 'Add to your bucket list' : 'Edit bucket list item'}
      surface={surface}
      parentScreen="profile"
      dismissAnalyticsId={
        mode === 'add' ? PROFILE.bucket_list.add_dismiss : PROFILE.bucket_list.edit_dismiss
      }
    >
      <View className="gap-4">
        <TextField
          label="What do you want to do?"
          value={text}
          onChange={setText}
          placeholder="Learn to surf"
        />

        <View>
          <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
            With anyone? (optional)
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {people.map((p) => {
              const on = withIds.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    setWithIds((w) => (on ? w.filter((id) => id !== p.id) : [...w, p.id]))
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={p.name}
                  className={cn(
                    'min-h-[36px] flex-row items-center gap-1.5 rounded-full border py-1 pl-1 pr-3',
                    on ? 'border-purple bg-purple' : 'border-ink-line bg-surface'
                  )}
                >
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="xs" />
                  <Text className={cn('font-sans-b text-[12px]', on ? 'text-onaccent' : 'text-ink')}>
                    {p.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row items-center justify-between rounded-card border border-ink-line bg-surface px-3.5 py-3">
          <View className="min-w-0 flex-1">
            <Text className="font-sans-b text-[14px] text-ink">Keep it private</Text>
            <Text className="font-sans-sb text-[12px] text-ink-mute">Only you can see it</Text>
          </View>
          <Toggle checked={isPrivate} onChange={setPrivate} label="Keep it private" />
        </View>

        <View className="gap-2">
          <ButtonPrimary full size="lg" onPress={save} analyticsId={PROFILE.bucket_list.save}>
            {mode === 'add' ? 'Add it' : 'Save'}
          </ButtonPrimary>
          {mode === 'edit' && onDelete ? (
            <ButtonSecondary
              full
              tone="destructive"
              onPress={onDelete}
              analyticsId={PROFILE.bucket_list.delete}
              analyticsProps={{ method: 'sheet' }}
              accessibilityLabel="Delete this item"
            >
              Delete
            </ButtonSecondary>
          ) : null}
          <ButtonSecondary full tone="outline" onPress={close}>
            Never mind
          </ButtonSecondary>
        </View>
      </View>
    </Sheet>
  );
}
