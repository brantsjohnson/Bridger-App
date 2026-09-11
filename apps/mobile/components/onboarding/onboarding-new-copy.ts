// ============================================
// WHAT THIS FILE DOES (plain English):
// Every New-onboarding screen's words, buttons, and save names live here.
// The engine reads this list and paints each step. Change copy here, not
// inside the screen components. No em dashes.
//
// Old 19-step onboarding does not use this file.
// Magic Patterns wins for layouts, flow order, and new graphics.
// ============================================
import { ONBOARDING } from '@bridger/shared';
import {
  FEATURES,
  INFO,
  type NewConcept
} from './onboarding-new-flow';

/** What a Continue / secondary button should do. */
export type CtaAction =
  | { kind: 'next' }
  | { kind: 'skip' }
  | { kind: 'save-next' }
  | { kind: 'goto'; step: NewOnboardingStepKey }
  | { kind: 'next-branch' }
  | { kind: 'finish' }
  | { kind: 'finish-open'; route: string };

export type CtaSpec = {
  label: string;
  analyticsId: string;
  action: CtaAction;
};

export type OnboardingChoiceOption = {
  id: string;
  label: string;
  sublabel?: string;
  emoji?: string;
};

export type OnboardingScreenSpec = {
  key: NewOnboardingStepKey;
  archetype:
    | 'explainer'
    | 'story'
    | 'choice'
    | 'field'
    | 'privacy-picker'
    | 'arrival';
  /** True = this screen is one of the six required progress-bar ticks. */
  countsInProgress: boolean;
  tone: 'action' | 'info';
  concept: NewConcept;
  chip?: string;
  header: string;
  subheader?: string;
  kicker?: string;
  visualId?: string;
  infoNote?: { label: string; body: string };
  ctaNote?: string;
  options?: OnboardingChoiceOption[];
  multiSelect?: boolean;
  allowEmpty?: boolean;
  autoAdvanceMs?: number;
  saveId?: string;
  primaryCta: CtaSpec;
  secondaryCta?: CtaSpec;
};

export type NewOnboardingStepKey =
  | 'name'
  | 'photo'
  | 'birthday'
  | 'why-scattered'
  | 'why-together'
  | 'privacy-choose'
  | 'privacy-control'
  | 'privacy-birthday'
  | 'product-picks'
  | 'feature-plans'
  | 'feature-keep-up'
  | 'feature-memories'
  | 'feature-new-friends'
  | 'feature-things-to-do'
  | 'feature-birthdays'
  | 'feature-events'
  | 'feature-dates'
  | 'feature-likes'
  | 'feature-groups'
  | 'coop-what'
  | 'coop-no-ads'
  | 'coop-who-pays'
  | 'coop-say'
  | 'coop-benefits'
  | 'coop-matters'
  | 'coop-join'
  | 'welcome-in'
  | 'coop-support'
  | 'coop-early';

/** Screens we never walk into automatically. Jump here with goto(). */
export const ROUTING_ONLY_STEPS: NewOnboardingStepKey[] = [
  'coop-support',
  'coop-early',
  // Kept for resume only. New last screen is coop-join.
  'welcome-in'
];

/** Feature-tour id -> first (and only) screen of that tour. */
export const BRANCH_START: Record<string, NewOnboardingStepKey> = {
  plans: 'feature-plans',
  'keep-up': 'feature-keep-up',
  memories: 'feature-memories',
  'new-friends': 'feature-new-friends',
  'things-to-do': 'feature-things-to-do',
  birthdays: 'feature-birthdays',
  events: 'feature-events',
  dates: 'feature-dates',
  likes: 'feature-likes',
  groups: 'feature-groups'
};

/** Help-interest order after Product picks. Matches FEATURES. */
export const BRANCH_ORDER = FEATURES.map((f) => f.id);

/** Which feature a step belongs to (so we skip unselected tours). */
export const STEP_BRANCH: Partial<Record<NewOnboardingStepKey, string>> = {
  'feature-plans': 'plans',
  'feature-keep-up': 'keep-up',
  'feature-memories': 'memories',
  'feature-new-friends': 'new-friends',
  'feature-things-to-do': 'things-to-do',
  'feature-birthdays': 'birthdays',
  'feature-events': 'events',
  'feature-dates': 'dates',
  'feature-likes': 'likes',
  'feature-groups': 'groups'
};

/** Optional Home route after a feature tour (opened once on Home). */
export const BRANCH_DEEP_LINK: Record<string, string> = {
  plans: '/(tabs)/events',
  'keep-up': '/(tabs)/friends',
  memories: '/story/capture',
  'new-friends': '/(tabs)/discover',
  'things-to-do': '/(tabs)/events',
  birthdays: '/(tabs)/home',
  events: '/(tabs)/events',
  dates: '/(tabs)/friends',
  likes: '/(tabs)/friends',
  groups: '/(tabs)/friends'
};

