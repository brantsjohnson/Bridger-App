// ============================================
// WHAT THIS FILE DOES (plain English):
// Every New-onboarding screen's words, buttons, and save names live here.
// The engine reads this list and paints each step. Change copy here, not
// inside the screen components. No em dashes.
//
// Old 19-step onboarding does not use this file.
// ============================================
import { ONBOARDING } from '@bridger/shared';

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
};

export type OnboardingScreenSpec = {
  key: NewOnboardingStepKey;
  archetype: 'explainer' | 'story' | 'choice' | 'field' | 'privacy-picker';
  /** True = this screen is one of the four profile progress-bar ticks. */
  countsInProgress: boolean;
  chip?: string;
  header: string;
  subheader?: string;
  kicker?: string;
  visualId?: string;
  options?: OnboardingChoiceOption[];
  /** Choice screens: tick many rows. */
  multiSelect?: boolean;
  /** Choice screens: allow Continue with nothing picked (Co-op 6, Product 2). */
  allowEmpty?: boolean;
  /** Story cards: auto-advance after this many ms (skipped under Reduce Motion). */
  autoAdvanceMs?: number;
  saveId?: string;
  primaryCta: CtaSpec;
  secondaryCta?: CtaSpec;
};

/**
 * Every New-onboarding screen key, in walking order.
 * Routing screens (route-*, coop-join, free-1) are only shown via goto().
 * Branch screens (plans / friends / memories / discover) only show if picked.
 */
export type NewOnboardingStepKey =
  | 'first-name'
  | 'last-name'
  | 'photo'
  | 'birthday'
  | 'why-1'
  | 'why-2'
  | 'privacy-1'
  | 'privacy-2'
  | 'privacy-3'
  | 'privacy-4'
  | 'privacy-5'
  | 'privacy-7'
  | 'groups-1'
  | 'groups-2'
  | 'groups-3'
  | 'custom-groups-1'
  | 'coop-1'
  | 'coop-2'
  | 'coop-3'
  | 'coop-4'
  | 'coop-5'
  | 'coop-6'
  | 'route-custom-groups'
  | 'route-vote'
  | 'route-no-ads'
  | 'coop-join'
  | 'free-1'
  | 'product-1'
  | 'product-2'
  | 'plans-1'
  | 'plans-2'
  | 'plans-3'
  | 'friends-1'
  | 'friends-2'
  | 'friends-3'
  | 'memories-1'
  | 'memories-2'
  | 'memories-3'
  | 'memories-4'
  | 'discover-1'
  | 'discover-2'
  | 'discover-3';

/** Screens we never walk into automatically. Jump here with goto(). */
export const ROUTING_ONLY_STEPS: NewOnboardingStepKey[] = [
  'route-custom-groups',
  'route-vote',
  'route-no-ads',
  'coop-join',
  'free-1'
];

/** Help-interest id -> first screen of that tour. */
export const BRANCH_START: Record<string, NewOnboardingStepKey> = {
  see_friends: 'plans-1',
  keep_up: 'friends-1',
  memories: 'memories-1',
  meet_people: 'discover-1'
};

/** Help-interest order after Product 2. */
export const BRANCH_ORDER = [
  'see_friends',
  'keep_up',
  'memories',
  'meet_people'
] as const;

/** Which branch a step belongs to (so we skip unselected tours). */
export const STEP_BRANCH: Partial<Record<NewOnboardingStepKey, string>> = {
  'plans-1': 'see_friends',
  'plans-2': 'see_friends',
  'plans-3': 'see_friends',
  'friends-1': 'keep_up',
  'friends-2': 'keep_up',
  'friends-3': 'keep_up',
  'memories-1': 'memories',
  'memories-2': 'memories',
  'memories-3': 'memories',
  'memories-4': 'memories',
  'discover-1': 'meet_people',
  'discover-2': 'meet_people',
  'discover-3': 'meet_people'
};

/** Optional Home route after a branch finishes (opened once on Home). */
export const BRANCH_DEEP_LINK: Record<string, string> = {
  see_friends: '/(tabs)/events',
  keep_up: '/(tabs)/friends',
  memories: '/story/capture',
  meet_people: '/(tabs)/discover'
};

