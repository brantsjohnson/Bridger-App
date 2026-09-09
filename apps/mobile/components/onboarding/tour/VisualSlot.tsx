// ============================================
// WHAT THIS FILE DOES (plain English):
// A labeled picture box for New onboarding. Each screen names a visualId.
// For now this is a simple placeholder so the story can ship. A later pass
// will replace these with Magic Patterns art.
//
// ACCESSIBILITY: the box is not tappable on purpose. Taps log dead_click so
// we can see if people expected the picture to do something.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion } from '@bridger/ui';
import { OB, OB_BORDER } from '../onboarding-theme';

/** Which dead-click id to stamp, based on the visual family. */
function visualAnalyticsId(visualId: string): string {
  if (visualId.startsWith('birthday') || visualId.includes('audience') || visualId.includes('nested') || visualId.includes('fields')) {
    return ONBOARDING.privacy.visual;
  }
  if (visualId.includes('group-chat')) return ONBOARDING.product.visual;
  if (visualId === 'default-plus-custom') {
    return ONBOARDING.custom_groups.visual;
  }
  if (visualId.includes('group')) {
    return ONBOARDING.groups.visual;
  }
  if (visualId.startsWith('ads') || visualId.startsWith('member') || visualId === 'benefit-tray') {
    return ONBOARDING.coop.visual;
  }
  if (visualId.startsWith('plans') || visualId === 'touch-grass') {
    return ONBOARDING.plans.visual;
  }
  if (visualId.includes('friend-notes')) return ONBOARDING.friendsb.visual;
  if (visualId.includes('scrapbook') || visualId.includes('memories')) {
    return ONBOARDING.memories.visual;
  }
  if (visualId.includes('friends-of-friends')) return ONBOARDING.discover.visual;
  if (visualId === 'fragmented-life' || visualId === 'swiss-knife') {
    return ONBOARDING.why.visual;
  }
  return ONBOARDING.why.visual;
}

const LABELS: Record<string, { emoji: string; title: string }> = {
  'fragmented-life': { emoji: '📱', title: 'Life split across apps' },
  'swiss-knife': { emoji: '🛠️', title: 'One toolkit for friends' },
  'birthday-groups': { emoji: '🎂', title: 'Birthday, by group' },
  'birthday-field-with-audience': { emoji: '🎂', title: 'Who can see it' },
  'nested-visibility': { emoji: '◎', title: 'Closer groups can see it too' },
  'audience-toggle-anim': { emoji: '🔄', title: 'Change it anytime' },
  'fields-with-groups': { emoji: '📋', title: 'More fields, same groups' },
  'default-plus-custom': { emoji: '＋', title: 'Custom groups for members' },
  'ads-vs-friends': { emoji: '🚫', title: 'Friends, not ads' },
  'members-fund': { emoji: '🤝', title: 'Members fund Bridger' },
  'members-own': { emoji: '🏠', title: 'Members own Bridger' },
  'member-vote-card': { emoji: '🗳️', title: 'Members get a vote' },
  'benefit-tray': { emoji: '✨', title: 'Member benefits' },
  'group-chat-expands': { emoji: '💬', title: 'Group chat, plus more' },
  'plans-availability': { emoji: '📅', title: 'When you are free' },
  'touch-grass': { emoji: '🌱', title: 'Touch Grass' },
  'friend-notes': { emoji: '📝', title: 'Private notes on a friend' },
  'scattered-memories': { emoji: '📸', title: 'Memories in many apps' },
  'scrapbook-page': { emoji: '📖', title: 'A page from your life' },
  'friends-of-friends': { emoji: '👥', title: 'Friends of friends' }
};

export function VisualSlot({
  visualId,
  caption
}: {
  visualId?: string;
  /** Extra line, e.g. the group they just picked. Never a name or phone. */
  caption?: string;
}) {
  if (!visualId) return null;
  const copy = LABELS[visualId] ?? { emoji: '✦', title: visualId.replace(/-/g, ' ') };

  return (
    <AnalyticsRegion
      analyticsId={visualAnalyticsId(visualId)}
      interactive={false}
    >
      <View
        // TODO: replace with Magic Patterns visual {visualId}
        accessible
        accessibilityRole="image"
        accessibilityLabel={caption ? `${copy.title}. ${caption}` : copy.title}
        style={{
          minHeight: 140,
          borderWidth: OB_BORDER,
          borderColor: OB.navy,
          backgroundColor: OB.paper,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          gap: 8
        }}
      >
        <Text style={{ fontSize: 36 }}>{copy.emoji}</Text>
        <Text
          className="font-sans-b text-[15px]"
          style={{ color: OB.navy, textAlign: 'center' }}
        >
          {copy.title}
        </Text>
        {caption ? (
          <Text
            className="font-sans-sb text-[13px]"
            style={{ color: OB.navy, opacity: 0.75, textAlign: 'center' }}
          >
            {caption}
          </Text>
        ) : null}
      </View>
    </AnalyticsRegion>
  );
}
