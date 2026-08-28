// ============================================
// WHAT THIS FILE DOES (plain English):
// The editable body of your contact card (Phone, Instagram, Email, Website,
// Substack…). Used inside the Messages "Your contact card" dropdown. You
// type values and flip toggles here. Sharing into a thread is a separate
// action on the thread screen — this panel never shows Share contact.
// PRIVACY: analytics never logs phone numbers, handles, or URLs.
// ============================================
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import {
  AtSignIcon,
  GlobeIcon,
  MailIcon,
  NewspaperIcon,
  PhoneIcon
} from 'lucide-react-native';
import { MESSAGES, trackUi, type ContactFieldKind } from '@bridger/shared';
import {
  Avatar,
  Toggle,
  cn,
  useThemeColors
} from '@bridger/ui';
import { useContactCard } from '../../hooks/useContactCard';

const ICON: Record<
  ContactFieldKind,
  React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
> = {
  phone: PhoneIcon,
  instagram: AtSignIcon,
  email: MailIcon,
  website: GlobeIcon,
  substack: NewspaperIcon,
  other: AtSignIcon
};

const TINT: Record<ContactFieldKind, string> = {
  phone: 'bg-[#DFF3E4]',
  instagram: 'bg-[#EDE6FF]',
  email: 'bg-[#FFE1D2]',
  website: 'bg-[#DCEBFF]',
  substack: 'bg-[#FFE8C8]',
  other: 'bg-surface'
};

const ICON_COLOR: Record<ContactFieldKind, string> = {
  phone: '#2FA85B',
  instagram: '#6B2FEA',
  email: '#FF5A1F',
  website: '#1D6FE8',
  substack: '#FF8A00',
  other: '#1A1A1A'
};

const PLACEHOLDER: Record<ContactFieldKind, string> = {
  phone: 'Phone number',
  instagram: '@handle',
  email: 'you@email.com',
  website: 'https://…',
  substack: 'yourname.substack.com',
  other: 'Add a link or handle'
};

/** Editable field list for the Messages contact-card dropdown. */
export function ContactCardPanel() {
  const c = useThemeColors();
  const { card, loading, onToggleField, onUpdateFieldValue } = useContactCard();

  if (loading || !card) {
    return (
      <Text className="px-1 py-3 font-sans-sb text-[14px] text-ink-mute">Loading…</Text>
    );
  }

  return (
    <View className="gap-4 border-t border-ink-line px-1 pb-1 pt-4">
      <View className="flex-row items-center gap-3">
        <Avatar name={card.displayName} emoji={card.emoji} accent="teal" personId="me" size="md" />
        <Text className="min-w-0 flex-1 font-sans-b text-[16px] tracking-tight text-ink">
          {card.displayName}
        </Text>
      </View>

      <View className="gap-3">
        {card.fields.map((f) => {
          const Icon = ICON[f.kind];
          return (
            <View key={f.id} className="min-h-[44px] flex-row items-center gap-3">
              <View
                accessible={false}
                className={cn(
                  'h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  TINT[f.kind]
                )}
              >
                <Icon size={16} color={ICON_COLOR[f.kind]} strokeWidth={2.6} />
              </View>

              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                  {f.label}
                </Text>
                <TextInput
                  value={f.value}
                  onChangeText={(v) => void onUpdateFieldValue(f.id, v)}
                  onFocus={() => trackUi('focus', MESSAGES.contact_card.field_input)}
                  placeholder={PLACEHOLDER[f.kind]}
                  placeholderTextColor={c.inkMute}
                  autoCapitalize={
                    f.kind === 'email' || f.kind === 'website' || f.kind === 'substack'
                      ? 'none'
                      : 'sentences'
                  }
                  autoCorrect={false}
                  keyboardType={
                    f.kind === 'phone'
                      ? 'phone-pad'
                      : f.kind === 'email'
                        ? 'email-address'
                        : f.kind === 'website' || f.kind === 'substack'
                          ? 'url'
                          : 'default'
                  }
                  accessibilityLabel={`${f.label} value`}
                  className="min-h-[28px] py-0 font-sans-sb text-[15px] text-ink"
                  style={{ padding: 0 }}
                />
              </View>

              <Toggle
                checked={f.enabled}
                onChange={(v) => void onToggleField(f.id, v)}
                label={`${f.label} on contact card`}
                analyticsId={MESSAGES.contact_card.field_toggle}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
