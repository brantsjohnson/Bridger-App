// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 4 of Create event: a read-only preview of the event exactly as guests
// (and you, as host) will see it on the event page, then the big "Create event"
// button. Layout matches the event detail screen so nothing surprises you after
// you tap Create. No invited totals or guest caps here — vanity numbers stay out.
// ============================================
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ClockIcon, HandCoinsIcon, MapPinIcon } from 'lucide-react-native';
import type { Cover } from '@bridger/shared';
import { CREATE_EVENT, formatRecurrenceLabel } from '@bridger/shared';
import {
  AnalyticsRegion,
  Avatar,
  ButtonPrimary,
  Card,
  CoverArt,
  PixelHeading,
  useThemeColors
} from '@bridger/ui';
import { getMe, personById } from '../../../data/people';
import type { CreateEventDraft } from './types';

export function PreviewStep({
  draft,
  creating,
  onCreate
}: {
  draft: CreateEventDraft;
  creating: boolean;
  onCreate: () => void;
}) {
  const c = useThemeColors();
  // Mirror what createEvent does: no cover picked = a friendly emoji stand-in.
  const cover: Cover = draft.cover ?? { kind: 'emoji', value: '🎉', bg: '#9B5DE5' };
  const me = getMe();
  const coHosts = draft.coHostIds.map((id) => personById(id)).filter(Boolean);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <AnalyticsRegion analyticsId={CREATE_EVENT.preview.summary} interactive={false}>
        <View className="gap-6 pb-6">
          {/* Same hero card shape as the live event page */}
          <Card className="overflow-hidden p-0">
            <View className="h-28">
              <CoverArt cover={cover} />
            </View>
            <View className="gap-3 p-4">
              <Text className="font-sans-b text-[22px] leading-tight tracking-tight text-ink">
                {draft.title || 'Untitled'}
              </Text>
              <View className="flex-row items-center gap-2">
                <Avatar name={me.name} emoji={me.emoji} accent={me.accent} size="sm" />
                <Text className="min-w-0 flex-1 font-sans-sb text-[13px] text-ink">
                  Hosted by {me.name}
                  {coHosts.length > 0 ? (
                    <Text className="text-ink-mute">
                      {' '}
                      with {coHosts.map((p) => p.name.split(' ')[0]).join(' & ')}
                    </Text>
                  ) : null}
                </Text>
              </View>
            </View>
          </Card>

          <View>
            <PixelHeading size="md" className="mb-3">
              The details
            </PixelHeading>
            <Card className="gap-3.5">
              {draft.bio ? (
                <Text className="font-sans-sb text-[14px] leading-relaxed text-ink">
                  {draft.bio}
                </Text>
              ) : null}
              <View className={draft.bio ? 'gap-3 border-t border-ink-line pt-3.5' : 'gap-3'}>
                <DetailRow
                  icon={<ClockIcon size={16} color={c.inkMute} strokeWidth={2.4} />}
                  label="When"
                >
                  <Text className="font-sans-b text-[14px] leading-snug text-ink">
                    {draft.day} at {draft.time}
                  </Text>
                  {draft.repeats && draft.recurrence ? (
                    <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft">
                      {formatRecurrenceLabel(draft.recurrence)}
                    </Text>
                  ) : null}
                </DetailRow>
                {draft.place || draft.address ? (
                  <DetailRow
                    icon={<MapPinIcon size={16} color={c.inkMute} strokeWidth={2.4} />}
                    label="Where"
                  >
                    <Text className="font-sans-b text-[14px] leading-snug text-ink">
                      {draft.place || 'TBD'}
                    </Text>
                    {draft.address ? (
                      <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft">
                        {draft.address}
                      </Text>
                    ) : null}
                  </DetailRow>
                ) : null}
                {draft.chipInEnabled && (draft.chipInAmount || draft.chipInHandle) ? (
                  <DetailRow
                    icon={<HandCoinsIcon size={16} color={c.inkMute} strokeWidth={2.4} />}
                    label="Chip in"
                  >
                    <Text className="font-sans-b text-[14px] leading-snug text-ink">
                      {draft.chipInAmount ? `${draft.chipInAmount} each` : 'Chip in'}
                    </Text>
                    <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft">
                      {draft.chipInMethod === 'Cash in person'
                        ? 'Cash, in person'
                        : [draft.chipInMethod, draft.chipInHandle].filter(Boolean).join(' · ')}
                    </Text>
                  </DetailRow>
                ) : null}
              </View>
            </Card>
          </View>

          {draft.assignments.length > 0 ? (
            <View>
              <PixelHeading size="md" className="mb-3">
                Assignments
              </PixelHeading>
              <Card className="gap-2">
                {draft.assignments.map((a) => {
                  const who = a.assigneeId ? personById(a.assigneeId) : null;
                  return (
                    <View key={a.id} className="flex-row items-center justify-between">
                      <Text className="min-w-0 flex-1 font-sans-sb text-[13px] text-ink">
                        {a.label}
                      </Text>
                      <Text className="font-sans-b text-[13px] text-ink-mute">
                        {who ? who.name.split(' ')[0] : 'Open'}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            </View>
          ) : null}

          {draft.allowFriendsToInvite ? (
            <Text className="font-sans-sb text-[12px] leading-snug text-ink-mute">
              Friends can invite friends. After you create, share the link to bring someone along.
            </Text>
          ) : null}
        </View>
      </AnalyticsRegion>

      <ButtonPrimary
        full
        size="lg"
        loading={creating}
        onPress={onCreate}
        analyticsId={CREATE_EVENT.preview.create}
        accessibilityLabel="Create event"
      >
        Create event
      </ButtonPrimary>
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  children
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-0.5">{icon}</View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
          {label}
        </Text>
        <View className="mt-0.5">{children}</View>
      </View>
    </View>
  );
}
