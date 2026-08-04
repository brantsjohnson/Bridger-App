import React from 'react';
import { Person } from '../../../../packages/shared';
import { Avatar, Sheet } from '../../../../packages/ui';

/**
 * Undoing a block is as easy as making one. Nobody is told either way.
 */
export function BlockedPeopleSheet({
  open,
  people,
  onClose,
  onUnblock





}: {open: boolean;people: Person[];onClose: () => void;onUnblock: (id: string) => void;}) {
  return (
    <Sheet open={open} onClose={onClose} title="Blocked people">
      {people.length === 0 ?
      <p className="py-6 text-center text-[14px] font-semibold text-ink-mute">
          Nobody is blocked.
        </p> :

      <>
          <p className="mb-3 text-[13px] font-semibold leading-snug text-ink-mute">
            They cannot find you, message you, or see anything you post. They were not told, and
            they will not be told if you unblock them.
          </p>
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {people.map((p) =>
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-2.5">
            
                <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                  {p.name}
                </span>
                <button
              type="button"
              onClick={() => onUnblock(p.id)}
              className="shrink-0 rounded-full border border-ink-line bg-white px-3.5 py-1.5 text-[12px] font-bold text-ink transition-colors hover:bg-[#F1ECFF]">
              
                  Unblock
                </button>
              </li>
          )}
          </ul>
        </>
      }
    </Sheet>);

}