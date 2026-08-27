// ============================================
// WHAT THIS FILE DOES (plain English):
// The full Behind the Scenes screens: soft intro cards, optional multi-select,
// per-item "how it shows up", how much to use in matching, then a thank-you.
// Skip is always available. Answers never go on a profile. AI does not adapt
// this flow (see moderator.ts).
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, XIcon } from 'lucide-react-native';
import {
  BEHIND_THE_SCENES,
  type DisclosureConditionKey,
  type DisclosureImpactLevel,
  type DisclosureItem,
  type DisclosureMatchWeight,
  type DisclosureSaveInput,
  openSurface,
  dismissSurface,
  trackClick,
  trackDeadClick,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  ButtonPrimary,
  ButtonSecondary,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import {
  CLOSE_BODY,
  CLOSE_CTA,
  CLOSE_TITLE,
  CONDITION_OPTIONS,
  CONDITIONS_HINT,
  CONDITIONS_PROMPT,
  CONTEXT_NOTE_PLACEHOLDER,
  CONTEXT_NOTE_PROMPT,
  DISCLOSURE_SUPPORT_URL,
  DISCLOSURE_VERSION,
  IMPACT_HINT,
  IMPACT_OPTIONS,
  INTRO_CARDS,
  MATCH_WEIGHT_HINT,
  MATCH_WEIGHT_OPTIONS,
  MATCH_WEIGHT_PROMPT,
  OTHER_LABEL_PLACEHOLDER,
  SUPPORT_LINE,
  impactPrompt,
  labelForCondition
} from './content';

type Phase =
  | 'intro'
  | 'conditions'
  | 'other_label'
  | 'impact'
  | 'match_weight'
  | 'close';

type Props = {
  open: boolean;
  parentScreen?: string;
  onClose: () => void;
  /** Confirmed save (skip with no answers, or finish). */
  onSave: (input: DisclosureSaveInput) => void | Promise<void>;
};

export function DisclosureFlow({
  open,
  parentScreen = 'discover',
  onClose,
  onSave
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const startedAt = useRef<number | null>(null);
  const lastStep = useRef('intro');
  const completedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('intro');
  const [introIndex, setIntroIndex] = useState(0);
  const [selected, setSelected] = useState<DisclosureConditionKey[]>([]);
  const [otherLabel, setOtherLabel] = useState('');
  const [impactQueue, setImpactQueue] = useState<DisclosureConditionKey[]>([]);
  const [impactIndex, setImpactIndex] = useState(0);
  const [itemsByKey, setItemsByKey] = useState<
    Partial<Record<DisclosureConditionKey, DisclosureItem>>
  >({});
  const [contextDraft, setContextDraft] = useState('');
  const [matchWeight, setMatchWeight] = useState<DisclosureMatchWeight | null>(
    null
  );

  // Reset when the sheet opens; track surface + flow start.
  useEffect(() => {
    if (!open) return;
    completedRef.current = false;
    startedAt.current = Date.now();
    lastStep.current = 'intro';
    setPhase('intro');
    setIntroIndex(0);
    setSelected([]);
    setOtherLabel('');
    setImpactQueue([]);
    setImpactIndex(0);
    setItemsByKey({});
    setContextDraft('');
    setMatchWeight(null);
    openSurface('behind_the_scenes', parentScreen);
    trackFlowStarted('behind_the_scenes', { quiz_id: 'disclosure' });
    trackProduct('quiz_started', {
      quiz_id: 'disclosure',
      quiz_version: DISCLOSURE_VERSION
    });
    return () => {
      if (!completedRef.current) {
        const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
        trackFlowAbandoned('behind_the_scenes', ms, lastStep.current, {
          quiz_id: 'disclosure'
        });
        trackProduct('quiz_abandoned', {
          quiz_id: 'disclosure',
          last_question_id: lastStep.current,
          time_spent_ms: ms
        });
        dismissSurface('behind_the_scenes');
      }
    };
  }, [open, parentScreen]);

  const go = (next: Phase, stepName: string) => {
    lastStep.current = stepName;
    trackFlowStep('behind_the_scenes', stepName, { quiz_id: 'disclosure' });
    setPhase(next);
  };

  const finish = async (input: DisclosureSaveInput) => {
    completedRef.current = true;
    const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
    await onSave(input);
    trackFlowCompleted('behind_the_scenes', ms, { quiz_id: 'disclosure' });
    trackProduct('quiz_completed', {
      quiz_id: 'disclosure',
      quiz_version: DISCLOSURE_VERSION,
      time_to_complete_ms: ms,
      questions_answered: input.items.length
    });
    dismissSurface('behind_the_scenes');
    onClose();
  };

  const skipEntirely = () => {
    void finish({ version: DISCLOSURE_VERSION, status: 'skipped', items: [] });
  };

  const buildItems = (): DisclosureItem[] =>
    Object.values(itemsByKey).filter(Boolean) as DisclosureItem[];

  const beginImpactOrWeight = (keys: DisclosureConditionKey[]) => {
    if (keys.includes('prefer_not_list') && keys.length === 1) {
      setItemsByKey({
        prefer_not_list: { conditionKey: 'prefer_not_list' }
      });
      go('match_weight', 'match_weight');
      return;
    }
    const forImpact = keys.filter((k) => k !== 'prefer_not_list');
    if (forImpact.includes('other')) {
      go('other_label', 'other_label');
      setImpactQueue(forImpact);
      setImpactIndex(0);
      return;
    }
    if (forImpact.length === 0) {
      go('match_weight', 'match_weight');
      return;
    }
    setImpactQueue(forImpact);
    setImpactIndex(0);
    setContextDraft('');
    go('impact', `impact:${forImpact[0]}`);
  };

  const currentImpactKey = impactQueue[impactIndex];
  const currentImpactLabel = currentImpactKey
    ? labelForCondition(
        currentImpactKey,
        currentImpactKey === 'other' ? otherLabel : undefined
      )
    : '';

  const progress = useMemo(() => {
    if (phase === 'intro') return (introIndex + 1) / (INTRO_CARDS.length + 4);
    if (phase === 'conditions' || phase === 'other_label') return 0.35;
    if (phase === 'impact') {
      const n = Math.max(impactQueue.length, 1);
      return 0.4 + (0.4 * (impactIndex + 1)) / n;
    }
    if (phase === 'match_weight') return 0.85;
    return 1;
  }, [phase, introIndex, impactIndex, impactQueue.length]);

  // THIS SECTION DOES: hide the top "Skip" when the bottom bar already says
  // "Skip for now" (last intro card, or conditions with nothing picked). Two
  // skips that do the same thing feel like a mistake.
  const showChromeSkip =
    phase !== 'close' &&
    !(phase === 'intro' && introIndex >= INTRO_CARDS.length - 1) &&
    !(phase === 'conditions' && selected.length === 0);

  if (!open) return null;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={skipEntirely}>
      <View
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
        className="flex-1 bg-canvas"
      >
        {/* Top bar: close / back + progress */}
        <View className="flex-row items-center gap-3 px-4">
          <Pressable
            onPress={withAnalyticsPress(BEHIND_THE_SCENES.chrome.back, () => {
              if (phase === 'intro' && introIndex === 0) {
                skipEntirely();
                return;
              }
              if (phase === 'intro') {
                setIntroIndex((i) => i - 1);
                return;
              }
              if (phase === 'conditions') {
                go('intro', 'intro');
                setIntroIndex(INTRO_CARDS.length - 1);
                return;
              }
              if (phase === 'other_label') {
                go('conditions', 'conditions');
                return;
              }
              if (phase === 'impact' && impactIndex > 0) {
                setImpactIndex((i) => i - 1);
                setContextDraft('');
                return;
              }
              if (phase === 'impact') {
                if (impactQueue.includes('other')) {
                  go('other_label', 'other_label');
                } else {
                  go('conditions', 'conditions');
                }
                return;
              }
              if (phase === 'match_weight') {
                if (impactQueue.length > 0) {
                  setImpactIndex(impactQueue.length - 1);
                  go('impact', `impact:${impactQueue[impactQueue.length - 1]}`);
                } else {
                  go('conditions', 'conditions');
                }
                return;
              }
              // close: back to match weight
              go('match_weight', 'match_weight');
            })}
            accessibilityRole="button"
            accessibilityLabel={
              phase === 'intro' && introIndex === 0 ? 'Close' : 'Back'
            }
            className="h-11 w-11 items-center justify-center rounded-full border border-ink-line bg-surface"
          >
            {phase === 'intro' && introIndex === 0 ? (
              <XIcon size={16} color={c.ink} strokeWidth={2.6} />
            ) : (
              <ArrowLeftIcon size={16} color={c.ink} strokeWidth={2.6} />
            )}
          </Pressable>
          <View className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/10">
            <View
              className="h-full rounded-full bg-ink"
              style={{ width: `${Math.round(progress * 100)}%` }}
              accessible={false}
            />
          </View>
          {showChromeSkip ? (
            <Pressable
              onPress={withAnalyticsPress(BEHIND_THE_SCENES.chrome.skip, () => {
                // Mid-flow skip keeps whatever they already entered.
                if (phase === 'intro') {
                  skipEntirely();
                  return;
                }
                const items = buildItems();
                void finish({
                  version: DISCLOSURE_VERSION,
                  status: items.length ? 'completed' : 'skipped',
                  matchWeightPreference: matchWeight ?? 'barely',
                  items
                });
              })}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
              className="min-h-[44px] justify-center px-2"
            >
              <Text className="font-sans-sb text-[13px] text-ink-mute">Skip</Text>
            </Pressable>
          ) : (
            // Keep the top bar balanced when Skip is hidden (same width as the link).
            <View className="min-h-[44px] w-12" accessible={false} />
          )}
        </View>

        <ScrollView
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
        >
          {phase === 'intro' ? (
            <IntroCard
              index={introIndex}
              onBodyDeadClick={() =>
                trackDeadClick(BEHIND_THE_SCENES.intro.card_body, {
                  page_index: introIndex
                })
              }
            />
          ) : null}

          {phase === 'conditions' ? (
            <ConditionsStep
              selected={selected}
              onToggle={(key) => {
                trackClick(BEHIND_THE_SCENES.conditions.option, {
                  // condition key only (opaque enum), never free text
                  method: key
                });
                setSelected((prev) => {
                  if (key === 'prefer_not_list') {
                    return prev.includes(key) ? [] : ['prefer_not_list'];
                  }
                  const withoutPrefer = prev.filter((k) => k !== 'prefer_not_list');
                  return withoutPrefer.includes(key)
                    ? withoutPrefer.filter((k) => k !== key)
                    : [...withoutPrefer, key];
                });
              }}
            />
          ) : null}

          {phase === 'other_label' ? (
            <View>
              <Text
                accessibilityRole="header"
                className="font-pixel text-[26px] leading-tight text-ink"
              >
                What would you like to name?
              </Text>
              <Text className="mt-2 font-sans text-[14px] leading-snug text-ink-soft">
                Only if you want. You can leave this blank and still continue.
              </Text>
              <TextInput
                value={otherLabel}
                onChangeText={setOtherLabel}
                placeholder={OTHER_LABEL_PLACEHOLDER}
                placeholderTextColor={c.inkMute}
                accessibilityLabel="Name for something else"
                className="mt-5 min-h-[48px] rounded-2xl border border-ink-line bg-surface px-4 py-3 font-sans text-[16px] text-ink"
              />
            </View>
          ) : null}

          {phase === 'impact' && currentImpactKey ? (
            <ImpactStep
              itemLabel={currentImpactLabel}
              selectedLevel={itemsByKey[currentImpactKey]?.impactLevel}
              contextDraft={contextDraft}
              onSelectLevel={(level) => {
                trackClick(BEHIND_THE_SCENES.impact.option, {
                  method: String(level)
                });
                setItemsByKey((prev) => ({
                  ...prev,
                  [currentImpactKey]: {
                    conditionKey: currentImpactKey,
                    customLabel:
                      currentImpactKey === 'other'
                        ? otherLabel.trim() || undefined
                        : undefined,
                    impactLevel: level,
                    contextNote: prev[currentImpactKey]?.contextNote
                  }
                }));
              }}
              onChangeNote={setContextDraft}
            />
          ) : null}

          {phase === 'match_weight' ? (
            <MatchWeightStep
              selected={matchWeight}
              onSelect={(w) => {
                trackClick(BEHIND_THE_SCENES.match_weight.option, { method: w });
                setMatchWeight(w);
              }}
            />
          ) : null}

          {phase === 'close' ? <CloseStep /> : null}
        </ScrollView>

        {/* Bottom actions */}
        <View className="gap-2 border-t border-ink-line px-5 pb-3 pt-3">
          {phase === 'intro' ? (
            introIndex < INTRO_CARDS.length - 1 ? (
              <ButtonPrimary
                analyticsId={BEHIND_THE_SCENES.intro.next}
                onPress={() => {
                  const next = introIndex + 1;
                  setIntroIndex(next);
                  trackFlowStep('behind_the_scenes', `intro:${next}`, {
                    quiz_id: 'disclosure',
                    page_index: next
                  });
                }}
                accessibilityLabel="Continue"
              >
                Continue
              </ButtonPrimary>
            ) : (
              <>
                <ButtonPrimary
                  analyticsId={BEHIND_THE_SCENES.intro.share}
                  onPress={() => go('conditions', 'conditions')}
                  accessibilityLabel="Share a little"
                >
                  Share a little
                </ButtonPrimary>
                <ButtonSecondary
                  analyticsId={BEHIND_THE_SCENES.intro.skip}
                  onPress={skipEntirely}
                  accessibilityLabel="Skip for now"
                >
                  Skip for now
                </ButtonSecondary>
              </>
            )
          ) : null}

          {phase === 'conditions' ? (
            <ButtonPrimary
              analyticsId={BEHIND_THE_SCENES.conditions.continue}
              onPress={() => {
                if (selected.length === 0) {
                  skipEntirely();
                  return;
                }
                const seed: Partial<
                  Record<DisclosureConditionKey, DisclosureItem>
                > = {};
                for (const key of selected) {
                  seed[key] = { conditionKey: key };
                }
                setItemsByKey(seed);
                beginImpactOrWeight(selected);
              }}
              accessibilityLabel="Continue"
            >
              {selected.length === 0 ? 'Skip for now' : 'Continue'}
            </ButtonPrimary>
          ) : null}

          {phase === 'other_label' ? (
            <ButtonPrimary
              analyticsId={BEHIND_THE_SCENES.other_label.continue}
              onPress={() => {
                setItemsByKey((prev) => ({
                  ...prev,
                  other: {
                    conditionKey: 'other',
                    customLabel: otherLabel.trim() || undefined
                  }
                }));
                const first = impactQueue[0] ?? 'other';
                setImpactIndex(0);
                setContextDraft('');
                go('impact', `impact:${first}`);
              }}
              accessibilityLabel="Continue"
            >
              Continue
            </ButtonPrimary>
          ) : null}

          {phase === 'impact' && currentImpactKey ? (
            <ButtonPrimary
              analyticsId={BEHIND_THE_SCENES.impact.continue}
              disabled={!itemsByKey[currentImpactKey]?.impactLevel}
              onPress={() => {
                // Save optional note (never analytics).
                setItemsByKey((prev) => ({
                  ...prev,
                  [currentImpactKey]: {
                    ...prev[currentImpactKey]!,
                    contextNote: contextDraft.trim() || undefined
                  }
                }));
                trackProduct('quiz_question_answered', {
                  quiz_id: 'disclosure',
                  question_id: `impact:${currentImpactKey}`,
                  option_count: 1,
                  explained: Boolean(contextDraft.trim())
                });
                if (impactIndex + 1 < impactQueue.length) {
                  const nextKey = impactQueue[impactIndex + 1];
                  setImpactIndex((i) => i + 1);
                  setContextDraft('');
                  go('impact', `impact:${nextKey}`);
                  return;
                }
                go('match_weight', 'match_weight');
              }}
              accessibilityLabel="Continue"
            >
              Continue
            </ButtonPrimary>
          ) : null}

          {phase === 'match_weight' ? (
            <ButtonPrimary
              analyticsId={BEHIND_THE_SCENES.match_weight.continue}
              disabled={!matchWeight}
              onPress={() => go('close', 'close')}
              accessibilityLabel="Continue"
            >
              Continue
            </ButtonPrimary>
          ) : null}

          {phase === 'close' ? (
            <ButtonPrimary
              analyticsId={BEHIND_THE_SCENES.close.start_fun}
              onPress={() =>
                void finish({
                  version: DISCLOSURE_VERSION,
                  status: 'completed',
                  matchWeightPreference: matchWeight ?? 'barely',
                  items: buildItems()
                })
              }
              accessibilityLabel={CLOSE_CTA}
            >
              {CLOSE_CTA}
            </ButtonPrimary>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function IntroCard({
  index,
  onBodyDeadClick
}: {
  index: number;
  onBodyDeadClick: () => void;
}) {
  const card = INTRO_CARDS[index];
  const [title, ...rest] = card.lines;
  return (
    <Pressable onPress={onBodyDeadClick} accessibilityRole="text">
      <Text className="font-pixel text-[28px] leading-tight text-ink">{title}</Text>
      {rest.map((line) => (
        <Text
          key={line}
          className="mt-3 font-sans text-[16px] leading-snug text-ink-soft"
        >
          {line.startsWith('people who') ? `· ${line}` : line}
        </Text>
      ))}
    </Pressable>
  );
}

function ConditionsStep({
  selected,
  onToggle
}: {
  selected: DisclosureConditionKey[];
  onToggle: (key: DisclosureConditionKey) => void;
}) {
  return (
    <View>
      <Text
        accessibilityRole="header"
        className="font-pixel text-[26px] leading-tight text-ink"
      >
        {CONDITIONS_PROMPT}
      </Text>
      <Text className="mt-2 font-sans text-[14px] leading-snug text-ink-soft">
        {CONDITIONS_HINT}
      </Text>
      <View className="mt-5 gap-2">
        {CONDITION_OPTIONS.map((opt) => {
          const on = selected.includes(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => onToggle(opt.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={opt.label}
              className={cn(
                'min-h-[48px] justify-center rounded-2xl border px-4 py-3',
                on ? 'border-ink bg-ink' : 'border-ink-line bg-surface'
              )}
            >
              <Text
                className={cn(
                  'font-sans-sb text-[15px]',
                  on ? 'text-canvas' : 'text-ink'
                )}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ImpactStep({
  itemLabel,
  selectedLevel,
  contextDraft,
  onSelectLevel,
  onChangeNote
}: {
  itemLabel: string;
  selectedLevel?: DisclosureImpactLevel;
  contextDraft: string;
  onSelectLevel: (level: DisclosureImpactLevel) => void;
  onChangeNote: (t: string) => void;
}) {
  const c = useThemeColors();
  return (
    <View>
      <Text
        accessibilityRole="header"
        className="font-pixel text-[26px] leading-tight text-ink"
      >
        {impactPrompt(itemLabel)}
      </Text>
      <Text className="mt-2 font-sans text-[14px] leading-snug text-ink-soft">
        {IMPACT_HINT}
      </Text>
      <View className="mt-5 gap-2">
        {IMPACT_OPTIONS.map((opt) => {
          const on = selectedLevel === opt.level;
          return (
            <Pressable
              key={opt.level}
              onPress={() => onSelectLevel(opt.level)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={opt.label}
              className={cn(
                'min-h-[48px] justify-center rounded-2xl border px-4 py-3',
                on ? 'border-ink bg-ink' : 'border-ink-line bg-surface'
              )}
            >
              <Text
                className={cn(
                  'font-sans-sb text-[15px]',
                  on ? 'text-canvas' : 'text-ink'
                )}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-6 font-sans-sb text-[14px] text-ink">
        {CONTEXT_NOTE_PROMPT}
      </Text>
      <TextInput
        value={contextDraft}
        onChangeText={onChangeNote}
        placeholder={CONTEXT_NOTE_PLACEHOLDER}
        placeholderTextColor={c.inkMute}
        multiline
        accessibilityLabel="Optional note for a good match"
        className="mt-2 min-h-[88px] rounded-2xl border border-ink-line bg-surface px-4 py-3 font-sans text-[15px] text-ink"
      />
    </View>
  );
}

function MatchWeightStep({
  selected,
  onSelect
}: {
  selected: DisclosureMatchWeight | null;
  onSelect: (w: DisclosureMatchWeight) => void;
}) {
  return (
    <View>
      <Text
        accessibilityRole="header"
        className="font-pixel text-[26px] leading-tight text-ink"
      >
        {MATCH_WEIGHT_PROMPT}
      </Text>
      <Text className="mt-2 font-sans text-[14px] leading-snug text-ink-soft">
        {MATCH_WEIGHT_HINT}
      </Text>
      <View className="mt-5 gap-2">
        {MATCH_WEIGHT_OPTIONS.map((opt) => {
          const on = selected === opt.weight;
          return (
            <Pressable
              key={opt.weight}
              onPress={() => onSelect(opt.weight)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={opt.label}
              className={cn(
                'min-h-[48px] justify-center rounded-2xl border px-4 py-3',
                on ? 'border-ink bg-ink' : 'border-ink-line bg-surface'
              )}
            >
              <Text
                className={cn(
                  'font-sans-sb text-[15px]',
                  on ? 'text-canvas' : 'text-ink'
                )}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CloseStep() {
  return (
    <View>
      <Text
        accessibilityRole="header"
        className="font-pixel text-[26px] leading-tight text-ink"
      >
        {CLOSE_TITLE}
      </Text>
      <Text className="mt-3 font-sans text-[16px] leading-snug text-ink-soft">
        {CLOSE_BODY}
      </Text>
      <Pressable
        onPress={withAnalyticsPress(BEHIND_THE_SCENES.close.support_link, () => {
          void Linking.openURL(DISCLOSURE_SUPPORT_URL);
        })}
        accessibilityRole="link"
        accessibilityLabel={SUPPORT_LINE}
        className="mt-10 min-h-[44px] justify-center"
      >
        <Text className="font-sans text-[12px] text-ink-mute underline">
          {SUPPORT_LINE}
        </Text>
      </Pressable>
    </View>
  );
}

export default DisclosureFlow;
