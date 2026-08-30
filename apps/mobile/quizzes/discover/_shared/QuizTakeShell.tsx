// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared chrome for Discover quiz takes. Congruent checkbox rows, accent when
// selected, always-on type box (keyboard ready), emoji burst from the tap
// (same gravity shower as hobbies / onboarding). No page chrome (1/2). On
// phones, Enter advances. Continue is desktop.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { ArrowLeftIcon, XIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { trackClick, trackDeadClick } from '@bridger/shared';
import {
  ACCENTS,
  ButtonPrimary,
  ButtonSecondary,
  HobbyEmojiBurst,
  type HobbyBurstOrigin,
  Reveal,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { fireEmojiBurstHaptics } from '../../../lib/celebration-haptics';
import { QuizOptionTile, type QuizTileOption } from './QuizOptionTile';

export type QuizShellIds = {
  back: string;
  introBody: string;
  introStart: string;
  option: string;
  explain: string;
  next: string;
  optionsMore?: string;
  noteToggle?: string;
  resultBody: string;
  resultDone: string;
};

type IntroCopy = {
  headline: string;
  title: string;
  lead: string;
  rules: readonly string[];
  emoji: string;
};

type Props = {
  open: boolean;
  accent: Accent;
  ids: QuizShellIds;
  phase: 'intro' | 'take' | 'result';
  progress: number;
  onClose: () => void;
  onBack: () => void;
  intro: IntroCopy;
  onStart: () => void;
  stepLabel: string;
  prompt: string;
  questionEmoji?: string;
  options: QuizTileOption[];
  selected: string[];
  maxSelect: number;
  onToggle: (optionId: string, emoji: string) => void;
  explain: string;
  onExplainChange: (text: string) => void;
  continueDisabled: boolean;
  continueLabel: string;
  onContinue: () => void;
  secondaryAction?: {
    label: string;
    analyticsId: string;
    onPress: () => void;
    disabled?: boolean;
  };
  result: React.ReactNode;
  onDoneResult: () => void;
  resultDoneLabel?: string;
};

const isWeb = Platform.OS === 'web';

export function QuizTakeShell({
  open,
  accent,
  ids,
  phase,
  progress,
  onClose,
  onBack,
  intro,
  onStart,
  stepLabel,
  prompt,
  questionEmoji,
  options,
  selected,
  maxSelect,
  onToggle,
  explain,
  onExplainChange,
  continueDisabled,
  continueLabel,
  onContinue,
  secondaryAction,
  result,
  onDoneResult,
  resultDoneLabel = 'Done'
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const token = ACCENTS[accent];
  const inputRef = useRef<TextInput>(null);
  // Many bursts can be falling at once — a new pick never resets an old shower.
  const [bursts, setBursts] = useState<
    Array<{ key: number; emoji: string; origin: HobbyBurstOrigin }>
  >([]);

  // THIS SECTION DOES: keep the type box ready whenever a question is showing.
  useEffect(() => {
    if (phase !== 'take' || !open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, [phase, open, prompt]);

  const handleToggle = (opt: QuizTileOption, origin: HobbyBurstOrigin) => {
    const turningOn = !selected.includes(opt.id);
    onToggle(opt.id, opt.emoji);
    if (turningOn) {
      const key = Date.now() + Math.random();
      setBursts((prev) => [...prev, { key, emoji: opt.emoji, origin }]);
    }
    // Keep typing available after a tap.
    inputRef.current?.focus();
  };

  const tryAdvance = () => {
    if (continueDisabled) return;
    onContinue();
  };

  if (!open) return null;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-canvas"
      >
        {/* THIS SECTION DOES: boom shower over the whole screen (window
            coordinates), so pieces fall all the way off the bottom. */}
        {bursts.map((b) => (
          <HobbyEmojiBurst
            key={b.key}
            play
            emoji={b.emoji}
            origin={b.origin}
            count={18}
            power="boom"
            onPlayStart={fireEmojiBurstHaptics}
            onDone={() =>
              setBursts((prev) => prev.filter((x) => x.key !== b.key))
            }
          />
        ))}

        <View
          style={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom }}
          className="flex-1"
        >
          <View
            pointerEvents="none"
            className={cn(
              'absolute left-0 right-0 top-0 h-36 opacity-90',
              token.tintSolid
            )}
          />

          <View className="z-10 flex-row items-center gap-3 px-4">
            <Pressable
              onPress={withAnalyticsPress(ids.back, onBack)}
              accessibilityRole="button"
              accessibilityLabel={phase === 'intro' ? 'Close' : 'Back'}
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-surface"
            >
              {phase === 'intro' ? (
                <XIcon size={16} color={c.ink} strokeWidth={2.6} />
              ) : (
                <ArrowLeftIcon size={16} color={c.ink} strokeWidth={2.6} />
              )}
            </Pressable>
            <View className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full border border-ink/15 bg-surface">
              <View
                className={cn('h-full rounded-full', token.bg)}
                style={{
                  width: `${Math.round(Math.max(0.04, progress) * 100)}%`
                }}
                accessible={false}
              />
            </View>
          </View>

          <View className="z-10 min-h-0 flex-1 px-4 pt-2">
            {phase === 'intro' ? (
              <IntroPanel
                intro={intro}
                accent={accent}
                bodyId={ids.introBody}
              />
            ) : null}

            {phase === 'take' ? (
              <View className="min-h-0 flex-1">
                <Reveal key={prompt} index={0}>
                  <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                    {stepLabel}
                  </Text>
                  <Pressable
                    onPress={() =>
                      trackDeadClick(ids.introBody, { interactive: false })
                    }
                    accessibilityRole="text"
                  >
                    <Text
                      accessibilityRole="header"
                      numberOfLines={2}
                      className="mt-1 font-pixel text-[20px] leading-tight text-ink"
                    >
                      {questionEmoji ? `${questionEmoji} ` : ''}
                      {prompt}
                    </Text>
                  </Pressable>
                </Reveal>

                {/* THIS SECTION DOES: tight congruent checkbox list (scroll only if long). */}
                <ScrollView
                  className="mt-3 min-h-0 flex-1"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
                >
                  {options.map((opt, i) => (
                    <Reveal key={opt.id} index={Math.min(i, 6)} distance={8}>
                      <QuizOptionTile
                        option={opt}
                        selected={selected.includes(opt.id)}
                        accent={accent}
                        onPress={(origin) => {
                          trackClick(ids.option, { method: opt.id });
                          handleToggle(opt, origin);
                        }}
                      />
                    </Reveal>
                  ))}
                </ScrollView>

                {/* THIS SECTION DOES: always-on type box. Return / → advances (mobile). */}
                <View
                  className="mt-2 flex-row items-center gap-2 border-2 border-ink bg-surface px-3 py-2"
                  style={{ borderRadius: 16 }}
                >
                  <TextInput
                    ref={inputRef}
                    value={explain}
                    onChangeText={onExplainChange}
                    placeholder="Type anything you want…"
                    placeholderTextColor={c.inkMute}
                    blurOnSubmit
                    returnKeyType="go"
                    enablesReturnKeyAutomatically={false}
                    onSubmitEditing={tryAdvance}
                    accessibilityLabel="Optional note. Press go or return to continue when ready."
                    className="min-h-[40px] min-w-0 flex-1 font-sans text-[15px] text-ink"
                  />
                  {!isWeb ? (
                    <Pressable
                      onPress={withAnalyticsPress(
                        ids.next,
                        continueDisabled ? undefined : tryAdvance
                      )}
                      disabled={continueDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={continueLabel}
                      className={cn(
                        'h-10 w-10 items-center justify-center rounded-xl border-2',
                        continueDisabled
                          ? 'border-ink-line bg-canvas'
                          : cn(token.bg, 'border-ink')
                      )}
                    >
                      <Text
                        className={cn(
                          'font-sans-b text-[18px]',
                          continueDisabled ? 'text-ink-mute' : token.text
                        )}
                      >
                        →
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {phase === 'result' ? (
              <Pressable
                onPress={() => trackDeadClick(ids.resultBody)}
                className="min-h-0 flex-1"
                accessibilityRole="text"
              >
                <Reveal index={0}>{result}</Reveal>
              </Pressable>
            ) : null}
          </View>

          <View className="z-10 px-4 pb-3 pt-2">
            {phase === 'intro' ? (
              <ButtonPrimary
                analyticsId={ids.introStart}
                onPress={onStart}
                accessibilityLabel="Start"
                full
              >
                Start
              </ButtonPrimary>
            ) : null}

            {phase === 'take' ? (
              <View className="gap-2">
                {/* Desktop keeps Continue; phones use Return / → on the type box. */}
                {isWeb ? (
                  <ButtonPrimary
                    analyticsId={ids.next}
                    disabled={continueDisabled}
                    onPress={onContinue}
                    accessibilityLabel="Continue"
                    full
                  >
                    {continueLabel}
                  </ButtonPrimary>
                ) : null}
                {secondaryAction ? (
                  <ButtonSecondary
                    analyticsId={secondaryAction.analyticsId}
                    disabled={secondaryAction.disabled}
                    onPress={secondaryAction.onPress}
                    accessibilityLabel={secondaryAction.label}
                    full
                    tone="ghost"
                  >
                    {secondaryAction.label}
                  </ButtonSecondary>
                ) : null}
              </View>
            ) : null}

            {phase === 'result' ? (
              <ButtonPrimary
                analyticsId={ids.resultDone}
                onPress={onDoneResult}
                accessibilityLabel={resultDoneLabel}
                full
              >
                {resultDoneLabel}
              </ButtonPrimary>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function IntroPanel({
  intro,
  accent,
  bodyId
}: {
  intro: IntroCopy;
  accent: Accent;
  bodyId: string;
}) {
  const token = ACCENTS[accent];
  return (
    <Pressable
      onPress={() => trackDeadClick(bodyId)}
      accessibilityRole="text"
      className="flex-1 justify-center"
    >
      <Reveal index={0}>
        <View
          className={cn(
            'mb-4 h-20 w-20 items-center justify-center border-2 border-ink',
            token.bg
          )}
          style={{ borderRadius: 20 }}
        >
          <Text accessible={false} className="text-[40px]">
            {intro.emoji}
          </Text>
        </View>
      </Reveal>
      <Reveal index={1}>
        <Text className="font-pixel text-[28px] leading-tight text-ink">
          {intro.headline}
        </Text>
        <Text className="mt-1 font-sans-sb text-[14px] text-ink-mute">
          {intro.title}
        </Text>
      </Reveal>
      <Reveal index={2}>
        <Text className="mt-3 font-sans text-[15px] leading-snug text-ink-soft">
          {intro.lead}
        </Text>
      </Reveal>
      <View className="mt-4 gap-2">
        {intro.rules.slice(0, 3).map((rule, i) => (
          <Reveal key={rule} index={i + 3}>
            <View
              className="flex-row items-start gap-2 border border-ink/10 bg-surface px-3 py-2.5"
              style={{ borderRadius: 16 }}
            >
              <Text className="min-w-0 flex-1 font-sans text-[14px] leading-snug text-ink-soft">
                {rule}
              </Text>
            </View>
          </Reveal>
        ))}
      </View>
    </Pressable>
  );
}
