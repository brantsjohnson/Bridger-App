// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen capture for the Side Quest wall. Photo quests: shutter →
// caption → who can see it → Post. Text quests (Notes App Discovery):
// jump straight to a big blurb field with the same yellow vibe as the Home
// card. Capture only for photos (no photo library). Demo fakes the shutter.
// ACCESSIBILITY: camera permission asked on shutter with a plain purpose string.
// PRIVACY: analytics never logs caption / blurb text.
// Spec: HOME.md § Weekly activity · Magic Patterns ActivityCapture.
// ============================================
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDownIcon } from 'lucide-react-native';
import {
  ACTIVITY_CAPTURE,
  dismissSurface,
  openSurface,
  trackProduct,
  type ActivityPostMode
} from '@bridger/shared';
import {
  AudiencePicker,
  ButtonPrimary,
  cn,
  useReduceMotion,
  withAnalyticsPress,
  type AudienceLevel
} from '@bridger/ui';
import { createPost } from '../../data/activity';

type Props = {
  open: boolean;
  prompt: string;
  activityId: string;
  /** photo = camera first; text = notes-style blurb input. */
  postMode?: ActivityPostMode;
  /** Accent emoji for text posts (pencil for Notes App Discovery). */
  emoji?: string;
  onClose: () => void;
  /** Parent refreshes the collage after a successful post */
  onPosted: () => void;
};

export function ActivityCaptureSheet({
  open,
  prompt,
  activityId,
  postMode = 'photo',
  emoji = '✏️',
  onClose,
  onPosted
}: Props) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const isText = postMode === 'text';
  const [captured, setCaptured] = useState(false);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<AudienceLevel>('friend');
  const [group, setGroup] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const openedAt = React.useRef(Date.now());

  useEffect(() => {
    if (!open) {
      setCaptured(false);
      setCaption('');
      setAudience('friend');
      setGroup(null);
      setPosting(false);
      return;
    }
    openedAt.current = Date.now();
    openSurface('activity_capture', 'activity');
    // Text quests skip the camera and open on the blurb field.
    if (isText) setCaptured(true);
  }, [open, isText]);

  function dismiss() {
    dismissSurface('activity_capture', {
      dwell_ms: Date.now() - openedAt.current
    });
    onClose();
  }

  function onShutter() {
    // ACCESSIBILITY: purpose string in context — demo skips real camera.
    // Live: request permission here with "So you can post a photo to this week's Side Quest."
    setCaptured(true);
  }

  async function onPost() {
    if (posting) return;
    const blurb = caption.trim();
    if (isText && !blurb) {
      Alert.alert('Add a blurb', 'Type a line from your notes before posting.');
      return;
    }
    setPosting(true);
    try {
      await createPost(activityId, {
        emoji: isText ? emoji : '🧢',
        caption: blurb || undefined,
        audience: group ?? audience
      });
      // Product outcome — never caption or names.
      trackProduct('activity_posted');
      onPosted();
      dismiss();
    } catch {
      Alert.alert('Could not post', 'Try again in a moment.');
    } finally {
      setPosting(false);
    }
  }

  // Yellow wash matches the Home Side Quest card vibe for text quests.
  const sheetBg = isText ? '#FFB515' : undefined;

  return (
    <Modal
      visible={open}
      animationType={reduceMotion ? 'none' : 'slide'}
      presentationStyle="fullScreen"
      onRequestClose={dismiss}
      accessibilityViewIsModal
    >
      {/* KEYBOARD: when writing a blurb, keep the field and Post above the keys. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={{
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: sheetBg
          }}
          className={cn('flex-1', !isText && 'bg-ink')}
          accessibilityLabel={
            isText ? 'Post a note to the Side Quest' : 'Post to the activity'
          }
        >
          <View className="flex-row items-center justify-between px-4">
            <Pressable
              onPress={withAnalyticsPress(
                ACTIVITY_CAPTURE.close,
                isText
                  ? dismiss
                  : captured
                    ? () => setCaptured(false)
                    : dismiss
              )}
              accessibilityRole="button"
              accessibilityLabel={
                isText ? 'Close' : captured ? 'Retake' : 'Close'
              }
              className="h-9 w-9 items-center justify-center rounded-full bg-white/85"
            >
              <ChevronDownIcon size={20} color="#1C1B16" strokeWidth={2.6} />
            </Pressable>
            <Text
              className={cn(
                'min-w-0 flex-1 px-3 text-center font-pixel text-[15px]',
                isText ? 'text-ink' : 'text-white'
              )}
              numberOfLines={1}
            >
              {prompt}
            </Text>
            <View className="w-9" />
          </View>

          {isText ? (
            // THIS SECTION DOES: big notes-app style text box on the yellow card
            <View className="mx-4 mt-4 flex-1 rounded-card bg-white p-4">
              <Text accessible={false} className="mb-2 text-[28px]">
                {emoji}
              </Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Paste a blurb from your notes…"
                accessibilityLabel="Notes blurb"
                placeholderTextColor="rgba(28,27,22,0.4)"
                multiline
                autoFocus
                textAlignVertical="top"
                className="min-h-[160px] flex-1 font-sans-md text-[16px] leading-snug text-ink"
              />
            </View>
          ) : (
            <View
              className={cn(
                'mx-4 mt-4 flex-1 items-center justify-center rounded-card',
                captured ? 'bg-pink' : 'bg-white/10'
              )}
            >
              <Text
                accessible={false}
                className={captured ? 'text-[96px]' : 'text-[64px] opacity-60'}
              >
                {captured ? '🧢' : '📷'}
              </Text>
            </View>
          )}

          {captured || isText ? (
            <View className="gap-3 px-4 pt-4">
              {!isText ? (
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Caption"
                  accessibilityLabel="Caption"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                  className="min-h-[44px] rounded-2xl border border-white/30 px-4 py-3 font-sans-sb text-[14px] text-white"
                />
              ) : null}

              <AudiencePicker
                value={audience}
                onChange={setAudience}
                group={group}
                onGroupChange={setGroup}
                // No fake demo groups until they have real ones.
                groups={[]}
                tone={isText ? 'light' : 'dark'}
              />

              <ButtonPrimary
                full
                loading={posting}
                analyticsId={ACTIVITY_CAPTURE.post}
                onPress={() => void onPost()}
                accessibilityLabel="Post"
              >
                Post
              </ButtonPrimary>
            </View>
          ) : (
            <View className="items-center gap-2 pb-6 pt-6">
              <Pressable
                onPress={withAnalyticsPress(ACTIVITY_CAPTURE.shutter, onShutter)}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
                className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 active:scale-95"
              >
                <View className="h-14 w-14 rounded-full bg-white" />
              </Pressable>
              <Text className="font-sans-sb text-[12px] text-white/70">
                Tap to capture
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
