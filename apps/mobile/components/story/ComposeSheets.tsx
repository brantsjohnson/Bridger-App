// ============================================
// WHAT THIS FILE DOES (plain English):
// The four small sheets that slide up over the Scrapbook compose screen. Each
// one is its own analytics surface (opened / dismissed / how long) so we can
// tell "opened the caption sheet and gave up" from "never opened it".
//
//   CaptionSheet   - type the words that go on the page (Record arrives Phase 2)
//   AudienceSheet  - who sees this page: Only me / Close / Friends / Everyone (+ groups)
//   AddMediaSheet  - "+": Camera or Camera roll
//   CustomizeTray  - pencil: paper color swatches + Undo (grows in Phase 3)
//
// The page stays visible behind every sheet; nothing here navigates away.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CameraIcon, ImagesIcon, Undo2Icon } from 'lucide-react-native';
import {
  ADD_MEDIA_SHEET,
  AUDIENCE_SHEET,
  CAPTION_SHEET,
  CUSTOMIZE_TRAY,
  POST_COMPOSER
} from '@bridger/shared';
import {
  AudiencePicker,
  ButtonPrimary,
  Sheet,
  cn,
  useSurfaceAct,
  useThemeColors,
  withAnalyticsPress,
  type AudienceLevel
} from '@bridger/ui';

// ---------------------------------------------------------------------------
// CAPTION SHEET
// ---------------------------------------------------------------------------

export function CaptionSheet({
  open,
  onClose,
  value,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onSave: (text: string) => void;
}) {
  // Local copy so a swipe-down never half-saves.
  const [text, setText] = useState(value);
  useEffect(() => {
    if (open) setText(value);
  }, [open, value]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add something"
      surface="caption_sheet"
      parentScreen="post_composer"
      dismissAnalyticsId={CAPTION_SHEET.actions.dismiss}
      footer={
        <CaptionDone
          onDone={() => {
            onSave(text);
            onClose();
          }}
        />
      }
    >
      {/* THIS SECTION DOES: the words. Saved as the update text (never burned onto a photo).
          Dynamic Type friendly: no fixed height, no character counter. */}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="What did you do today?"
        accessibilityLabel="Caption"
        multiline
        autoFocus
        className="min-h-[96px] rounded-2xl border border-ink-line bg-surface px-4 py-3 font-sans-sb text-[15px] leading-snug text-ink"
        placeholderTextColor="rgba(28,27,22,0.45)"
        maxLength={600}
      />
    </Sheet>
  );
}

/** Done lives in its own component so it can mark the surface as "acted". */
function CaptionDone({ onDone }: { onDone: () => void }) {
  const { markActed } = useSurfaceAct();
  return (
    <ButtonPrimary
      full
      analyticsId={CAPTION_SHEET.actions.done}
      accessibilityLabel="Done"
      onPress={() => {
        markActed();
        onDone();
      }}
    >
      Done
    </ButtonPrimary>
  );
}

// ---------------------------------------------------------------------------
// AUDIENCE SHEET
// ---------------------------------------------------------------------------

export function AudienceSheet({
  open,
  onClose,
  value,
  onChange,
  groups = [],
  group = null,
  onGroupChange
}: {
  open: boolean;
  onClose: () => void;
  value: AudienceLevel;
  onChange: (v: AudienceLevel) => void;
  groups?: string[];
  group?: string | null;
  onGroupChange?: (g: string | null) => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Who sees this"
      surface="audience_sheet"
      parentScreen="post_composer"
      dismissAnalyticsId={AUDIENCE_SHEET.actions.dismiss}
    >
      {/* PRIVACY: Only me maps to tier `none`; nobody else can ever read it. */}
      <AudienceInner
        value={value}
        onChange={(v) => {
          onChange(v);
          onClose();
        }}
        groups={groups}
        group={group}
        onGroupChange={onGroupChange}
      />
    </Sheet>
  );
}

