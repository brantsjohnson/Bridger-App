import React from 'react';
import {
  Breathe,
  Card,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenHeader } from
'../../../../packages/ui';
import { NotificationRow } from '../../components/NotificationRow';
import { NOTIFICATIONS, personById } from '../../state/mock-data';

export function NotificationsScreen({
  empty = false,
  onBack




}: { /** day one: nobody has done anything yet */empty?: boolean;onBack?: () => void;}) {
  const items = empty ? [] : NOTIFICATIONS;

  return (
    <Screen>
      <ScreenHeader title="Notifications" onBack={onBack} />
      <ScreenBody>
        <Breathe>
          {items.length === 0 ?
          <EmptyState
            emoji="🔔"
            line="Nothing yet. When your people post or reply, it shows up here." /> :


          <Card className="space-y-1 p-1.5">
              {items.map((n, i) =>
            <NotificationRow
              key={n.id}
              person={personById(n.personId)}
              text={n.text}
              time={n.time}
              unread={i < 2} />

            )}
            </Card>
          }
        </Breathe>
      </ScreenBody>
    </Screen>);

}