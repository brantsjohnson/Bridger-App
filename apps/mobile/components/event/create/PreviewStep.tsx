// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 4 of Create event: a read-only preview of the event exactly as guests
// will see it, then the big "Create event" button. Nothing here is editable —
// it is the last look before the event is made.
// ============================================
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react-native';
import type { Cover } from '@bridger/shared';
import { CREATE_EVENT } from '@bridger/shared';
import { AnalyticsRegion, ButtonPrimary, CoverArt, useThemeColors } from '@bridger/ui';
import { personById } from '../../../data/people';
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
  const coHosts = draft.coHostIds.map((id) => personById(id)).filter(Boolean);
  const coverBg =
    cover.kind === 'color' || cover.kind === 'text'
      ? cover.bg
      : cover.kind === 'emoji'
        ? cover.bg
        : undefined;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <AnalyticsRegion analyticsId={CREATE_EVENT.preview.summary} interactive={false}>
        <View className="gap-4 pb-6">
          <View
            className="overflow-hidden rounded-card border border-ink-line"
            style={{ aspectRatio: 16 / 9 }}
          >
            <CoverArt cover={cover} rounded />
          </View>

          {/* Color band under the title so the page feels lively */}
          <View
            className="rounded-card border border-ink-line p-4"
            style={coverBg ? { backgroundColor: `${coverBg}22` } : undefined}
          >
            <Text className="font-pixel text-[20px] text-ink">{draft.title || 'Untitled'}</Text>
            {draft.bio ? (
              <Text className="mt-1 font-sans-sb text-[14px] leading-snug text-ink-soft">
                {draft.bio}
              </Text>
            ) : null}
          </View>

          <View className="gap-2.5 rounded-card border border-ink-line bg-surface p-4">
            <Row icon={<CalendarIcon size={16} color={c.inkMute} strokeWidth={2.4} />}>
              {draft.day} · {draft.time}
            </Row>
            {draft.place || draft.address ? (
              <Row icon={<MapPinIcon size={16} color={c.inkMute} strokeWidth={2.4} />}>
                {draft.place || draft.address}
              </Row>
            ) : null}
            <Row icon={<UsersIcon size={16} color={c.inkMute} strokeWidth={2.4} />}>
              {draft.invitedIds.length} invited
              {coHosts.length
                ? ` · co-hosted with ${coHosts.map((p) => p.name.split(' ')[0]).join(', ')}`
                : ''}
              {draft.allowFriendsToInvite ? ` · cap ${draft.guestCap}` : ''}
            </Row>
          </View>

          {draft.chipInEnabled && (draft.chipInAmount || draft.chipInHandle) ? (
            <Line
              label="Chip in"
              value={[draft.chipInAmount, draft.chipInMethod, draft.chipInHandle]
                .filter(Boolean)
                .join(' · ')}
            />
          ) : null}

          {draft.assignments.length > 0 ? (
            <View className="gap-2 rounded-card border border-ink-line bg-surface p-4">
              <Text className="font-sans-b text-[13px] text-ink">Assignments</Text>
              {draft.assignments.map((a) => {
                const who = a.assigneeId ? personById(a.assigneeId) : null;
                return (
                  <View key={a.id} className="flex-row items-center justify-between">
                    <Text className="min-w-0 flex-1 font-sans-sb text-[13px] text-ink">{a.label}</Text>
                    <Text className="font-sans-b text-[13px] text-ink-mute">
                      {who ? who.name.split(' ')[0] : 'Open'}
                    </Text>
                  </View>
                );
              })}
            </View>
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

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-2.5">
      {icon}
      <Text className="min-w-0 flex-1 font-sans-sb text-[13px] text-ink">{children}</Text>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-card border border-ink-line bg-surface p-4">
      <Text className="font-sans-b text-[12px] text-ink-mute">{label}</Text>
      <Text className="mt-0.5 font-sans-sb text-[14px] text-ink">{value}</Text>
    </View>
  );
}
