// ============================================
// WHAT THIS FILE DOES (plain English):
// Your contact card — set up once, share anytime. Pick which fields (phone,
// Instagram, email) are on the card. Share contact in a thread sends only the
// fields you enabled. PRIVACY: nothing leaves until you tap Share.
// ============================================
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { AtSignIcon, MailIcon, PhoneIcon } from 'lucide-react-native';
import { MESSAGES } from '@bridger/shared';
import {
  AnalyticsRegion,
  Avatar,
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader,
  Toggle,
  cn
} from '@bridger/ui';
import { useContactCard } from '../../hooks/useContactCard';

const ICON = {
  phone: PhoneIcon,
  instagram: AtSignIcon,
  email: MailIcon,
  other: AtSignIcon
} as const;

const TINT = {
  phone: 'bg-[#DFF3E4]',
  instagram: 'bg-[#EDE6FF]',
  email: 'bg-[#FFE1D2]',
  other: 'bg-surface'
} as const;

const ICON_COLOR = {
  phone: '#2FA85B',
  instagram: '#6B2FEA',
  email: '#FF5A1F',
  other: '#1A1A1A'
} as const;

type Props = {
  onBack?: () => void;
  /** When opened from a thread's Share, offer to send immediately */
  onShareIntoThread?: () => void;
};

export function ContactCardScreen({ onBack, onShareIntoThread }: Props) {
  const { card, loading, onToggleField } = useContactCard();
  const [editing, setEditing] = useState(false);

  if (loading || !card) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Contact card" onBack={onBack} hideProfile analyticsSurface="messages" />
        <ScreenBody>
          <Text className="font-sans-sb text-[14px] text-ink-mute">Loading…</Text>
        </ScreenBody>
      </Screen>
    );
  }

  const shown = card.fields.filter((f) => f.enabled);
  const rows = editing ? card.fields : shown;

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Contact card"
        onBack={onBack}
        hideProfile
        analyticsSurface="messages"
        trailing={
          <ButtonSecondary
            size="sm"
            tone={editing ? 'solid' : 'outline'}
            analyticsId={MESSAGES.contact_card.edit}
            onPress={() => setEditing((v) => !v)}
            accessibilityLabel={editing ? 'Done editing' : 'Edit contact card'}
          >
            {editing ? 'Done' : 'Edit'}
          </ButtonSecondary>
        }
      />

      <ScreenBody>
        <Text className="font-sans-sb text-[13px] text-ink-mute">
          Set up once · share it anytime
        </Text>

        <View className="mt-4 rounded-2xl border border-ink-line bg-surface px-5 py-6">
          <View className="items-center">
            <Avatar name={card.displayName} emoji={card.emoji} accent="teal" personId="me" size="xl" />
            <Text className="mt-3 font-sans-b text-[19px] tracking-tight text-ink">
              {card.displayName}
            </Text>
          </View>

          <View className="mt-4 gap-2.5">
            {rows.map((f) => {
              const Icon = ICON[f.kind];
              return (
                <AnalyticsRegion
                  key={f.id}
                  analyticsId={MESSAGES.contact_card.field_row}
                  interactive={false}
                  className="min-h-[44px] flex-row items-center gap-3"
                  accessibilityLabel={`${f.label}: ${f.value}`}
                >
                  <View
                    className={cn(
                      'h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      TINT[f.kind]
                    )}
                  >
                    <Icon size={16} color={ICON_COLOR[f.kind]} strokeWidth={2.6} />
                  </View>
                  <Text
                    numberOfLines={1}
                    className="min-w-0 flex-1 font-sans-sb text-[15px] text-ink"
                  >
                    {f.value}
                  </Text>
                  {editing ? (
                    <Toggle
                      checked={f.enabled}
                      onChange={(v) => void onToggleField(f.id, v)}
                      label={`${f.label} on contact card`}
                      analyticsId={MESSAGES.contact_card.field_toggle}
                    />
                  ) : null}
                </AnalyticsRegion>
              );
            })}

            {!editing && shown.length === 0 ? (
              <Text className="py-2 text-center font-sans-sb text-[13px] text-ink-mute">
                Turn on at least one field in Edit
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mt-5">
          <ButtonSecondary
            full
            size="lg"
            tone="positive"
            analyticsId={MESSAGES.contact_card.share}
            onPress={onShareIntoThread}
            accessibilityLabel="Share contact"
          >
            Share contact
          </ButtonSecondary>
          <Text className="mt-2 text-center font-sans-sb text-[12px] text-ink-mute">
            Pick what's on it · edit anytime
          </Text>
        </View>
      </ScreenBody>
    </Screen>
  );
}
