// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen capture for the weekly activity collage. Tap shutter → caption
// + who can see it → Post. Capture only (no photo library). Demo mode fakes
// the shutter so you can try the flow without a camera.
// ACCESSIBILITY: camera permission asked on shutter with a plain purpose string.
// PRIVACY: analytics never logs caption text.
// Spec: HOME.md § Weekly activity · Magic Patterns ActivityCapture.
// ============================================
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDownIcon, TypeIcon } from 'lucide-react-native';
import {
  ACTIVITY_CAPTURE,
  dismissSurface,
  openSurface,
  trackProduct
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

const DEMO_GROUPS = ['Climbing crew', 'College friends'];

type Props = {
  open: boolean;
  prompt: string;
  activityId: string;
  onClose: () => void;
  /** Parent refreshes the collage after a successful post */
  onPosted: () => void;
};

export function ActivityCaptureSheet({
  open,
  prompt,
  activityId,
  onClose,
  onPosted
}: Props) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
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
  }, [open]);

  function dismiss() {
    dismissSurface('activity_capture', {
      dwell_ms: Date.now() - openedAt.current
    });
    onClose();
  }

  function onShutter() {
    // ACCESSIBILITY: purpose string in context — demo skips real camera.
    // Live: request permission here with "So you can post a photo to this week's activity."
    setCaptured(true);
  }

  async function onPost() {
    if (posting) return;
    setPosting(true);
    try {
      await createPost(activityId, {
        emoji: '🧢',
        caption: caption.trim() || undefined,
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

  return (
    <Modal
      visible={open}
      animationType={reduceMotion ? 'none' : 'slide'}
      presentationStyle="fullScreen"
      onRequestClose={dismiss}
      accessibilityViewIsModal
    >
      <View
        style={{
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16)
        }}
        className="flex-1 bg-ink"
        accessibilityLabel="Post to the activity"
      >
        <View className="flex-row items-center justify-between px-4">
          <Pressable
            onPress={withAnalyticsPress(
              ACTIVITY_CAPTURE.close,
              captured ? () => setCaptured(false) : dismiss
            )}
            accessibilityRole="button"
            accessibilityLabel={captured ? 'Retake' : 'Close'}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/85"
          >
            <ChevronDownIcon size={20} color="#1C1B16" strokeWidth={2.6} />
          </Pressable>
          <Text
            className="min-w-0 flex-1 px-3 text-center font-pixel text-[15px] text-white"
            numberOfLines={1}
          >
            {prompt}
          </Text>
          <View className="w-9" />
        </View>

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

        {captured ? (
          <View className="gap-3 px-4 pt-4">
            <View className="flex-row items-center gap-2 rounded-full border border-white/30 px-4 py-2.5">
              <TypeIcon
                size={16}
                color="rgba(255,255,255,0.7)"
                strokeWidth={2.4}
              />
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Caption"
                accessibilityLabel="Caption"
                placeholderTextColor="rgba(255,255,255,0.5)"
                className="min-w-0 flex-1 font-sans-sb text-[14px] text-white"
              />
            </View>

            <AudiencePicker
              value={audience}
              onChange={setAudience}
              group={group}
              onGroupChange={setGroup}
              groups={DEMO_GROUPS}
              tone="dark"
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
    </Modal>
  );
}