function next(label: string, analyticsId: string): CtaSpec {
  return { label, analyticsId, action: { kind: 'next' } };
}

function saveNext(label: string, analyticsId: string): CtaSpec {
  return { label, analyticsId, action: { kind: 'save-next' } };
}

function goto(
  label: string,
  analyticsId: string,
  step: NewOnboardingStepKey
): CtaSpec {
  return { label, analyticsId, action: { kind: 'goto', step } };
}

function nextBranch(label: string, analyticsId: string): CtaSpec {
  return { label, analyticsId, action: { kind: 'next-branch' } };
}

/** The full New onboarding copy deck. */
export const NEW_ONBOARDING_SCREENS: OnboardingScreenSpec[] = [
  {
    key: 'first-name',
    archetype: 'field',
    countsInProgress: true,
    header: 'First name',
    subheader: 'Enter your first name.',
    saveId: 'name-first',
    primaryCta: saveNext('Add my first name', ONBOARDING.name.first_next)
  },
  {
    key: 'last-name',
    archetype: 'field',
    countsInProgress: true,
    header: 'Last name',
    subheader: 'Enter your last name.',
    saveId: 'name',
    primaryCta: saveNext('Add my last name', ONBOARDING.name.last_next)
  },
  {
    key: 'photo',
    archetype: 'field',
    countsInProgress: true,
    header: 'Add a profile photo.',
    subheader: 'Choose a photo your friends will recognize.',
    saveId: 'photo',
    primaryCta: saveNext('Choose my photo', ONBOARDING.confirm_profile.photo_square),
    secondaryCta: {
      label: 'Add one later',
      analyticsId: ONBOARDING.confirm_profile.photo_skip,
      action: { kind: 'skip' }
    }
  },
  {
    key: 'birthday',
    archetype: 'field',
    countsInProgress: true,
    header: 'When is your birthday?',
    subheader: 'You can choose who sees it.',
    saveId: 'birthday',
    primaryCta: saveNext('Add my birthday', ONBOARDING.name.birthday_next)
  },
  {
    key: 'why-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Keeping up with people is harder than it should be.',
    subheader:
      'Social media, texts, group chats, photos, plans, and everything else are spread across different places.',
    visualId: 'fragmented-life',
    primaryCta: next('What would work better?', ONBOARDING.why.next_1)
  },
  {
    key: 'why-2',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Bridger puts your social life in one place.',
    subheader:
      'Think of it like a Swiss Army knife for staying close to people, with plans, memories, profiles, introductions, and more.',
    visualId: 'swiss-knife',
    primaryCta: next('How does Bridger work?', ONBOARDING.why.next_2)
  },
  {
    key: 'privacy-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'You choose who sees what.',
    subheader: 'Bridger does not automatically show everything about you to everyone.',
    visualId: 'birthday-groups',
    primaryCta: next('Show me how', ONBOARDING.privacy.next_1)
  },
  {
    key: 'privacy-2',
    archetype: 'explainer',
    countsInProgress: false,
    header: "Let's use your birthday as an example.",
    subheader: 'You can decide which group is allowed to see it.',
    visualId: 'birthday-field-with-audience',
    primaryCta: next('Choose who can see it', ONBOARDING.privacy.next_2)
  },
  {
    key: 'privacy-3',
    archetype: 'privacy-picker',
    countsInProgress: false,
    header: 'Who can see your birthday?',
    subheader: 'Choose the broadest group you are comfortable sharing it with.',
    visualId: 'nested-visibility',
    saveId: 'birthday-audience',
    options: [
      {
        id: 'close',
        label: 'Close Friends',
        sublabel: 'About 5 to 25 people'
      },
      {
        id: 'friend',
        label: 'Friends',
        sublabel: 'People you know and stay in touch with'
      },
      {
        id: 'acquaintance',
        label: 'Acquaintances',
        sublabel: 'People you know more casually'
      }
    ],
    primaryCta: saveNext('Save birthday privacy', ONBOARDING.privacy.save_audience)
  },
  {
    key: 'privacy-4',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Your birthday is visible to that group and the groups closer to you.',
    subheader: 'For example, if you choose Friends, your Close Friends can see it too.',
    visualId: 'nested-visibility',
    primaryCta: next('Can I update this later?', ONBOARDING.privacy.next_4)
  },
  {
    key: 'privacy-5',
    archetype: 'story',
    countsInProgress: false,
    header: 'Yes. You can update it anytime.',
    subheader: 'Change who can see your birthday whenever you want.',
    visualId: 'audience-toggle-anim',
    autoAdvanceMs: 4200,
    primaryCta: next('Great, I can update this anytime', ONBOARDING.privacy.next_5)
  },
  {
    key: 'privacy-7',
    archetype: 'story',
    countsInProgress: false,
    header: 'You will choose privacy for other parts of your profile too.',
    subheader:
      'Your birthday is just one example. You can decide who sees your favorite things, personal answers, memories, and more.',
    visualId: 'fields-with-groups',
    autoAdvanceMs: 4800,
    primaryCta: next('Show me what Bridger can do', ONBOARDING.privacy.next_7)
  },
  {
    key: 'groups-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Bridger has three default groups.',
    subheader: 'You can place people in the group that best matches how close you are.',
    visualId: 'birthday-groups',
    primaryCta: next('How will I use these groups?', ONBOARDING.groups.next_1)
  },
  {
    key: 'groups-2',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Groups help you share at the right level.',
    subheader:
      'When you add someone, you choose which group they belong to. That helps Bridger know what they can see.',
    visualId: 'nested-visibility',
    primaryCta: next('Can I change someone\'s group later?', ONBOARDING.groups.next_2)
  },
  {
    key: 'groups-3',
    archetype: 'story',
    countsInProgress: false,
    header: 'Yes. You can update groups anytime.',
    subheader: 'Move someone to a different group whenever your relationship changes.',
    visualId: 'audience-toggle-anim',
    autoAdvanceMs: 4000,
    primaryCta: next('Great, I can update groups anytime', ONBOARDING.groups.next_3)
  },
  {
    key: 'custom-groups-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Need more than three groups?',
    subheader:
      'Members can create custom groups for family, roommates, coworkers, teammates, or anyone else.',
    visualId: 'default-plus-custom',
    primaryCta: goto(
      'What does membership include?',
      ONBOARDING.custom_groups.to_coop,
      'coop-1'
    ),
    secondaryCta: goto(
      'How do I create a group?',
      ONBOARDING.custom_groups.member_interest,
      'coop-1'
    )
  },
  {
    key: 'coop-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Bridger does not make money from ads.',
    subheader: 'Advertisers do not pay Bridger to keep you watching or scrolling.',
    visualId: 'ads-vs-friends',
    primaryCta: next('Then who pays for Bridger?', ONBOARDING.coop.next_1)
  },
  {
    key: 'coop-2',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Bridger is funded by its members.',
    subheader: 'People can pay to become members instead of Bridger relying on advertisers.',
    visualId: 'members-fund',
    primaryCta: next('What does a member get?', ONBOARDING.coop.next_2)
  },
  {
    key: 'coop-3',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Members also help own Bridger.',
    subheader: 'A business owned by its members is called a co-op.',
    visualId: 'members-own',
    primaryCta: next('What does owning it mean?', ONBOARDING.coop.next_3)
  },
  {
    key: 'coop-4',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Members get a say in what Bridger becomes.',
    subheader:
      'Members can vote on important decisions instead of leaving every decision to advertisers or outside investors.',
    visualId: 'member-vote-card',
    primaryCta: next('What else comes with membership?', ONBOARDING.coop.next_4)
  },
  {
    key: 'coop-5',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Membership can unlock more control and more benefits.',
    subheader:
      'For example, members can create custom groups and participate in member decisions.',
    visualId: 'benefit-tray',
    primaryCta: next('Which benefits matter to me?', ONBOARDING.coop.next_5)
  },
  {
    key: 'coop-6',
    archetype: 'choice',
    countsInProgress: false,
    header: 'What would make membership worth it to you?',
    subheader: 'Choose anything you care about.',
    kicker: 'Pick any that apply',
    multiSelect: true,
    allowEmpty: true,
    saveId: 'membership-interests',
    options: [
      { id: 'no_ads', label: 'No ads' },
      { id: 'vote', label: 'Having a vote' },
      { id: 'custom_groups', label: 'Custom groups' },
      { id: 'independent', label: 'Helping keep Bridger independent' },
      { id: 'member_features', label: 'Member-only features' }
    ],
    primaryCta: saveNext('Save what matters to me', ONBOARDING.coop.save_interests)
  },
  {
    key: 'route-custom-groups',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Want to create your first custom group?',
    subheader: 'Custom groups are included with Bridger membership.',
    visualId: 'default-plus-custom',
    primaryCta: goto(
      'Create one with membership',
      ONBOARDING.route.custom_groups_join,
      'coop-join'
    ),
    secondaryCta: goto(
      'What if I want to use Bridger for free?',
      ONBOARDING.route.custom_groups_free,
      'free-1'
    )
  },
  {
    key: 'route-vote',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Want a vote in Bridger?',
    subheader: 'Voting is available to co-op members.',
    visualId: 'member-vote-card',
    primaryCta: goto(
      'Show me how to become a member',
      ONBOARDING.route.vote_join,
      'coop-join'
    ),
    secondaryCta: goto(
      'Can I decide later?',
      ONBOARDING.route.vote_later,
      'product-1'
    )
  },
  {
    key: 'route-no-ads',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'There are two ways to use Bridger without ads.',
    subheader:
      'You can support Bridger as a member, or help Bridger grow by inviting three friends.',
    visualId: 'ads-vs-friends',
    primaryCta: goto(
      'How does membership work?',
      ONBOARDING.route.no_ads_join,
      'coop-join'
    ),
    secondaryCta: goto(
      'Choose 3 friends to invite',
      ONBOARDING.route.no_ads_invite,
      'free-1'
    )
  },
  {
    key: 'coop-join',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Join the co-op',
    subheader: 'Membership is optional. You can keep using Bridger for free.',
    primaryCta: {
      label: 'Join the co-op',
      analyticsId: ONBOARDING.coop.join_paid,
      action: { kind: 'finish' }
    },
    secondaryCta: goto(
      'Use Bridger free',
      ONBOARDING.coop.skip_to_product,
      'product-1'
    )
  },
  {
    key: 'free-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'You can unlock Bridger by bringing 3 friends.',
    subheader:
      'Instead of paying for membership, invite three people you actually want on Bridger.',
    visualId: 'default-plus-custom',
    primaryCta: goto(
      'Choose my 3 friends',
      ONBOARDING.free.choose_friends,
      'free-1'
    ),
    secondaryCta: goto('Continue', ONBOARDING.free.continue, 'product-1')
  },
  {
    key: 'product-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Bridger gives you tools for staying close to people.',
    subheader:
      'Think of it like a group chat on steroids, with the other things friendship needs built in too.',
    visualId: 'group-chat-expands',
    primaryCta: next('What could Bridger help me with?', ONBOARDING.product.next_1)
  },
  {
    key: 'product-2',
    archetype: 'choice',
    countsInProgress: false,
    header: 'What would make staying close easier for you?',
    subheader: 'Choose anything you would actually use.',
    kicker: 'Pick any that apply',
    multiSelect: true,
    allowEmpty: true,
    saveId: 'help-interests',
    options: [
      { id: 'see_friends', label: 'See my friends more' },
      { id: 'keep_up', label: 'Keep up with my friends' },
      { id: 'memories', label: 'Save our memories' },
      { id: 'meet_people', label: 'Meet more people' }
    ],
    primaryCta: saveNext('Show me the things I picked', ONBOARDING.product.save_help)
  },
  {
    key: 'plans-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Sometimes everyone wants to hang out, but nobody knows who is free.',
    subheader: 'Bridger can make that easier without another round of group-chat messages.',
    visualId: 'plans-availability',
    primaryCta: next('How does Bridger solve that?', ONBOARDING.plans.next_1)
  },
  {
    key: 'plans-2',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Tell your friends when you want to hang out.',
    subheader:
      'They can share their availability too, so everyone can see when plans might work.',
    visualId: 'plans-availability',
    primaryCta: next("Set when I'm free", ONBOARDING.plans.next_2)
  },
  {
    key: 'plans-3',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Bridger calls this Touch Grass.',
    subheader:
      'It helps turn "we should hang out sometime" into an actual time to see each other.',
    visualId: 'touch-grass',
    primaryCta: nextBranch(
      'What else can help me see friends more?',
      ONBOARDING.plans.branch_next
    )
  },
  {
    key: 'friends-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'There is a lot to remember about the people you care about.',
    subheader:
      'Birthdays, favorite things, life updates, plans, inside jokes, and little details can be easy to lose.',
    visualId: 'friend-notes',
    primaryCta: next('Where does Bridger keep this?', ONBOARDING.friendsb.next_1)
  },
  {
    key: 'friends-2',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Each friend has a place for the things you want to remember.',
    subheader:
      'Some information comes from their profile, and some can be private notes that only you see.',
    visualId: 'friend-notes',
    primaryCta: next('What can I save privately?', ONBOARDING.friendsb.next_2)
  },
  {
    key: 'friends-3',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Save anything that helps you show up for them.',
    subheader:
      'A gift idea, something they told you, an important date, or anything else you do not want to forget.',
    visualId: 'friend-notes',
    primaryCta: nextBranch(
      'Add something about a friend',
      ONBOARDING.friendsb.branch_next
    )
  },
  {
    key: 'memories-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Your memories are usually scattered across different apps.',
    subheader:
      'Photos are in your camera roll, places are in maps, conversations are in texts, and moments disappear down feeds.',
    visualId: 'scattered-memories',
    primaryCta: next('What does Bridger do with them?', ONBOARDING.memories.next_1)
  },
  {
    key: 'memories-2',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Bridger can turn those pieces into a page from your life.',
    subheader:
      'A page can collect the people, places, photos, jokes, and details that made the moment yours.',
    visualId: 'scrapbook-page',
    primaryCta: next('What can I put on a page?', ONBOARDING.memories.next_2)
  },
  {
    key: 'memories-3',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'A page can hold almost anything from the moment.',
    subheader:
      'Add photos, videos, people, places, maps, captions, stickers, inside jokes, and other details.',
    visualId: 'scrapbook-page',
    primaryCta: next(
      'Do I have to build every page myself?',
      ONBOARDING.memories.next_3
    )
  },
  {
    key: 'memories-4',
    archetype: 'choice',
    countsInProgress: false,
    header: 'No. You can make the page yourself or let Bridger help.',
    subheader:
      'Bridger can organize the pieces for you, or you can control every detail when you want to.',
    multiSelect: false,
    saveId: 'page-authoring',
    options: [
      { id: 'auto', label: 'Make pages for me' },
      { id: 'manual', label: 'I want to design them' },
      { id: 'assist', label: 'Help me when I ask' }
    ],
    primaryCta: {
      label: 'Start a page',
      analyticsId: ONBOARDING.memories.branch_next,
      action: { kind: 'next-branch' }
    }
  },
  {
    key: 'discover-1',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Your friends already know people you might get along with.',
    subheader: 'Bridger helps you meet people through those existing relationships.',
    visualId: 'friends-of-friends',
    primaryCta: next('Who would Bridger show me?', ONBOARDING.discover.next_1)
  },
  {
    key: 'discover-2',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'Friends of friends, not random strangers.',
    subheader:
      'Bridger only helps you discover people who are already connected to someone you know.',
    visualId: 'friends-of-friends',
    primaryCta: next('How would I meet them?', ONBOARDING.discover.next_2)
  },
  {
    key: 'discover-3',
    archetype: 'explainer',
    countsInProgress: false,
    header: 'You can explore people yourself or let Bridger suggest someone.',
    subheader: 'Either way, the connection starts through someone you already know.',
    visualId: 'friends-of-friends',
    primaryCta: nextBranch(
      'Suggest someone for me',
      ONBOARDING.discover.branch_suggest
    ),
    secondaryCta: nextBranch('Let me look around', ONBOARDING.discover.branch_browse)
  }
];

export const NEW_ONBOARDING_ORDER: NewOnboardingStepKey[] =
  NEW_ONBOARDING_SCREENS.map((s) => s.key);

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
