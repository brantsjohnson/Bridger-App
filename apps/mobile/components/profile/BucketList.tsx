// ============================================
// WHAT THIS FILE DOES (plain English):
// The Bucket List tab — a profile-only module. Each line is either a solo
// want or something to do with specific friends, is public or private, and
// can be checked off. The circular "+" lives next to the title at the top.
// Checking something off keeps it in place until you leave and come back;
// then it sits under Completed at the bottom. Viewers never see private lines.
// Analytics: add / item / check_off use PROFILE.bucket_list.*; checking off
// also emits the bucket_item_checked product event (no item text in properties).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon, LockIcon, PlusIcon } from 'lucide-react-native';
import type { BucketItem } from '@bridger/shared';
import { PROFILE, trackProduct } from '@bridger/shared';
import {
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

export function BucketList({
  items,
  loading = false,
  editable = false,
  empty = false,
  onAdd,
  onToggle
}: {
  items: BucketItem[];
  /** true while the first load is in flight — used so Completed seeds after data arrives */
  loading?: boolean;
  editable?: boolean;
  empty?: boolean;
  onAdd: (input: AddBucketInput) => void | Promise<void>;
  onToggle: (id: string) => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
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

  return (
    <View className="gap-2.5">
      {/* Title + circular add — add lives up here, not as a dashed row at the bottom */}
      <View className="mb-1 flex-row items-center justify-between gap-3">
        <PixelHeading size="md" className="min-w-0 flex-1">
          Bucket List
        </PixelHeading>
        {editable ? (
          <Pressable
            onPress={withAnalyticsPress(PROFILE.bucket_list.add, () => setAdding(true))}
            accessibilityRole="button"
            accessibilityLabel="Add to your bucket list"
            className="h-11 w-11 items-center justify-center rounded-full bg-purple active:opacity-90"
          >
            <PlusIcon size={20} color="#1C1B16" strokeWidth={2.8} />
          </Pressable>
        ) : null}
      </View>

      {open.length === 0 && completed.length === 0 && editable ? (
        <Text className="font-sans-sb text-[13px] text-ink-mute">
          Nothing yet. Tap + to add something you want to do.
        </Text>
      ) : null}

      {open.map((item) => (
        <Row key={item.id} item={item} editable={editable} onToggle={() => handleToggle(item.id)} />
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
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </View>
      ) : null}

      <AddBucketItemSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(input) => void onAdd(input)}
      />
    </View>
  );
}

/** One bucket line: check circle, text, tagged friends, private lock. */
function Row({
  item,
  editable,
  onToggle
}: {
  item: BucketItem;
  editable: boolean;
  onToggle: () => void;
}) {
  const c = useThemeColors();
  const withPeople = item.withIds.map(personById);

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3',
        item.done && 'opacity-60'
      )}
    >
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

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className={cn('font-sans-b text-[14px] text-ink', item.done && 'line-through')}
        >
          {item.text}
        </Text>
        {withPeople.length > 0 ? (
          <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
            with {withPeople.map((p) => p.name.split(' ')[0]).join(' & ')}
          </Text>
        ) : null}
      </View>

      {withPeople.length > 0 ? (
        <View accessible={false} className="flex-row">
          {withPeople.slice(0, 3).map((p, i) => (
            <View key={p.id} style={{ marginLeft: i > 0 ? -8 : 0 }}>
              <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="xs" />
            </View>
          ))}
        </View>
      ) : null}

      {item.isPrivate ? (
        <LockIcon aria-label="Private" size={14} color={c.inkMute} strokeWidth={2.6} />
      ) : null}
    </View>
  );
}

/** The small inline add form: text, optional friends, public/private. */
function AddBucketItemSheet({
  open,
  onClose,
  onAdd
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: AddBucketInput) => void;
}) {
  const [text, setText] = useState('');
  const [withIds, setWithIds] = useState<string[]>([]);
  const [isPrivate, setPrivate] = useState(false);
  const people = listPeople().slice(0, 6);

  const close = () => {
    setText('');
    setWithIds([]);
    setPrivate(false);
    onClose();
  };

  const save = () => {
    if (!text.trim()) return;
    onAdd({ text: text.trim(), withIds, isPrivate });
    close();
  };

  return (
    <Sheet open={open} onClose={close} title="Add to your bucket list">
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
          <ButtonPrimary full size="lg" onPress={save}>
            Add it
          </ButtonPrimary>
          <ButtonSecondary full tone="ghost" onPress={close}>
            Never mind
          </ButtonSecondary>
        </View>
      </View>
    </Sheet>
  );
}