function next(label: string, analyticsId: string): CtaSpec {
  return { label, analyticsId, action: { kind: 'next' } };
}

function saveNext(label: string, analyticsId: string): CtaSpec {
  return { label, analyticsId, action: { kind: 'save-next' } };
}

function finish(label: string, analyticsId: string): CtaSpec {
  return { label, analyticsId, action: { kind: 'finish' } };
}

const FEATURE_ANALYTICS: Record<string, string> = {
  plans: ONBOARDING.plans.branch_next,
  'keep-up': ONBOARDING.friendsb.branch_next,
  memories: ONBOARDING.memories.branch_next,
  'new-friends': ONBOARDING.discover.branch_suggest,
  'things-to-do': ONBOARDING.product.feature_next,
  birthdays: ONBOARDING.product.feature_next,
  events: ONBOARDING.product.feature_next,
  dates: ONBOARDING.product.feature_next,
  likes: ONBOARDING.product.feature_next,
  groups: ONBOARDING.product.feature_next
};

function featureScreen(id: string): OnboardingScreenSpec {
  const f = FEATURES.find((x) => x.id === id)!;
  const lastId = FEATURES[FEATURES.length - 1]!.id;
  return {
    key: BRANCH_START[id]!,
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'product',
    header: f.header,
    subheader: f.sub,
    visualId: `feature-${f.visual}`,
    infoNote: f.info,
    primaryCta: next(
      id === lastId ? 'Why is Bridger different? →' : 'Keep going →',
      FEATURE_ANALYTICS[id] ?? ONBOARDING.product.feature_next
    )
  };
}

