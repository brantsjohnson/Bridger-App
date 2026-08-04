import React from 'react';
import { Avatar, Badge, ListRow, Sheet, cn } from '../../../../packages/ui';
import { personById } from '../../state/mock-data';

type Tab = 'going' | 'invited';

/**
 * Tapping "3 going" or "6 invited" opens this. Two tabs, because from the
 * host's side those are the same question asked twice.
 */
export function EventPeopleSheet({
  open,
  initialTab = 'going',
  goingIds,
  invitedIds,
  coHostIds = [],
  onClose







}: {open: boolean;initialTab?: Tab;goingIds: string[];invitedIds: string[];coHostIds?: string[];onClose: () => void;}) {
  const [tab, setTab] = React.useState<Tab>(initialTab);

  React.useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  /** invited-but-not-going is the useful half of "invited" */
  const yetToAnswer = invitedIds.filter((id) => !goingIds.includes(id));
  const list = tab === 'going' ? goingIds : invitedIds;

  return (
    <Sheet open={open} onClose={onClose} title="Who's coming">
      <div className="space-y-4">
        <div role="tablist" className="flex gap-2">
          {(
          [
          ['going', `${goingIds.length} going`],
          ['invited', `${invitedIds.length} invited`]] as
          Array<[Tab, string]>).
          map(([key, label]) =>
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-full px-3 py-2.5 text-[13px] font-bold transition-colors',
              tab === key ?
              'bg-ink text-white' :
              'border border-ink-line bg-white text-ink hover:bg-[#F1ECFF]'
            )}>
            
              {label}
            </button>
          )}
        </div>

        {tab === 'invited' && yetToAnswer.length > 0 &&
        <p className="text-[12px] font-semibold text-ink-mute">
            {yetToAnswer.length} {yetToAnswer.length === 1 ? 'person has' : 'people have'} not
            answered yet.
          </p>
        }

        <div className="space-y-2.5">
          {list.map((id) => {
            const p = personById(id);
            const isCoHost = coHostIds.includes(id);
            const answered = goingIds.includes(id);
            return (
              <ListRow
                key={id}
                leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />}
                label={p.name}
                sublabel={p.tier === 'none' ? 'Worth meeting' : `${p.mutuals} mutual friends`}
                action={
                isCoHost ?
                <Badge tone="active">Co-host</Badge> :
                tab === 'invited' && !answered ?
                <Badge tone="neutral">No answer</Badge> :

                <Badge tone="active">Going</Badge>

                } />);


          })}
        </div>
      </div>
    </Sheet>);

}