function AudienceInner(props: {
  value: AudienceLevel;
  onChange: (v: AudienceLevel) => void;
  groups: string[];
  group: string | null;
  onGroupChange?: (g: string | null) => void;
}) {
  const { markActed } = useSurfaceAct();
  return (
    <AudiencePicker
      value={props.value}
      onChange={(v) => {
        markActed();
        props.onChange(v);
      }}
      allowOnlyMe
      groups={props.groups}
      group={props.group}
      onGroupChange={props.onGroupChange}
      levelAnalyticsIds={{
        only_me: POST_COMPOSER.audience.only_me,
        close: POST_COMPOSER.audience.close,
        friend: POST_COMPOSER.audience.friends,
        everyone: POST_COMPOSER.audience.everyone
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// ADD MEDIA SHEET ("+")
// ---------------------------------------------------------------------------

export function AddMediaSheet({
  open,
  onClose,
  left,
  onCamera,
  onRoll
}: {
  open: boolean;
  onClose: () => void;
  /** photos/videos still allowed today; 0 dims both options (never hidden) */
  left: number;
  onCamera: () => void;
  onRoll: () => void;
}) {
  const c = useThemeColors();
  const disabled = left <= 0;
  const Option = ({
    icon,
    label,
    analyticsId,
    onPress
  }: {
    icon: React.ReactNode;
    label: string;
    analyticsId: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, () => {
        if (disabled) return;
        onClose();
        onPress();
      })}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={disabled ? `${label}, day is full` : label}
      accessibilityState={{ disabled }}
      className={cn(
        'min-h-[72px] flex-1 items-center justify-center gap-2 rounded-2xl border border-ink-line bg-surface',
        disabled && 'opacity-40'
      )}
    >
      {icon}
      <Text className="font-sans-b text-[13px] text-ink">{label}</Text>
    </Pressable>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add"
      surface="add_media_sheet"
      parentScreen="post_composer"
      dismissAnalyticsId={ADD_MEDIA_SHEET.actions.dismiss}
    >
      <View className="flex-row gap-3">
        <Option
          icon={<CameraIcon size={22} color={c.ink} strokeWidth={2.2} />}
          label="Camera"
          analyticsId={POST_COMPOSER.actions.add_camera}
          onPress={onCamera}
        />
        <Option
          icon={<ImagesIcon size={22} color={c.ink} strokeWidth={2.2} />}
          label="Camera roll"
          analyticsId={POST_COMPOSER.actions.add_roll}
          onPress={onRoll}
        />
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// CUSTOMIZE TRAY (pencil)
// ---------------------------------------------------------------------------

/** Paper colors for Phase 1. Eggshell first (the default), then a few quiet papers. */
const PAPERS: Array<{ id: string; color: string; label: string }> = [
  { id: 'eggshell', color: '#F4F1E7', label: 'Eggshell' },
  { id: 'white', color: '#FFFFFF', label: 'White' },
  { id: 'kraft', color: '#D9C4A3', label: 'Kraft' },
  { id: 'sky', color: '#D5E5FD', label: 'Sky' },
  { id: 'mint', color: '#DCF4CA', label: 'Mint' },
  { id: 'blush', color: '#FADDE6', label: 'Blush' },
  { id: 'ink', color: '#1C1B16', label: 'Ink' }
];

export function CustomizeTray({
  open,
  onClose,
  background,
  onBackground,
  canUndo,
  onUndo
}: {
  open: boolean;
  onClose: () => void;
  background: string;
  onBackground: (color: string) => void;
  canUndo: boolean;
  onUndo: () => void;
}) {
  const c = useThemeColors();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Paper"
      surface="customize_tray"
      parentScreen="post_composer"
      dismissAnalyticsId={CUSTOMIZE_TRAY.actions.dismiss}
    >
      {/* THIS SECTION DOES: paper color. Tap = instant, no Apply. Name is read aloud, never shown. */}
      <View className="flex-row flex-wrap gap-3">
        {PAPERS.map((p) => {
          const on = background.toLowerCase() === p.color.toLowerCase();
          return (
            <Pressable
              key={p.id}
              onPress={withAnalyticsPress(POST_COMPOSER.actions.background_swatch, () => onBackground(p.color), {
                analyticsProps: { paper: p.id }
              })}
              accessibilityRole="button"
              accessibilityLabel={`Paper: ${p.label}`}
              accessibilityState={{ selected: on }}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: p.color,
                borderWidth: on ? 3 : 1,
                borderColor: on ? '#1D6FE8' : 'rgba(28,27,22,0.2)'
              }}
            />
          );
        })}
      </View>

      {/* THIS SECTION DOES: Undo the last change (auto-layout never destroys hand edits). */}
      <Pressable
        onPress={withAnalyticsPress(POST_COMPOSER.actions.undo, onUndo)}
        disabled={!canUndo}
        accessibilityRole="button"
        accessibilityLabel="Undo"
        accessibilityState={{ disabled: !canUndo }}
        className={cn(
          'mt-5 min-h-[44px] flex-row items-center justify-center gap-2 self-start rounded-full border border-ink-line px-4',
          !canUndo && 'opacity-40'
        )}
      >
        <Undo2Icon size={16} color={c.ink} strokeWidth={2.4} />
        <Text className="font-sans-b text-[13px] text-ink">Undo</Text>
      </Pressable>
    </Sheet>
  );
}