/** The full New onboarding copy deck, in walk order. */
export const NEW_ONBOARDING_SCREENS: OnboardingScreenSpec[] = [
  {
    key: 'name',
    archetype: 'field',
    countsInProgress: true,
    tone: 'action',
    concept: 'basics',
    header: "What's your name?",
    saveId: 'name',
    primaryCta: saveNext('Save name →', ONBOARDING.name.first_next)
  },
  {
    key: 'photo',
    archetype: 'field',
    countsInProgress: true,
    tone: 'action',
    concept: 'basics',
    header: 'Add a profile pic',
    subheader: "It doesn't need to be perfect. Take a selfie. Be you.",
    saveId: 'photo',
    primaryCta: saveNext('Save photo →', ONBOARDING.confirm_profile.photo_square)
  },
  {
    key: 'birthday',
    archetype: 'field',
    countsInProgress: true,
    tone: 'action',
    concept: 'basics',
    chip: 'Friends love a heads-up.',
    header: "When's your birthday?",
    saveId: 'birthday',
    primaryCta: saveNext("Yes, that's right →", ONBOARDING.name.birthday_next)
  },
  {
    key: 'why-scattered',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'why',
    header: 'Technology is bad at keeping us in contact.',
    subheader:
      'Everything is scattered across multiple apps. No wonder we forget things and feel like bad friends.',
    visualId: 'why-scattered',
    primaryCta: next("There's a better way →", ONBOARDING.why.next_1)
  },
  {
    key: 'why-together',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'why',
    header: 'Bridger brings it together.',
    subheader: 'One place to help you actually keep up with people.',
    visualId: 'why-together',
    primaryCta: next('How? →', ONBOARDING.why.next_2)
  },
  {
    key: 'privacy-choose',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'privacy',
    header: 'You control what people see.',
    visualId: 'privacy-mapping',
    infoNote: { label: 'How privacy works', body: INFO.privacy },
    primaryCta: next('What does that look like? →', ONBOARDING.privacy.next_1)
  },
  {
    key: 'privacy-control',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'privacy',
    header: 'Two friends, two different profiles.',
    subheader: 'Same page. Everyone sees only their part of it.',
    visualId: 'privacy-two-profiles',
    primaryCta: next('Set my birthday →', ONBOARDING.privacy.next_2)
  },
  {
    key: 'privacy-birthday',
    archetype: 'privacy-picker',
    countsInProgress: true,
    tone: 'action',
    concept: 'privacy',
    header: 'Who will be able to see your birthday?',
    visualId: undefined,
    saveId: 'birthday-audience',
    ctaNote: 'You can change this anytime.',
    options: [
      { id: 'none', label: 'Only Me', sublabel: 'Kept to yourself' },
      { id: 'close', label: 'Close Friends', sublabel: 'The handful you tell everything' },
      { id: 'friend', label: 'Friends', sublabel: 'People you actually know' },
      {
        id: 'acquaintance',
        label: 'Acquaintances',
        sublabel: 'Everyone you have added'
      }
    ],
    primaryCta: saveNext('What can Bridger do? →', ONBOARDING.privacy.save_audience)
  },
  {
    key: 'product-picks',
    archetype: 'choice',
    countsInProgress: true,
    tone: 'action',
    concept: 'product',
    header: 'What do you want Bridger to help you with?',
    subheader: 'Choose anything you would actually use.',
    multiSelect: true,
    allowEmpty: false,
    saveId: 'help-interests',
    options: FEATURES.map((f) => ({
      id: f.id,
      label: f.chip,
      emoji: f.emoji
    })),
    primaryCta: saveNext('Show me my picks →', ONBOARDING.product.save_help)
  },
  ...FEATURES.map((f) => featureScreen(f.id)),
  {
    key: 'coop-what',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'coop',
    header: 'Bridger is a co-op.',
    subheader: 'A co-op is owned by the people who use it.',
    visualId: 'coop-what',
    infoNote: { label: 'More about co-ops', body: INFO.coops },
    primaryCta: next("So what's different? →", ONBOARDING.coop.next_3)
  },
  {
    key: 'coop-no-ads',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'coop',
    header: 'No ads.',
    subheader: "Your attention isn't the product.",
    visualId: 'coop-no-ads',
    infoNote: { label: 'Why no ads?', body: INFO.noAds },
    primaryCta: next('Then who pays? →', ONBOARDING.coop.next_1)
  },
  {
    key: 'coop-who-pays',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'coop',
    header: 'Members fund Bridger.',
    subheader: 'They can help own it too.',
    visualId: 'coop-who-pays',
    primaryCta: next('What does that get me? →', ONBOARDING.coop.next_2)
  },
  {
    key: 'coop-say',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'coop',
    header: 'Members get a say.',
    visualId: 'coop-say',
    primaryCta: next('See member benefits →', ONBOARDING.coop.next_4)
  },
  {
    key: 'coop-benefits',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'coop',
    header: 'Members get more.',
    visualId: 'coop-benefits',
    primaryCta: next('What matters to me? →', ONBOARDING.coop.next_5)
  },
  {
    key: 'coop-matters',
    archetype: 'choice',
    countsInProgress: true,
    tone: 'action',
    concept: 'coop',
    header: 'What matters to you?',
    subheader: 'Choose anything you care about.',
    multiSelect: true,
    allowEmpty: true,
    saveId: 'membership-interests',
    options: [
      { id: 'no_ads', label: 'No ads' },
      { id: 'vote', label: 'Voting' },
      { id: 'custom_groups', label: 'Custom groups' },
      { id: 'independent', label: 'Keeping Bridger independent' },
      { id: 'member_features', label: 'More features' }
    ],
    primaryCta: saveNext('Save my choices →', ONBOARDING.coop.save_interests)
  },
  {
    key: 'coop-join',
    archetype: 'arrival',
    countsInProgress: false,
    tone: 'action',
    concept: 'coop',
    header: "Join the co-op and don't be the product",
    subheader: 'Monthly or yearly. Apple Pay, Google Pay, or a card. Or invite 3 friends.',
    primaryCta: finish('Join the co-op', ONBOARDING.coop.join_paid)
  },
  {
    key: 'welcome-in',
    archetype: 'arrival',
    countsInProgress: false,
    tone: 'info',
    concept: 'arrival',
    header: "You're in.",
    subheader: 'No feed to scroll. Just the people you actually know.',
    primaryCta: finish("Let's go", ONBOARDING.welcome_in.lets_go)
  },
  {
    key: 'coop-support',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'coop',
    header: 'Priority support',
    visualId: 'coop-support',
    primaryCta: {
      label: 'Back to benefits →',
      analyticsId: ONBOARDING.coop.benefit_support,
      action: { kind: 'goto', step: 'coop-benefits' }
    }
  },
  {
    key: 'coop-early',
    archetype: 'explainer',
    countsInProgress: false,
    tone: 'info',
    concept: 'coop',
    header: 'Early access to new features',
    visualId: 'coop-early',
    primaryCta: {
      label: 'Back to benefits →',
      analyticsId: ONBOARDING.coop.benefit_early,
      action: { kind: 'goto', step: 'coop-benefits' }
    }
  }
];

export const NEW_ONBOARDING_ORDER: NewOnboardingStepKey[] =
  NEW_ONBOARDING_SCREENS.map((s) => s.key).filter(
    (k) => !ROUTING_ONLY_STEPS.includes(k)
  );

export const NEW_ONBOARDING_BY_KEY: Record<
  NewOnboardingStepKey,
  OnboardingScreenSpec
> = NEW_ONBOARDING_SCREENS.reduce(
  (acc, spec) => {
    acc[spec.key] = spec;
    return acc;
  },
  {} as Record<NewOnboardingStepKey, OnboardingScreenSpec>
);
