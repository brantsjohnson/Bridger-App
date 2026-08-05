// ============================================
// WHAT THIS FILE DOES (plain English):
// Capture + compose for a new Update. Tap the shutter for a photo, hold for
// video (≤20s). Text/overlay and audience come after capture — there is no
// camera-roll upload path. Video posting shows a co-op lock for free members.
// Emits the post_story flow + story_posted product event.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDownIcon, LockIcon, TypeIcon } from 'lucide-react-native';
import {
  POST_COMPOSER,
  trackClick,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  AudiencePicker,
  ButtonPrimary,
  ButtonSecondary,
  SurfaceHost,
  cn,
  useSurfaceAct,
  useThemeColors,
  withAnalyticsPress,
  type AudienceLevel
} from '@bridger/ui';
import { useStoryCapture } from '../../hooks/useStoryCapture';

type Props = {
  onClose?: () => void;
  onPosted?: () => void;
  /** PAYMENT: free members can't post video — show lock instead of capture */
  isCoopMember?: boolean;
};

export function CaptureCompose({
  onClose,
  onPosted,
  isCoopMember = false
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { left, prompts, atCap, onCreate } = useStoryCapture();

  const [theme, setTheme] = useState<string | null>(null);
  const [captured, setCaptured] = useState<null | 'photo' | 'video'>(null);
  const [holding, setHolding] = useState(false);
  const [overlay, setOverlay] = useState('');
  const [audience, setAudience] = useState<AudienceLevel>('friend');
  const [group, setGroup] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flowStartedAt = useRef(Date.now());
  const lastStep = useRef('open');

  useEffect(() => {
    flowStartedAt.current = Date.now();
    lastStep.current = 'open';
    trackFlowStarted('post_story');
    trackFlowStep('post_story', 'open_composer');
    return () => {
      // If they leave without posting, count as abandoned
      if (lastStep.current !== 'posted') {
        trackFlowAbandoned(
          'post_story',
          Date.now() - flowStartedAt.current,
          lastStep.current
        );
      }
    };
  }, []);

  const startHold = () => {
    if (atCap) {
      Alert.alert('Daily limit', 'You can post 3 updates a day. Come back tomorrow.');
      return;
    }
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      if (!isCoopMember) {
        setHolding(false);
        Alert.alert(
          'Co-op unlock',
          'Posting video updates is a co-op perk. Watching video is free for everyone.'
        );
        trackClick(POST_COMPOSER.capture.hold_video, { method: 'video', is_coop: false });
        return;
      }
      lastStep.current = 'capture_video';
      trackFlowStep('post_story', 'capture', { method: 'video' });
      trackClick(POST_COMPOSER.capture.hold_video, { method: 'video' });
      setCaptured('video');
    }, 600);
  };

  const endHold = () => {
    setHolding(false);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      if (!captured) {
        lastStep.current = 'capture_photo';
        trackFlowStep('post_story', 'capture', { method: 'photo' });
        trackClick(POST_COMPOSER.capture.photo, { method: 'photo' });
        setCaptured('photo');
      }
    }
  };

  const handlePost = async () => {
    if (!captured || posting || atCap) return;
    setPosting(true);
    try {
      lastStep.current = 'post';
      trackFlowStep('post_story', 'post');
      // Live createPost uploads `uri` when the real camera hands one over.
      // Fake shutter (no file yet) still posts a caption-only Update.
      await onCreate({
        type: captured,
        overlayText: overlay || undefined,
        themeSlug: theme ?? undefined,
        audience,
        group,
        emoji: captured === 'video' ? '🎥' : '📸',
        accent: 'purple'
      });
      trackProduct('story_posted', {
        method: captured,
        is_coop: isCoopMember
      });
      trackFlowCompleted('post_story', Date.now() - flowStartedAt.current, {
        method: captured
      });
      lastStep.current = 'posted';
      onPosted?.();
      onClose?.();
    } catch (e) {
      Alert.alert('Could not post', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setPosting(false);
    }
  };

  if (captured) {
    return (
      <SurfaceHost surface="post_composer" parentScreen="home" open>
        <ComposeInner
          captured={captured}
          themeLabel={
            theme ? prompts.find((t) => t.slug === theme)?.label : undefined
          }
          overlay={overlay}
          setOverlay={(v) => {
            lastStep.current = 'caption';
            trackFlowStep('post_story', 'caption');
            setOverlay(v);
          }}
          audience={audience}
          setAudience={setAudience}
          group={group}
          setGroup={setGroup}
          posting={posting}
          onRetake={() => setCaptured(null)}
          onPost={() => void handlePost()}
          insetsTop={insets.top}
          insetsBottom={insets.bottom}
          ink={c.ink}
        />
      </SurfaceHost>
    );
  }

  return (
    <SurfaceHost surface="post_composer" parentScreen="home" open>
      <View
        style={{ paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }}
        className="relative flex-1 bg-ink"
      >
        <View className="flex-row items-center justify-between px-4">
          <Pressable
            onPress={withAnalyticsPress(POST_COMPOSER.actions.discard, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="h-9 w-9 items-center justify-center rounded-full bg-white/85"
          >
            <ChevronDownIcon size={20} color={c.ink} strokeWidth={2.6} />
          </Pressable>
          <Text className="font-pixel text-[15px] text-white">Your story</Text>
          <Text className="font-sans-b text-[12px] text-white/70">{left} left</Text>
        </View>

        <View className="mx-4 mt-4 flex-1 items-center justify-center rounded-2xl bg-white/10">
          <Text accessible={false} className="text-[64px] opacity-60">
            📷
          </Text>
          <Text className="mt-2 font-sans-sb text-[12px] text-white/50">
            In-app capture only — no camera roll
          </Text>
        </View>

        <View className="px-4 pt-5">
          <Text className="mb-2 font-sans-b text-[12px] uppercase tracking-wide text-white/60">
            Themed posts
          </Text>
          <View className="flex-row gap-2.5">
            {prompts.map((t) => (
              <Pressable
                key={t.slug}
                onPress={withAnalyticsPress(POST_COMPOSER.suggested.suggested_prompt, () => {
                  lastStep.current = 'suggested';
                  trackFlowStep('post_story', 'suggested_used');
                  setTheme((v) => (v === t.slug ? null : t.slug));
                })}
                accessibilityRole="button"
                accessibilityState={{ selected: theme === t.slug }}
                accessibilityLabel={t.label}
                className={cn(
                  'min-h-[44px] flex-1 items-center gap-1 border-2 border-dashed px-2 py-3',
                  theme === t.slug
                    ? 'border-white bg-white/15'
                    : 'border-white/35'
                )}
              >
                <Text accessible={false} className="text-[20px]">
                  {t.icon}
                </Text>
                <Text
                  className={cn(
                    'font-sans-b text-[11px]',
                    theme === t.slug ? 'text-white' : 'text-white/75'
                  )}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="items-center gap-2 pb-2 pt-6">
          <Pressable
            onPressIn={startHold}
            onPressOut={endHold}
            accessibilityRole="button"
            accessibilityLabel="Tap for a photo, hold for video"
            className={cn(
              'h-20 w-20 items-center justify-center rounded-full border-4 border-white',
              holding ? 'scale-95 bg-coral' : 'bg-white/20'
            )}
          >
            <View
              className={cn(
                'h-14 w-14 rounded-full',
                holding ? 'bg-coral' : 'bg-white'
              )}
            />
          </Pressable>
          <View className="flex-row items-center gap-1.5">
            <Text className="font-sans-sb text-[12px] text-white/70">
              Tap photo · hold video
            </Text>
            {!isCoopMember ? (
              <LockIcon size={12} color="rgba(255,255,255,0.6)" strokeWidth={2.6} />
            ) : null}
          </View>
          <ButtonSecondary
            size="sm"
            tone="ghost"
            onPress={onClose}
            accessibilityLabel="Not now"
            className="text-white"
          >
            Not now
          </ButtonSecondary>
        </View>
      </View>
    </SurfaceHost>
  );
}

function ComposeInner({
  captured,
  themeLabel,
  overlay,
  setOverlay,
  audience,
  setAudience,
  group,
  setGroup,
  posting,
  onRetake,
  onPost,
  insetsTop,
  insetsBottom,
  ink
}: {
  captured: 'photo' | 'video';
  themeLabel?: string;
  overlay: string;
  setOverlay: (v: string) => void;
  audience: AudienceLevel;
  setAudience: (v: AudienceLevel) => void;
  group: string | null;
  setGroup: (g: string | null) => void;
  posting: boolean;
  onRetake: () => void;
  onPost: () => void;
  insetsTop: number;
  insetsBottom: number;
  ink: string;
}) {
  const { markActed } = useSurfaceAct();

  return (
    <View
      style={{ paddingTop: Math.max(insetsTop, 12), paddingBottom: Math.max(insetsBottom, 16) }}
      className="relative flex-1 bg-ink"
    >
      <View className="flex-row items-center justify-between px-4">
        <Pressable
          onPress={onRetake}
          accessibilityRole="button"
          accessibilityLabel="Retake"
          className="h-9 w-9 items-center justify-center rounded-full bg-white/85"
        >
          <ChevronDownIcon size={20} color={ink} strokeWidth={2.6} />
        </Pressable>
        <Text className="font-pixel text-[15px] text-white">
          {themeLabel ?? 'Add text'}
        </Text>
        <View className="w-9" />
      </View>

      <View className="relative mx-4 mt-4 flex-1 items-center justify-center rounded-2xl bg-purple">
        <Text accessible={false} className="text-[96px]">
          {captured === 'video' ? '🎥' : '📸'}
        </Text>
        {overlay ? (
          <View className="absolute left-1/2 top-1/3 -translate-x-1/2 -rotate-2 bg-white px-3 py-1">
            <Text className="font-pixel text-[20px] text-ink">{overlay}</Text>
          </View>
        ) : null}
      </View>

      <View className="gap-3 px-4 pt-4">
        <View className="flex-row items-center gap-2 rounded-full border border-white/30 px-4 py-2.5">
          <TypeIcon size={16} color="rgba(255,255,255,0.7)" strokeWidth={2.4} />
          <TextInput
            value={overlay}
            onChangeText={setOverlay}
            placeholder="Add text on top"
            accessibilityLabel="Overlay text"
            placeholderTextColor="rgba(255,255,255,0.5)"
            className="min-w-0 flex-1 font-sans-sb text-[14px] text-white"
          />
        </View>
        <AudiencePicker
          value={audience}
          onChange={setAudience}
          group={group}
          onGroupChange={setGroup}
          groups={['Climbing crew', 'College friends']}
          tone="dark"
          levelAnalyticsIds={{
            close: POST_COMPOSER.audience.close,
            friend: POST_COMPOSER.audience.friends,
            everyone: POST_COMPOSER.audience.everyone
          }}
        />
        <ButtonPrimary
          full
          loading={posting}
          analyticsId={POST_COMPOSER.actions.post}
          onPress={() => {
            markActed();
            onPost();
          }}
          accessibilityLabel="Post"
        >
          Post
        </ButtonPrimary>
      </View>
    </View>
  );
}
